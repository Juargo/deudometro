import type { PrismaClient, Milestone, MilestoneType } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';
import type { CreateMilestoneInput, IMilestoneRepository } from '../interfaces/milestone.repository';

export class PrismaMilestoneRepository implements IMilestoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db(tx?: TransactionContext) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async create(input: CreateMilestoneInput, tx?: TransactionContext): Promise<Milestone> {
    return this.db(tx).milestone.create({
      data: {
        financialSpaceId: input.financialSpaceId,
        milestoneType: input.milestoneType,
        debtId: input.debtId ?? null,
        message: input.message,
      },
    });
  }

  async findByFinancialSpaceId(spaceId: string): Promise<Milestone[]> {
    return this.prisma.milestone.findMany({
      where: { financialSpaceId: spaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTypeAndScope(
    spaceId: string,
    type: MilestoneType,
    debtId?: string | null,
    tx?: TransactionContext
  ): Promise<Milestone | null> {
    return this.db(tx).milestone.findFirst({
      where: {
        financialSpaceId: spaceId,
        milestoneType: type,
        debtId: debtId ?? null,
      },
    });
  }

  async acknowledgeById(id: string): Promise<Milestone> {
    return this.prisma.milestone.update({
      where: { id },
      data: { acknowledgedAt: new Date() },
    });
  }
}
