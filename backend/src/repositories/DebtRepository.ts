import type { Debt, DebtStatus, PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type { DebtType } from '../types/domain'

export interface CreateDebtData {
  userId: string
  label: string
  debtType: DebtType
  lenderName?: string | null
  remainingBalance: number
  monthlyInterestRate?: number | null
  minimumPayment: number
  paymentDueDay: number
  cutoffDay?: number | null
  metadata: Record<string, unknown>
}

export class DebtRepository {
  constructor(private prisma: PrismaClient) {}

  async save(data: CreateDebtData): Promise<Debt> {
    return this.prisma.debt.create({
      data: {
        userId: data.userId,
        label: data.label,
        debtType: data.debtType,
        lenderName: data.lenderName ?? null,
        originalBalance: data.remainingBalance,
        remainingBalance: data.remainingBalance,
        monthlyInterestRate: data.monthlyInterestRate ?? null,
        minimumPayment: data.minimumPayment,
        paymentDueDay: data.paymentDueDay,
        cutoffDay: data.cutoffDay ?? null,
        status: 'active',
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    })
  }

  async getByIdAndUserId(id: string, userId: string): Promise<Debt | null> {
    return this.prisma.debt.findFirst({ where: { id, userId } })
  }

  async getById(id: string): Promise<Debt | null> {
    return this.prisma.debt.findUnique({ where: { id } })
  }

  async getAllByUserId(userId: string): Promise<Debt[]> {
    return this.prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
  }

  async getActiveByUserId(userId: string): Promise<Debt[]> {
    return this.prisma.debt.findMany({ where: { userId, status: 'active' }, orderBy: { createdAt: 'asc' } })
  }

  async updateBalance(debtId: string, newBalance: number, newStatus?: DebtStatus): Promise<Debt> {
    return this.prisma.debt.update({
      where: { id: debtId },
      data: {
        remainingBalance: newBalance,
        ...(newStatus ? { status: newStatus } : {}),
      },
    })
  }

  async update(id: string, data: Partial<CreateDebtData>): Promise<Debt> {
    return this.prisma.debt.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.lenderName !== undefined && { lenderName: data.lenderName }),
        ...(data.remainingBalance !== undefined && { remainingBalance: data.remainingBalance }),
        ...(data.monthlyInterestRate !== undefined && { monthlyInterestRate: data.monthlyInterestRate }),
        ...(data.minimumPayment !== undefined && { minimumPayment: data.minimumPayment }),
        ...(data.paymentDueDay !== undefined && { paymentDueDay: data.paymentDueDay }),
        ...(data.cutoffDay !== undefined && { cutoffDay: data.cutoffDay }),
        ...(data.metadata !== undefined && { metadata: data.metadata as Prisma.InputJsonValue }),
      },
    })
  }

  async archive(id: string): Promise<Debt> {
    return this.prisma.debt.update({
      where: { id },
      data: { status: 'frozen' },
    })
  }
}
