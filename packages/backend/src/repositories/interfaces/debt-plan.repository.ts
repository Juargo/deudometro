import type { DebtPlan, Prisma } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreateDebtPlanInput {
  financialSpaceId: string;
  createdByUserId: string;
  strategyType: 'avalanche' | 'snowball' | 'hybrid' | 'crisis_first' | 'guided_consolidation';
  monthlyIncomeSnapshot: Prisma.Decimal;
  availableCapitalSnapshot: Prisma.Decimal;
  totalFixedCostsSnapshot: Prisma.Decimal;
  reservePercentage: Prisma.Decimal;
  monthlyBudget: Prisma.Decimal;
  aiAnalysis?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
  aiPrompt?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
}

export interface IDebtPlanRepository {
  create(input: CreateDebtPlanInput, tx?: TransactionContext): Promise<DebtPlan>;
  findById(id: string, tx?: TransactionContext): Promise<DebtPlan | null>;
  findActiveBySpaceId(financialSpaceId: string, tx?: TransactionContext): Promise<DebtPlan | null>;
  findAllBySpaceId(financialSpaceId: string, tx?: TransactionContext): Promise<DebtPlan[]>;
  supersedePreviousPlans(financialSpaceId: string, tx?: TransactionContext): Promise<void>;
  updateAiAnalysis(id: string, aiAnalysis: Prisma.InputJsonValue, tx?: TransactionContext): Promise<DebtPlan>;
}
