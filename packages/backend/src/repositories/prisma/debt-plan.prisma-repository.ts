import type { PrismaClient, DebtPlan, Prisma } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreateDebtPlanInput, IDebtPlanRepository } from '../interfaces/debt-plan.repository';

export class PrismaDebtPlanRepository implements IDebtPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreateDebtPlanInput, tx?: TransactionContext): Promise<DebtPlan> {
    return this.db(tx).debtPlan.create({ data: input });
  }

  async findById(id: string, tx?: TransactionContext): Promise<DebtPlan | null> {
    return this.db(tx).debtPlan.findUnique({ where: { id } });
  }

  async findActiveBySpaceId(financialSpaceId: string, tx?: TransactionContext): Promise<DebtPlan | null> {
    return this.db(tx).debtPlan.findFirst({
      where: { financialSpaceId, status: 'active' },
    });
  }

  async findAllBySpaceId(financialSpaceId: string, tx?: TransactionContext): Promise<DebtPlan[]> {
    return this.db(tx).debtPlan.findMany({
      where: { financialSpaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async supersedePreviousPlans(financialSpaceId: string, tx?: TransactionContext): Promise<void> {
    await this.db(tx).debtPlan.updateMany({
      where: { financialSpaceId, status: 'active' },
      data: { status: 'superseded' },
    });
  }

  async updateAiAnalysis(
    id: string,
    aiAnalysis: Prisma.InputJsonValue,
    tx?: TransactionContext
  ): Promise<DebtPlan> {
    return this.db(tx).debtPlan.update({
      where: { id },
      data: { aiAnalysis },
    });
  }
}
