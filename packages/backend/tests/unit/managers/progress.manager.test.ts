import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressManager } from '../../../src/managers/progress.manager';
import { DomainError, MILESTONE_NOT_FOUND } from '../../../src/shared/errors';
import type { RequestContext } from '../../../src/shared/types';
import { makeDebt, makePayment, makeMilestone } from '../skills/helpers';

const mockRecordPaymentSkill = {
  record: vi.fn(),
};

const mockUpcomingPaymentAlertsSkill = {
  detect: vi.fn(),
};

const mockPaymentRepo = {
  create: vi.fn(),
  findByIdempotencyKey: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  findByDebtId: vi.fn(),
  countByFinancialSpaceId: vi.fn(),
};

const mockMilestoneRepo = {
  create: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  findByTypeAndScope: vi.fn(),
  acknowledgeById: vi.fn(),
};

const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  updateBalance: vi.fn(),
  archive: vi.fn(),
  update: vi.fn(),
  toggleSharing: vi.fn(),
};

const context: RequestContext = {
  userId: 'user-1',
  email: 'owner@example.com',
  profileId: 'profile-1',
  financialSpaceId: 'space-1',
  role: 'owner',
};

describe('ProgressManager', () => {
  let manager: ProgressManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ProgressManager(
      mockRecordPaymentSkill as any,
      mockUpcomingPaymentAlertsSkill as any,
      mockPaymentRepo as any,
      mockMilestoneRepo as any,
      mockDebtRepo as any
    );
  });

  describe('recordPayment', () => {
    it('delegates to recordPaymentSkill with correct args', async () => {
      const payment = makePayment();
      const debt = makeDebt();
      mockRecordPaymentSkill.record.mockResolvedValue({ payment, debt, milestones: [] });

      const input = {
        debtId: 'debt-1',
        amount: 50000,
        idempotencyKey: 'idem-key-1',
      };

      const result = await manager.recordPayment(context, input);

      expect(mockRecordPaymentSkill.record).toHaveBeenCalledWith({
        financialSpaceId: 'space-1',
        recordedByUserId: 'user-1',
        debtId: 'debt-1',
        amount: 50000,
        paidAt: undefined,
        idempotencyKey: 'idem-key-1',
      });
      expect(result.payment).toEqual(payment);
    });

    it('passes paidAt when provided', async () => {
      const paidAt = new Date('2026-04-01');
      mockRecordPaymentSkill.record.mockResolvedValue({
        payment: makePayment(),
        debt: makeDebt(),
        milestones: [],
      });

      await manager.recordPayment(context, {
        debtId: 'debt-1',
        amount: 50000,
        paidAt,
        idempotencyKey: 'idem-key-2',
      });

      expect(mockRecordPaymentSkill.record).toHaveBeenCalledWith(
        expect.objectContaining({ paidAt })
      );
    });
  });

  describe('getPaymentHistory', () => {
    it('calls paymentRepo.findByFinancialSpaceId with spaceId', async () => {
      const payments = [makePayment()];
      mockPaymentRepo.findByFinancialSpaceId.mockResolvedValue(payments);

      const result = await manager.getPaymentHistory(context);

      expect(mockPaymentRepo.findByFinancialSpaceId).toHaveBeenCalledWith('space-1', {
        debtId: undefined,
      });
      expect(result).toEqual(payments);
    });

    it('passes debtId filter when provided', async () => {
      mockPaymentRepo.findByFinancialSpaceId.mockResolvedValue([]);

      await manager.getPaymentHistory(context, { debtId: 'debt-1' });

      expect(mockPaymentRepo.findByFinancialSpaceId).toHaveBeenCalledWith('space-1', {
        debtId: 'debt-1',
      });
    });
  });

  describe('getUpcomingAlerts', () => {
    it('fetches active debts then calls alertsSkill.detect', async () => {
      const debts = [makeDebt({ status: 'active' })];
      const alerts = [{ debtId: 'debt-1', label: 'Tarjeta BCI', daysUntilDue: 2 }];

      mockDebtRepo.findByFinancialSpaceId.mockResolvedValue(debts);
      mockUpcomingPaymentAlertsSkill.detect.mockReturnValue(alerts);

      const result = await manager.getUpcomingAlerts(context);

      expect(mockDebtRepo.findByFinancialSpaceId).toHaveBeenCalledWith('space-1', { status: 'active' });
      expect(mockUpcomingPaymentAlertsSkill.detect).toHaveBeenCalledWith(debts);
      expect(result).toEqual(alerts);
    });
  });

  describe('getMilestones', () => {
    it('calls milestoneRepo.findByFinancialSpaceId with spaceId', async () => {
      const milestones = [makeMilestone()];
      mockMilestoneRepo.findByFinancialSpaceId.mockResolvedValue(milestones);

      const result = await manager.getMilestones(context);

      expect(mockMilestoneRepo.findByFinancialSpaceId).toHaveBeenCalledWith('space-1');
      expect(result).toEqual(milestones);
    });
  });

  describe('acknowledgeMilestone', () => {
    it('throws MILESTONE_NOT_FOUND if milestone not in space', async () => {
      mockMilestoneRepo.findByFinancialSpaceId.mockResolvedValue([
        makeMilestone({ id: 'milestone-99' }),
      ]);

      await expect(
        manager.acknowledgeMilestone(context, 'milestone-wrong-id')
      ).rejects.toMatchObject({
        code: MILESTONE_NOT_FOUND,
        httpStatus: 404,
      });

      expect(mockMilestoneRepo.acknowledgeById).not.toHaveBeenCalled();
    });

    it('calls milestoneRepo.acknowledgeById on success', async () => {
      const milestone = makeMilestone({ id: 'milestone-1' });
      const acknowledged = { ...milestone, acknowledgedAt: new Date() };
      mockMilestoneRepo.findByFinancialSpaceId.mockResolvedValue([milestone]);
      mockMilestoneRepo.acknowledgeById.mockResolvedValue(acknowledged);

      const result = await manager.acknowledgeMilestone(context, 'milestone-1');

      expect(mockMilestoneRepo.acknowledgeById).toHaveBeenCalledWith('milestone-1');
      expect(result).toEqual(acknowledged);
    });
  });
});
