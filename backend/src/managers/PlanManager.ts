// MANAGER: PlanManager
// Spec: specs/managers/MANAGER-PlanManager.md
// Consulta y gestión de planes: activo, historial y reintento de IA.

import type { DebtPlan, PlanAction } from '@prisma/client'
import type { DebtType, AiOutput } from '../types/domain'
import { buildPrompt } from '../skills/prompt-builder.skill'
import { generateAiPlan } from '../skills/ai-plan-generator.skill'
import type { PlanRepository } from '../repositories/PlanRepository'
import type { DebtRepository } from '../repositories/DebtRepository'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnrichedPlanAction = PlanAction & {
  debtLabel: string
  debtType: DebtType
}

export type GetActivePlanOutput =
  | {
      success: true
      hasPlan: true
      plan: DebtPlan & {
        planActions: EnrichedPlanAction[]
        currentMonthActions: EnrichedPlanAction[]
      }
    }
  | { success: true; hasPlan: false; plan: null }

export interface PlanHistoryItem {
  id: string
  strategy: string
  status: string
  monthlyBudget: number
  totalDebtAtCreation: number
  totalInterestProjected: number
  totalInterestNoPlan: number
  estimatedPayoffDate: Date
  createdAt: Date
  debtCount: number
}

export interface GetPlanHistoryOutput {
  success: true
  plans: PlanHistoryItem[]
}

export type RetryAiOutput =
  | { success: true; aiOutput: AiOutput }
  | { success: false; error: 'PLAN_NOT_FOUND' | 'AI_ALREADY_GENERATED' | 'AI_GENERATION_FAILED' }

// ─── Operación 1: getActivePlan ────────────────────────────────────────────────

export async function getActivePlan(
  input: { userId: string },
  planRepo: PlanRepository,
  debtRepo: DebtRepository
): Promise<GetActivePlanOutput> {
  const { userId } = input

  // Step 1: fetch active plan with actions
  const plan = await planRepo.getActivePlanByUserId(userId)
  if (!plan) return { success: true, hasPlan: false, plan: null }

  // Enrich actions with debt labels/types
  const debtIds = [...new Set(plan.planActions.map(a => a.debtId))]
  const debts = await Promise.all(debtIds.map(id => debtRepo.getById(id)))
  const debtMap = new Map(debts.filter(Boolean).map(d => [d!.id, d!]))

  const enrichedActions: EnrichedPlanAction[] = plan.planActions.map(a => ({
    ...a,
    debtLabel: debtMap.get(a.debtId)?.label ?? a.debtId,
    debtType: (debtMap.get(a.debtId)?.debtType ?? 'consumer_loan') as DebtType,
  }))

  // Steps 3–4: compute current month actions
  const monthsSince = monthsBetween(plan.createdAt, new Date())
  const currentMonthOffset = monthsSince + 1
  const currentMonthActions = enrichedActions.filter(a => a.monthOffset === currentMonthOffset)

  return {
    success: true,
    hasPlan: true,
    plan: { ...plan, planActions: enrichedActions, currentMonthActions },
  }
}

// ─── Operación 2: getPlanHistory ───────────────────────────────────────────────

export async function getPlanHistory(
  input: { userId: string },
  planRepo: PlanRepository
): Promise<GetPlanHistoryOutput> {
  const { userId } = input

  // Step 1: fetch all plans ordered by createdAt DESC
  const plans = await planRepo.getHistoryByUserId(userId)

  // Step 2: compute debtCount per plan (unique debtIds in planActions)
  // History plans are fetched without planActions to keep it lightweight.
  // We cast planActions from the enriched repo if available, otherwise 0.
  const items: PlanHistoryItem[] = plans.map(p => {
    const withActions = p as DebtPlan & { planActions?: PlanAction[] }
    const debtCount = withActions.planActions
      ? new Set(withActions.planActions.map((a: PlanAction) => a.debtId)).size
      : 0
    return {
      id: p.id,
      strategy: p.strategy,
      status: p.status,
      monthlyBudget: Number(p.monthlyBudget),
      totalDebtAtCreation: Number(p.totalDebtAtCreation),
      totalInterestProjected: Number(p.totalInterestProjected),
      totalInterestNoPlan: Number(p.totalInterestNoPlan),
      estimatedPayoffDate: p.estimatedPayoffDate,
      createdAt: p.createdAt,
      debtCount,
    }
  })

  return { success: true, plans: items }
}

// ─── Operación 3: retryAiGeneration ───────────────────────────────────────────

export async function retryAiGeneration(
  input: { userId: string; planId: string },
  planRepo: PlanRepository,
  debtRepo: DebtRepository
): Promise<RetryAiOutput> {
  const { userId, planId } = input

  // Step 1: load plan
  const plan = await planRepo.getByIdAndUserId(planId, userId)
  if (!plan) return { success: false, error: 'PLAN_NOT_FOUND' }

  // Step 3: already has aiOutput
  if (plan.aiOutput !== null) return { success: false, error: 'AI_ALREADY_GENERATED' }

  // Step 4: load plan with actions to reconstruct the prompt
  const planWithActions = await planRepo.getActivePlanByUserId(userId)
  const targetPlan = planWithActions?.id === planId
    ? planWithActions
    : null

  // Fetch debts that appear in this plan
  const planActions = targetPlan?.planActions ?? []
  const debtIds = [...new Set(planActions.map(a => a.debtId))]
  const debts = await Promise.all(debtIds.map(id => debtRepo.getById(id)))
  const validDebts = debts.filter(Boolean) as NonNullable<(typeof debts)[number]>[]

  const monthlyIncome = Number(plan.monthlyIncomeSnapshot)
  const totalFixedCosts = Number(plan.totalFixedCostsSnapshot)
  const availableBudget = Number(plan.monthlyBudget)
  const reservePercentage = Number(plan.reservePercentage)
  const totalMinimumPayments = validDebts.reduce((s, d) => s + Number(d.minimumPayment), 0)

  // Step 5: rebuild prompt using snapshots (not current user data)
  const { systemPrompt, userPrompt } = buildPrompt({
    monthlyNetIncome: monthlyIncome,
    totalFixedCosts,
    availableBudget,
    reservePercentage,
    debts: validDebts.map((d, i) => ({
      id: d.id,
      label: d.label,
      debtType: d.debtType as DebtType,
      lenderName: d.lenderName,
      remainingBalance: Number(d.remainingBalance),
      monthlyInterestRate: d.monthlyInterestRate !== null ? Number(d.monthlyInterestRate) : null,
      minimumPayment: Number(d.minimumPayment),
      paymentDueDay: d.paymentDueDay,
      isCritical: false,
      monthlyInterestCost: 0,
      debtOrder: i + 1,
      priorityScore: 0,
    })),
    strategy: plan.strategy as import('../types/domain').StrategyType,
    planSummary: {
      totalDebt: Number(plan.totalDebtAtCreation),
      totalMinimumPayments,
      surplusOverMinimums: availableBudget - totalMinimumPayments,
      criticalDebtCount: 0,
      totalInterestProjected: Number(plan.totalInterestProjected),
      totalInterestNoPlan: Number(plan.totalInterestNoPlan),
      totalSavings: Number(plan.totalInterestNoPlan) - Number(plan.totalInterestProjected),
      estimatedPayoffDate: plan.estimatedPayoffDate,
      totalMonths: 0,
      planActions: planActions.map(a => ({
        monthOffset: a.monthOffset,
        debtLabel: validDebts.find(d => d.id === a.debtId)?.label ?? a.debtId,
        paymentAmount: Number(a.paymentAmount),
        minimumPayment: Number(validDebts.find(d => d.id === a.debtId)?.minimumPayment ?? 0),
        extraPayment: 0,
      })),
    },
  })

  // Step 6: call AI
  const aiResult = await generateAiPlan({ systemPrompt, userPrompt })
  if (!aiResult.success) return { success: false, error: 'AI_GENERATION_FAILED' }

  // Step 8: persist aiOutput
  await planRepo.updateAiOutput(planId, aiResult.aiOutput as unknown as Record<string, unknown>)
  return { success: true, aiOutput: aiResult.aiOutput }
}
