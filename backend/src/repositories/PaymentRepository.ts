import type { Payment, PrismaClient } from '@prisma/client'

export interface CreatePaymentData {
  userId: string
  debtId: string
  planActionId?: string | null
  amount: number
  paidAt: Date
  notes?: string | null
}

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async save(data: CreatePaymentData): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        userId: data.userId,
        debtId: data.debtId,
        planActionId: data.planActionId ?? null,
        amount: data.amount,
        paidAt: data.paidAt,
        notes: data.notes ?? null,
      },
    })
  }

  async countByUserId(userId: string, filters?: { debtId?: string }): Promise<number> {
    return this.prisma.payment.count({
      where: { userId, ...(filters?.debtId ? { debtId: filters.debtId } : {}) },
    })
  }

  async getByUserId(
    userId: string,
    options?: { debtId?: string; limit?: number; offset?: number }
  ): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { userId, ...(options?.debtId ? { debtId: options.debtId } : {}) },
      orderBy: { paidAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    })
  }
}
