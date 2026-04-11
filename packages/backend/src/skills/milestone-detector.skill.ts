import { Prisma } from '@prisma/client';
import type { MilestoneType } from '@prisma/client';
import type { TransactionContext } from '../shared/types';
import type { IPaymentRepository } from '../repositories/interfaces/payment.repository';
import type { IMilestoneRepository, CreateMilestoneInput } from '../repositories/interfaces/milestone.repository';
import type { IDebtRepository } from '../repositories/interfaces/debt.repository';

export interface MilestoneDetectorInput {
  financialSpaceId: string;
  debtId: string;
  newBalance: Prisma.Decimal;
  tx?: TransactionContext;
}

export class MilestoneDetectorSkill {
  constructor(
    private readonly milestoneRepo: IMilestoneRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly debtRepo: IDebtRepository
  ) {}

  async detect(input: MilestoneDetectorInput): Promise<CreateMilestoneInput[]> {
    const { financialSpaceId, debtId, newBalance, tx } = input;
    const candidates: CreateMilestoneInput[] = [];

    // 1. First payment milestone
    const paymentCount = await this.paymentRepo.countByFinancialSpaceId(financialSpaceId, tx);
    if (paymentCount === 1) {
      const existing = await this.milestoneRepo.findByTypeAndScope(
        financialSpaceId,
        'first_payment',
        null,
        tx
      );
      if (!existing) {
        candidates.push({
          financialSpaceId,
          milestoneType: 'first_payment',
          message: 'You made your first payment! Keep it up.',
        });
      }
    }

    // 2. Debt paid off milestone
    if (newBalance.equals(new Prisma.Decimal(0))) {
      candidates.push({
        financialSpaceId,
        milestoneType: 'debt_paid_off',
        debtId,
        message: 'Congratulations! You paid off a debt completely.',
      });
    }

    // 3. Total balance reduction milestones
    const allDebts = await this.debtRepo.findByFinancialSpaceId(
      financialSpaceId,
      { status: 'active' },
      tx
    );

    if (allDebts.length > 0) {
      const sumOriginal = allDebts.reduce(
        (sum, d) => sum.add(d.originalBalance),
        new Prisma.Decimal(0)
      );

      // Apply new balance to the current debt for accurate ratio
      const sumRemaining = allDebts.reduce((sum, d) => {
        const balance = d.id === debtId ? newBalance : d.remainingBalance;
        return sum.add(balance);
      }, new Prisma.Decimal(0));

      if (sumOriginal.greaterThan(new Prisma.Decimal(0))) {
        const ratio = sumRemaining.div(sumOriginal);

        const thresholds: Array<{ ratio: number; type: MilestoneType; message: string }> = [
          {
            ratio: 0.75,
            type: 'total_reduced_25pct',
            message: 'Amazing! You\'ve reduced your total debt by 25%.',
          },
          {
            ratio: 0.50,
            type: 'total_reduced_50pct',
            message: 'Halfway there! You\'ve reduced your total debt by 50%.',
          },
          {
            ratio: 0.25,
            type: 'total_reduced_75pct',
            message: 'Almost done! You\'ve reduced your total debt by 75%.',
          },
        ];

        for (const threshold of thresholds) {
          if (ratio.lessThanOrEqualTo(new Prisma.Decimal(threshold.ratio))) {
            const existing = await this.milestoneRepo.findByTypeAndScope(
              financialSpaceId,
              threshold.type,
              null,
              tx
            );
            if (!existing) {
              candidates.push({
                financialSpaceId,
                milestoneType: threshold.type,
                message: threshold.message,
              });
            }
          }
        }
      }
    }

    return candidates;
  }
}
