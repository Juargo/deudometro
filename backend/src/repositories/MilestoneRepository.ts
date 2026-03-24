import type { Milestone, MilestoneType, PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

export interface CreateMilestoneData {
  userId: string
  debtId?: string | null
  type: MilestoneType
  context: Record<string, unknown>
}

export class MilestoneRepository {
  constructor(private prisma: PrismaClient) {}

  async createMany(milestones: CreateMilestoneData[]): Promise<Milestone[]> {
    const created = await Promise.all(
      milestones.map(m =>
        this.prisma.milestone.create({
          data: {
            userId: m.userId,
            debtId: m.debtId ?? null,
            type: m.type,
            context: m.context as Prisma.InputJsonValue,
          },
        })
      )
    )
    return created
  }

  async getByUserId(
    userId: string,
    filter?: 'pending' | 'acknowledged' | 'all'
  ): Promise<Milestone[]> {
    const where: { userId: string; acknowledgedAt?: null | { not: null } } = { userId }
    if (filter === 'pending') where.acknowledgedAt = null
    else if (filter === 'acknowledged') where.acknowledgedAt = { not: null }

    return this.prisma.milestone.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  async getByIdAndUserId(milestoneId: string, userId: string): Promise<Milestone | null> {
    return this.prisma.milestone.findFirst({ where: { id: milestoneId, userId } })
  }

  async acknowledge(milestoneId: string, acknowledgedAt: Date): Promise<Milestone> {
    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { acknowledgedAt },
    })
  }
}
