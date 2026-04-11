import type { Payment, Milestone } from '@prisma/client';
import type { RecordPaymentSkill } from '../skills/record-payment.skill';
import type { UpcomingPaymentAlertsSkill, UpcomingAlert } from '../skills/upcoming-payment-alerts.skill';
import type { IPaymentRepository } from '../repositories/interfaces/payment.repository';
import type { IMilestoneRepository } from '../repositories/interfaces/milestone.repository';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import type { RequestContext } from '../shared/types';
import { DomainError, MILESTONE_NOT_FOUND } from '../shared/errors';

export interface RecordPaymentManagerInput {
  debtId: string;
  amount: number;
  paidAt?: Date;
  idempotencyKey: string;
}

export class ProgressManager {
  constructor(
    private readonly recordPaymentSkill: RecordPaymentSkill,
    private readonly upcomingPaymentAlertsSkill: UpcomingPaymentAlertsSkill,
    private readonly paymentRepo: IPaymentRepository,
    private readonly milestoneRepo: IMilestoneRepository,
    private readonly debtRepo: IDebtRepository
  ) {}

  async recordPayment(context: RequestContext, input: RecordPaymentManagerInput) {
    return this.recordPaymentSkill.record({
      financialSpaceId: context.financialSpaceId!,
      recordedByUserId: context.userId,
      debtId: input.debtId,
      amount: input.amount,
      paidAt: input.paidAt,
      idempotencyKey: input.idempotencyKey,
    });
  }

  async getPaymentHistory(context: RequestContext, options?: { debtId?: string }): Promise<Payment[]> {
    return this.paymentRepo.findByFinancialSpaceId(context.financialSpaceId!, {
      debtId: options?.debtId,
    });
  }

  async getUpcomingAlerts(context: RequestContext): Promise<UpcomingAlert[]> {
    const activeDebts = await this.debtRepo.findByFinancialSpaceId(
      context.financialSpaceId!,
      { status: 'active' }
    );
    return this.upcomingPaymentAlertsSkill.detect(activeDebts);
  }

  async getMilestones(context: RequestContext): Promise<Milestone[]> {
    return this.milestoneRepo.findByFinancialSpaceId(context.financialSpaceId!);
  }

  async acknowledgeMilestone(context: RequestContext, milestoneId: string): Promise<Milestone> {
    const milestones = await this.milestoneRepo.findByFinancialSpaceId(context.financialSpaceId!);
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new DomainError(MILESTONE_NOT_FOUND, 404, 'Milestone not found');
    }
    return this.milestoneRepo.acknowledgeById(milestoneId);
  }
}
