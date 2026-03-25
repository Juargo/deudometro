// MANAGER: AnalysisManager
// Spec: specs/managers/MANAGER-AnalysisManager.md
// Orquesta la generación completa de un plan de pagos con cálculo + IA.

import type { DebtPlan, PlanAction } from '@prisma/client'
import type { StrategyType, AiOutput, FixedExpenses, DebtType, DebtStatus } from '../types/domain'
import { detectCriticalDebts } from '../skills/critical-debt-detector.skill'
import { sortDebtsByStrategy } from '../skills/strategy-sorter.skill'
import { calculatePlan } from '../skills/plan-calculator.skill'
import { buildPrompt } from '../skills/prompt-builder.skill'
import { generateAiPlan } from '../skills/ai-plan-generator.skill'
import type { UserRepository } from '../repositories/UserRepository'
import type { DebtRepository } from '../repositories/DebtRepository'
import type { PlanRepository } from '../repositories/PlanRepository'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeneratePlanOutput =
  | {
      success: true
      plan: DebtPlan & { planActions: PlanAction[] }
      aiGenerated: boolean
    }
  | {
      success: false
      error: 'NO_ACTIVE_DEBTS' | 'INSUFFICIENT_BUDGET' | 'NO_SURPLUS'
      details?: {
        deficit?: number
        availableBudget?: number
        totalMinimumPayments?: number
      }
    }

// ─── Operación 1: generatePlan ─────────────────────────────────────────────────

export async function generatePlan(
  input: { userId: string; strategy: StrategyType; reservePercentage: number },
  userRepo: UserRepository,
  debtRepo: DebtRepository,
  planRepo: PlanRepository
): Promise<GeneratePlanOutput> {
  const { userId, strategy, reservePercentage } = input

  // Step 1: load user profile (userId = UserProfile.id)
  const user = await userRepo.getById(userId)
  if (!user) return { success: false, error: 'NO_ACTIVE_DEBTS' }

  const fixedExpenses = user.fixedExpenses as unknown as FixedExpenses
  const totalFixedCosts = Object.values(fixedExpenses).reduce((s, v) => s + (v ?? 0), 0)

  // Step 2: filter active debts
  const allDebts = await debtRepo.getAllByUserId(userId)
  const activeDebts = allDebts.filter(d => d.status === 'active')
  if (activeDebts.length === 0) return { success: false, error: 'NO_ACTIVE_DEBTS' }

  // Step 3: calculate available budget (BR-25)
  const monthlyIncome = Number(user.monthlyIncome)
  const grossSurplus = monthlyIncome - totalFixedCosts
  if (grossSurplus <= 0) return { success: false, error: 'NO_SURPLUS' }
  const availableBudget = grossSurplus * (1 - reservePercentage / 100)

  // Step 4: verify minimum budget (BR-10)
  const totalMinimumPayments = activeDebts.reduce((s, d) => s + Number(d.minimumPayment), 0)
  if (availableBudget < totalMinimumPayments) {
    return {
      success: false,
      error: 'INSUFFICIENT_BUDGET',
      details: { deficit: totalMinimumPayments - availableBudget, availableBudget, totalMinimumPayments },
    }
  }

  // Step 5: detect critical debts
  const debtInputs = activeDebts.map(d => ({
    id: d.id,
    label: d.label,
    debtType: d.debtType as DebtType,
    remainingBalance: Number(d.remainingBalance),
    monthlyInterestRate: d.monthlyInterestRate !== null ? Number(d.monthlyInterestRate) : null,
    minimumPayment: Number(d.minimumPayment),
    status: d.status as DebtStatus,
    metadata: d.metadata as Record<string, unknown>,
  }))
  const { debts: debtsWithCritical } = detectCriticalDebts({ debts: debtInputs })

  // Step 6: sort by strategy (add explicit metadata field required by DebtWithCritical)
  const { sortedDebts } = sortDebtsByStrategy({
    debts: debtsWithCritical.map(d => ({ ...d, metadata: (d as { metadata?: Record<string, unknown> }).metadata ?? {} })),
    strategy,
  })

  // Step 7: calculate plan
  const planResult = calculatePlan({ sortedDebts, monthlyBudget: availableBudget, planStartDate: new Date() })
  if (!planResult.success) {
    return {
      success: false,
      error: 'INSUFFICIENT_BUDGET',
      details: { deficit: planResult.deficit, availableBudget, totalMinimumPayments },
    }
  }
  const { planActions, estimatedPayoffDate, totalInterestProjected, totalInterestNoPlan, totalMonths } = planResult

  // Step 8: build prompt
  const debtLabels = new Map(activeDebts.map(d => [d.id, d.label]))
  const surplusOverMinimums = availableBudget - totalMinimumPayments
  const totalDebtAtCreation = activeDebts.reduce((s, d) => s + Number(d.remainingBalance), 0)

  const { systemPrompt, userPrompt } = buildPrompt({
    monthlyNetIncome: monthlyIncome,
    totalFixedCosts,
    availableBudget,
    reservePercentage,
    debts: sortedDebts.map(d => ({
      id: d.id,
      label: d.label,
      debtType: d.debtType as DebtType,
      lenderName: (d as { lenderName?: string | null }).lenderName ?? null,
      remainingBalance: d.remainingBalance,
      monthlyInterestRate: d.monthlyInterestRate,
      minimumPayment: d.minimumPayment,
      paymentDueDay: (d as { paymentDueDay?: number }).paymentDueDay ?? 1,
      isCritical: d.isCritical,
      monthlyInterestCost: d.monthlyInterestCost,
      debtOrder: d.debtOrder,
      priorityScore: d.priorityScore,
    })),
    strategy,
    planSummary: {
      totalDebt: totalDebtAtCreation,
      totalMinimumPayments,
      surplusOverMinimums,
      criticalDebtCount: debtsWithCritical.filter(d => d.isCritical).length,
      totalInterestProjected,
      totalInterestNoPlan,
      totalSavings: totalInterestNoPlan - totalInterestProjected,
      estimatedPayoffDate,
      totalMonths,
      planActions: planActions.map(a => {
        const debt = sortedDebts.find(d => d.id === a.debtId)
        return {
          monthOffset: a.monthOffset,
          debtLabel: debtLabels.get(a.debtId) ?? a.debtId,
          paymentAmount: a.paymentAmount,
          minimumPayment: debt?.minimumPayment ?? 0,
          extraPayment: Math.max(0, a.paymentAmount - (debt?.minimumPayment ?? 0)),
        }
      }),
    },
  })

  // Step 9: call AI (non-blocking on failure)
  let aiOutput: AiOutput | null = null
  const aiResult = await generateAiPlan({ systemPrompt, userPrompt })
  if (aiResult.success) aiOutput = aiResult.aiOutput

  // Steps 10–11: supersede previous plan + persist new one (handled inside PlanRepository.create)
  const plan = await planRepo.create(
    {
      userId,
      strategy,
      monthlyIncomeSnapshot: monthlyIncome,
      totalFixedCostsSnapshot: totalFixedCosts,
      reservePercentage,
      monthlyBudget: availableBudget,
      totalDebtAtCreation,
      totalInterestProjected,
      totalInterestNoPlan,
      estimatedPayoffDate,
      aiOutput: aiOutput as Record<string, unknown> | null,
    },
    planActions
  )

  return { success: true, plan, aiGenerated: aiOutput !== null }
}
