import { Prisma, type PrismaClient, type Payment, type Debt, type Milestone } from '@prisma/client';
import type { IPaymentRepository } from '../repositories/interfaces/payment.repository';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';
import type { IMilestoneRepository } from '../repositories/interfaces/milestone.repository';
import type { MilestoneDetectorSkill } from './milestone-detector.skill';
import {
  DomainError,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
  DEBT_ALREADY_PAID,
  INVALID_PAYMENT_AMOUNT,
  PAYMENT_EXCEEDS_BALANCE,
} from '../shared/errors';
import { logger } from '../config/logger';

export interface RecordPaymentInput {
  financialSpaceId: string;
  recordedByUserId: string;
  debtId: string;
  amount: number;
  paidAt?: Date;
  idempotencyKey: string;
}

export interface RecordPaymentResult {
  payment: Payment;
  debt: Debt;
  milestones: Milestone[];
}

export class RecordPaymentSkill {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentRepo: IPaymentRepository,
    private readonly debtRepo: IDebtRepository,
    private readonly milestoneRepo: IMilestoneRepository,
    private readonly milestoneDetector: MilestoneDetectorSkill
  ) {}

  async record(input: RecordPaymentInput): Promise<RecordPaymentResult> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Idempotency check
      const existing = await this.paymentRepo.findByIdempotencyKey(input.idempotencyKey, tx);
      if (existing) {
        const debt = await this.debtRepo.findById(existing.debtId, tx);
        logger.info(
          { operation: 'payment.record', idempotencyKey: input.idempotencyKey },
          'Duplicate payment request — returning existing'
        );
        return { payment: existing, debt: debt!, milestones: [] };
      }

      // 2. Fetch and validate debt
      const debt = await this.debtRepo.findById(input.debtId, tx);
      if (!debt) {
        throw new DomainError(DEBT_NOT_FOUND, 404, 'Debt not found');
      }
      if (debt.financialSpaceId !== input.financialSpaceId) {
        throw new DomainError(DEBT_NOT_IN_SPACE, 403, 'Debt does not belong to this financial space');
      }
      if (debt.status === 'paid_off') {
        throw new DomainError(DEBT_ALREADY_PAID, 422, 'Debt is already paid off');
      }

      // 3. Validate amount
      const amount = new Prisma.Decimal(input.amount);
      if (amount.lessThanOrEqualTo(new Prisma.Decimal(0))) {
        throw new DomainError(INVALID_PAYMENT_AMOUNT, 422, 'Payment amount must be greater than zero');
      }
      if (amount.greaterThan(debt.remainingBalance)) {
        throw new DomainError(
          PAYMENT_EXCEEDS_BALANCE,
          422,
          'Payment amount exceeds remaining balance'
        );
      }

      // 4. Compute breakdown
      // interest = min(remainingBalance * rate/100, amount)
      const monthlyRate = debt.monthlyInterestRate.div(new Prisma.Decimal(100));
      const maxInterest = debt.remainingBalance.mul(monthlyRate);
      const interestAmount = Prisma.Decimal.min(maxInterest, amount);
      const principalAmount = amount.sub(interestAmount);
      const newBalance = debt.remainingBalance.sub(amount);
      const newStatus = newBalance.equals(new Prisma.Decimal(0)) ? 'paid_off' : 'active';

      // 5. Create payment
      const payment = await this.paymentRepo.create(
        {
          debtId: input.debtId,
          financialSpaceId: input.financialSpaceId,
          recordedByUserId: input.recordedByUserId,
          amount,
          principalAmount,
          interestAmount,
          paidAt: input.paidAt ?? new Date(),
          idempotencyKey: input.idempotencyKey,
        },
        tx
      );

      // 6. Update debt balance and status
      const updatedDebt = await this.debtRepo.updateBalance(input.debtId, newBalance, newStatus as import('@prisma/client').DebtStatus, tx);

      // 7. Detect and create milestones
      const milestoneCandidates = await this.milestoneDetector.detect({
        financialSpaceId: input.financialSpaceId,
        debtId: input.debtId,
        newBalance,
        tx,
      });

      const milestones: Milestone[] = [];
      for (const candidate of milestoneCandidates) {
        const milestone = await this.milestoneRepo.create(candidate, tx);
        milestones.push(milestone);
      }

      logger.info(
        {
          operation: 'payment.record',
          paymentId: payment.id,
          debtId: input.debtId,
          amount: input.amount,
          milestonesCreated: milestones.length,
        },
        'Payment recorded'
      );

      return { payment, debt: updatedDebt, milestones };
    });
  }
}
