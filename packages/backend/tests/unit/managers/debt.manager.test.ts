import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtManager } from '../../../src/managers/debt.manager';
import { DomainError, DEBT_NOT_FOUND, DEBT_NOT_IN_SPACE, DEBT_NOT_VISIBLE } from '../../../src/shared/errors';
import { makeDebt } from '../skills/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import type { RequestContext } from '../../../src/shared/types';

const mockDebtCreatorSkill = { create: vi.fn() };
const mockDebtUpdaterSkill = { update: vi.fn() };
const mockDebtArchiverSkill = { archive: vi.fn() };
const mockDebtPayoffSkill = { markPaid: vi.fn() };
const mockDebtSharingTogglerSkill = { toggle: vi.fn() };
const mockCriticalDetectorSkill = { detect: vi.fn() };
const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  updateShared: vi.fn(),
};

const makeContext = (overrides: Partial<RequestContext> = {}): RequestContext => ({
  userId: 'user-1',
  profileId: 'profile-1',
  financialSpaceId: 'space-1',
  role: 'owner',
  ...overrides,
});

describe('DebtManager', () => {
  let manager: DebtManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: detect returns whatever debt is passed with isCritical=false
    mockCriticalDetectorSkill.detect.mockImplementation((debts) =>
      debts.map((d: any) => ({ ...d, isCritical: false }))
    );
    manager = new DebtManager(
      mockDebtCreatorSkill as any,
      mockDebtUpdaterSkill as any,
      mockDebtArchiverSkill as any,
      mockDebtPayoffSkill as any,
      mockDebtSharingTogglerSkill as any,
      mockCriticalDetectorSkill as any,
      mockDebtRepo as any
    );
  });

  describe('listDebts', () => {
    it('returns only visible debts (isShared || createdByUserId matches)', async () => {
      const ownDebt = makeDebt({ createdByUserId: 'user-1', isShared: false });
      const sharedDebt = makeDebt({ id: 'debt-2', createdByUserId: 'user-2', isShared: true });
      const hiddenDebt = makeDebt({ id: 'debt-3', createdByUserId: 'user-2', isShared: false });

      mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([ownDebt, sharedDebt, hiddenDebt]);

      const result = await manager.listDebts(makeContext());

      expect(mockCriticalDetectorSkill.detect).toHaveBeenCalledWith([ownDebt, sharedDebt]);
      expect(result).toHaveLength(2);
    });

    it('excludes non-shared debts from other users', async () => {
      const hiddenDebt = makeDebt({ createdByUserId: 'user-2', isShared: false });
      mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([hiddenDebt]);

      const result = await manager.listDebts(makeContext());

      expect(mockCriticalDetectorSkill.detect).toHaveBeenCalledWith([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getDebt', () => {
    it('throws DEBT_NOT_VISIBLE for non-shared debt from another user', async () => {
      const debt = makeDebt({ createdByUserId: 'user-2', isShared: false });
      mockDebtRepo.findById.mockResolvedValue(debt);

      await expect(
        manager.getDebt(makeContext(), 'debt-1')
      ).rejects.toMatchObject({ code: DEBT_NOT_VISIBLE, httpStatus: 403 });
    });

    it('succeeds for a shared debt from another user', async () => {
      const debt = makeDebt({ createdByUserId: 'user-2', isShared: true });
      mockDebtRepo.findById.mockResolvedValue(debt);

      const result = await manager.getDebt(makeContext(), 'debt-1');

      expect(result).toMatchObject({ id: 'debt-1', isCritical: false });
    });

    it('throws DEBT_NOT_FOUND when debt does not exist', async () => {
      mockDebtRepo.findById.mockResolvedValue(null);

      await expect(
        manager.getDebt(makeContext(), 'nonexistent')
      ).rejects.toMatchObject({ code: DEBT_NOT_FOUND, httpStatus: 404 });
    });

    it('throws DEBT_NOT_IN_SPACE when debt belongs to another space', async () => {
      const debt = makeDebt({ financialSpaceId: 'other-space', createdByUserId: 'user-1' });
      mockDebtRepo.findById.mockResolvedValue(debt);

      await expect(
        manager.getDebt(makeContext(), 'debt-1')
      ).rejects.toMatchObject({ code: DEBT_NOT_IN_SPACE, httpStatus: 403 });
    });
  });

  describe('createDebt', () => {
    it('annotates created debt with isCritical flag', async () => {
      const debt = makeDebt();
      mockDebtCreatorSkill.create.mockResolvedValue(debt);
      mockCriticalDetectorSkill.detect.mockReturnValue([{ ...debt, isCritical: true }]);

      const result = await manager.createDebt(makeContext(), {
        label: 'Tarjeta BCI',
        debtType: 'credit_card',
        lenderName: 'BCI',
        balance: 1000000,
        monthlyInterestRate: 3.5,
        minimumPayment: 25000,
        paymentDueDay: 15,
      });

      expect(result.isCritical).toBe(true);
      expect(mockCriticalDetectorSkill.detect).toHaveBeenCalledWith([debt]);
    });
  });

  describe('toggleShared', () => {
    it('passes callerRole from context to the toggler skill', async () => {
      const debt = makeDebt({ isShared: true });
      mockDebtSharingTogglerSkill.toggle.mockResolvedValue(debt);

      await manager.toggleShared(makeContext({ role: 'owner' }), 'debt-1', true);

      expect(mockDebtSharingTogglerSkill.toggle).toHaveBeenCalledWith(
        expect.objectContaining({ callerRole: 'owner' })
      );
    });
  });
});
