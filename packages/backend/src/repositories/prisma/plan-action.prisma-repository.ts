import type { PrismaClient, PlanAction } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreatePlanActionInput, IPlanActionRepository } from '../interfaces/plan-action.repository';

export class PrismaPlanActionRepository implements IPlanActionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async createMany(actions: CreatePlanActionInput[], tx?: TransactionContext): Promise<void> {
    await this.db(tx).planAction.createMany({ data: actions });
  }

  async findByPlanId(debtPlanId: string, tx?: TransactionContext): Promise<PlanAction[]> {
    return this.db(tx).planAction.findMany({
      where: { debtPlanId },
      orderBy: [{ month: 'asc' }, { debtId: 'asc' }],
    });
  }
}
