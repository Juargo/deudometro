import type { PlanAction, Prisma, DebtType } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreatePlanActionInput {
  debtPlanId: string;
  debtId: string;
  debtLabel: string;
  debtType: DebtType;
  month: number;
  paymentAmount: Prisma.Decimal;
  principalAmount: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  runningBalance: Prisma.Decimal;
}

export interface IPlanActionRepository {
  createMany(actions: CreatePlanActionInput[], tx?: TransactionContext): Promise<void>;
  findByPlanId(debtPlanId: string, tx?: TransactionContext): Promise<PlanAction[]>;
}
