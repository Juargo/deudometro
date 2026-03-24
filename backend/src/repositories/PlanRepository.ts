import type { DebtPlan, PlanAction, PrismaClient } from '@prisma/client'
import type { StrategyType } from '../types/domain'
import type { PlanActionData } from '../skills/plan-calculator.skill'

export interface CreatePlanData {
  userId: string
  strategy: StrategyType
  monthlyIncomeSnapshot: number
  totalFixedCostsSnapshot: number
  reservePercentage: number
  monthlyBudget: number
  totalDebtAtCreation: number
  totalInterestProjected: number
  totalInterestNoPlan: number
  estimatedPayoffDate: Date
  aiOutput?: Record<string, unknown> | null
}

export class PlanRepository {
  constructor(private prisma: PrismaClient) {}

  async create(planData: CreatePlanData, planActions: PlanActionData[]): Promise<DebtPlan & { planActions: PlanAction[] }> {
    // Supersede any existing active plan first
    await this.prisma.debtPlan.updateMany({
      where: { userId: planData.userId, status: 'active' },
      data: { status: 'superseded' },
    })

    const plan = await this.prisma.debtPlan.create({
      data: {
        userId: planData.userId,
        strategy: planData.strategy,
        monthlyIncomeSnapshot: planData.monthlyIncomeSnapshot,
        totalFixedCostsSnapshot: planData.totalFixedCostsSnapshot,
        reservePercentage: planData.reservePercentage,
        monthlyBudget: planData.monthlyBudget,
        totalDebtAtCreation: planData.totalDebtAtCreation,
        totalInterestProjected: planData.totalInterestProjected,
        totalInterestNoPlan: planData.totalInterestNoPlan,
        estimatedPayoffDate: planData.estimatedPayoffDate,
        aiOutput: planData.aiOutput ?? undefined,
        status: 'active',
        planActions: {
          create: planActions.map(a => ({
            debtId: a.debtId,
            monthOffset: a.monthOffset,
            paymentAmount: a.paymentAmount,
            principalAmount: a.principalAmount,
            interestAmount: a.interestAmount,
            remainingBalanceAfter: a.remainingBalanceAfter,
            debtOrder: a.debtOrder,
          })),
        },
      },
      include: { planActions: true },
    })

    return plan
  }

  async getActivePlanByUserId(userId: string): Promise<(DebtPlan & { planActions: PlanAction[] }) | null> {
    return this.prisma.debtPlan.findFirst({
      where: { userId, status: 'active' },
      include: { planActions: true },
    })
  }

  async getHistoryByUserId(userId: string): Promise<DebtPlan[]> {
    return this.prisma.debtPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getByIdAndUserId(id: string, userId: string): Promise<DebtPlan | null> {
    return this.prisma.debtPlan.findFirst({ where: { id, userId } })
  }

  async getActionById(planActionId: string): Promise<PlanAction | null> {
    return this.prisma.planAction.findUnique({ where: { id: planActionId } })
  }

  async updateAiOutput(planId: string, aiOutput: Record<string, unknown>): Promise<DebtPlan> {
    return this.prisma.debtPlan.update({
      where: { id: planId },
      data: { aiOutput },
    })
  }
}
