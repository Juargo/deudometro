import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileManager } from '../../../src/managers/profile.manager';
import { DomainError, PROFILE_NOT_FOUND } from '../../../src/shared/errors';
import { makeProfile, makeDebt } from '../skills/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import type { RequestContext } from '../../../src/shared/types';

const mockUpdateProfileSkill = { update: vi.fn() };
const mockBudgetSkill = { calculate: vi.fn() };
const mockProfileRepo = {
  findBySupabaseUserId: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
};
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

const fakeBudget = {
  effectiveIncome: new Decimal('500000'),
  incomeSource: 'salary' as const,
  totalFixedCosts: new Decimal('0'),
  netAfterExpenses: new Decimal('500000'),
  reserveAmount: new Decimal('50000'),
  availableBudget: new Decimal('450000'),
  minimumPaymentsTotal: null,
  budgetWarning: false,
};

describe('ProfileManager', () => {
  let manager: ProfileManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ProfileManager(
      mockUpdateProfileSkill as any,
      mockBudgetSkill as any,
      mockProfileRepo as any,
      mockDebtRepo as any
    );
  });

  describe('getFinancialSummary', () => {
    it('returns profile and budget for the context', async () => {
      const profile = makeProfile();
      mockProfileRepo.findById.mockResolvedValue(profile);
      mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([]);
      mockBudgetSkill.calculate.mockReturnValue(fakeBudget);

      const result = await manager.getFinancialSummary(makeContext());

      expect(result.profile).toEqual(profile);
      expect(result.budget).toEqual(fakeBudget);
    });

    it('filters visible debts only when computing minimums', async () => {
      const profile = makeProfile();
      const ownDebt = makeDebt({ createdByUserId: 'user-1', isShared: false });
      const sharedDebt = makeDebt({ id: 'debt-2', createdByUserId: 'user-2', isShared: true });
      const hiddenDebt = makeDebt({ id: 'debt-3', createdByUserId: 'user-2', isShared: false });

      mockProfileRepo.findById.mockResolvedValue(profile);
      mockDebtRepo.findByFinancialSpaceId.mockResolvedValue([ownDebt, sharedDebt, hiddenDebt]);
      mockBudgetSkill.calculate.mockReturnValue(fakeBudget);

      await manager.getFinancialSummary(makeContext());

      // Should only pass minimums for ownDebt and sharedDebt (not hiddenDebt)
      expect(mockBudgetSkill.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          activeDebtMinimums: [ownDebt.minimumPayment, sharedDebt.minimumPayment],
        })
      );
    });

    it('throws PROFILE_NOT_FOUND when profile does not exist', async () => {
      mockProfileRepo.findById.mockResolvedValue(null);

      await expect(
        manager.getFinancialSummary(makeContext())
      ).rejects.toMatchObject({ code: PROFILE_NOT_FOUND, httpStatus: 404 });
    });
  });

  describe('updateFinancialProfile', () => {
    it('delegates to UpdateFinancialProfileSkill and returns updated profile', async () => {
      const updatedProfile = makeProfile({ monthlyIncome: new Decimal('800000') });
      mockUpdateProfileSkill.update.mockResolvedValue(updatedProfile);

      const result = await manager.updateFinancialProfile(makeContext(), {
        monthlyIncome: 800000,
      });

      expect(result).toEqual(updatedProfile);
      const callArg = mockUpdateProfileSkill.update.mock.calls[0][0];
      expect(callArg.profileId).toBe('profile-1');
      expect(callArg.monthlyIncome?.toString()).toBe('800000');
    });
  });
});
