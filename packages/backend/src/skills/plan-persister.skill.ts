import { Prisma, type PrismaClient, type DebtPlan } from '@prisma/client';
import type { IDebtPlanRepository } from '../repositories/interfaces/debt-plan.repository';
import type { IPlanActionRepository } from '../repositories/interfaces/plan-action.repository';
import type { AiAnalysisOutput } from './claude-client.skill';
import type { SortStrategy } from './strategy-sorter.skill';
import { DomainError, PLAN_GENERATION_FAILED } from '../shared/errors';
import { logger } from '../config/logger';

export interface PlanActionForPersist {
  debtId: string;
  debtLabel: string;
  debtType: string;
  month: number;
  paymentAmount: Prisma.Decimal;
  principalAmount: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  runningBalance: Prisma.Decimal;
}

export interface PlanPersisterInput {
  financialSpaceId: string;
  createdByUserId: string;
  strategyType: SortStrategy;
  monthlyIncomeSnapshot: Prisma.Decimal;
  availableCapitalSnapshot: Prisma.Decimal;
  totalFixedCostsSnapshot: Prisma.Decimal;
  reservePercentage: Prisma.Decimal;
  monthlyBudget: Prisma.Decimal;
  aiAnalysis: AiAnalysisOutput | null;
  aiPrompt: { systemPrompt: string; userPrompt: string };
  actions: PlanActionForPersist[];
}

export class PlanPersisterSkill {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly debtPlanRepo: IDebtPlanRepository,
    private readonly planActionRepo: IPlanActionRepository
  ) {}

  async persist(input: PlanPersisterInput): Promise<{ plan: DebtPlan; actionsCount: number }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.debtPlanRepo.supersedePreviousPlans(input.financialSpaceId, tx);

        const plan = await this.debtPlanRepo.create(
          {
            financialSpaceId: input.financialSpaceId,
            createdByUserId: input.createdByUserId,
            strategyType: input.strategyType,
            monthlyIncomeSnapshot: input.monthlyIncomeSnapshot,
            availableCapitalSnapshot: input.availableCapitalSnapshot,
            totalFixedCostsSnapshot: input.totalFixedCostsSnapshot,
            reservePercentage: input.reservePercentage,
            monthlyBudget: input.monthlyBudget,
            aiAnalysis: input.aiAnalysis ?? Prisma.DbNull,
            aiPrompt: input.aiPrompt as Prisma.InputJsonValue,
          },
          tx
        );

        await this.planActionRepo.createMany(
          input.actions.map((a) => ({
            debtPlanId: plan.id,
            debtId: a.debtId,
            debtLabel: a.debtLabel,
            debtType: a.debtType as import('@prisma/client').DebtType,
            month: a.month,
            paymentAmount: a.paymentAmount,
            principalAmount: a.principalAmount,
            interestAmount: a.interestAmount,
            runningBalance: a.runningBalance,
          })),
          tx
        );

        logger.info(
          { operation: 'plan.persist', planId: plan.id, actionsCount: input.actions.length },
          'Plan persisted'
        );

        return { plan, actionsCount: input.actions.length };
      });
    } catch (err) {
      if (err instanceof DomainError) throw err;
      logger.error({ operation: 'plan.persist', err }, 'Failed to persist plan');
      throw new DomainError(PLAN_GENERATION_FAILED, 500, 'Failed to persist plan');
    }
  }
}
