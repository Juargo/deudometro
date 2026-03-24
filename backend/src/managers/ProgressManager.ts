// MANAGER: ProgressManager
// Spec: specs/managers/MANAGER-ProgressManager.md
// Gestiona el progreso: pagos, saldos, milestones y reconocimiento de logros.

import type { Payment, Milestone } from '@prisma/client'
import { recordPayment } from '../skills/payment-recorder.skill'
import { updateBalance } from '../skills/balance-updater.skill'
import { detectMilestones } from '../skills/milestone-detector.skill'
import type { DebtRepository } from '../repositories/DebtRepository'
import type { PaymentRepository } from '../repositories/PaymentRepository'
import type { PlanRepository } from '../repositories/PlanRepository'
import type { MilestoneRepository } from '../repositories/MilestoneRepository'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecordPaymentOutput =
  | {
      success: true
      payment: Payment
      debtUpdate: { previousBalance: number; newBalance: number; isPaidOff: boolean }
      newMilestones: Milestone[]
    }
  | {
      success: false
      error:
        | 'DEBT_NOT_FOUND'
        | 'DEBT_ALREADY_PAID'
        | 'PAYMENT_EXCEEDS_BALANCE'
        | 'INVALID_AMOUNT'
        | 'INVALID_PAYMENT_DATE'
        | 'PLAN_ACTION_NOT_FOUND'
    }

export interface GetMilestonesOutput {
  success: true
  milestones: Milestone[]
  pendingCount: number
}

export type AcknowledgeMilestoneOutput =
  | { success: true; milestone: Milestone }
  | { success: false; error: 'MILESTONE_NOT_FOUND' | 'ALREADY_ACKNOWLEDGED' }

export interface GetPaymentHistoryOutput {
  success: true
  payments: (Payment & {
    debtLabel: string
    planActionDetails?: { monthOffset: number; suggestedAmount: number }
  })[]
  total: number
}

// ─── Operación 1: recordPayment ────────────────────────────────────────────────

export async function recordPaymentOp(
  input: {
    userId: string
    debtId: string
    amount: number
    paidAt: Date
    planActionId?: string
    notes?: string
  },
  debtRepo: DebtRepository,
  paymentRepo: PaymentRepository,
  planRepo: PlanRepository,
  milestoneRepo: MilestoneRepository
): Promise<RecordPaymentOutput> {
  const { userId, debtId, amount, paidAt, planActionId, notes } = input

  // Step 1: record the payment
  const paymentResult = await recordPayment(
    { userId, debtId, amount, paidAt, planActionId, notes },
    debtRepo,
    paymentRepo,
    planRepo
  )
  if (!paymentResult.success) return paymentResult

  // Step 2: update balance
  const balanceResult = await updateBalance({ debtId, paymentAmount: amount }, debtRepo)

  // Step 3: check if this is the first payment ever
  const paymentCount = await paymentRepo.countByUserId(userId)
  const isFirstPaymentEver = paymentCount === 1

  // Step 4: load all debts with updated balances
  const allUserDebts = await debtRepo.getAllByUserId(userId)

  // Step 5: detect milestones
  const { newMilestones: milestoneData } = await detectMilestones(
    {
      userId,
      affectedDebtId: debtId,
      isDebtPaidOff: balanceResult.isPaidOff,
      isFirstPaymentEver,
      allUserDebts: allUserDebts.map(d => ({
        id: d.id,
        label: d.label,
        originalBalance: Number(d.originalBalance),
        remainingBalance: Number(d.remainingBalance),
      })),
    },
    milestoneRepo
  )

  // Step 6: persist milestones
  const persistedMilestones: Milestone[] =
    milestoneData.length > 0 ? await milestoneRepo.createMany(milestoneData) : []

  return {
    success: true,
    payment: paymentResult.payment,
    debtUpdate: {
      previousBalance: balanceResult.previousBalance,
      newBalance: balanceResult.newBalance,
      isPaidOff: balanceResult.isPaidOff,
    },
    newMilestones: persistedMilestones,
  }
}

// ─── Operación 2: getMilestones ────────────────────────────────────────────────

export async function getMilestones(
  input: { userId: string; filter?: 'pending' | 'acknowledged' | 'all' },
  milestoneRepo: MilestoneRepository
): Promise<GetMilestonesOutput> {
  const { userId, filter = 'all' } = input

  // Step 1: fetch milestones
  const milestones = await milestoneRepo.getByUserId(userId, filter)

  // Step 2: sort — pending first, then by createdAt DESC
  const sorted = [...milestones].sort((a, b) => {
    const aPending = a.acknowledgedAt === null ? 0 : 1
    const bPending = b.acknowledgedAt === null ? 0 : 1
    if (aPending !== bPending) return aPending - bPending
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const pendingCount = sorted.filter(m => m.acknowledgedAt === null).length

  return { success: true, milestones: sorted, pendingCount }
}

// ─── Operación 3: acknowledgeMilestone ────────────────────────────────────────

export async function acknowledgeMilestone(
  input: { userId: string; milestoneId: string },
  milestoneRepo: MilestoneRepository
): Promise<AcknowledgeMilestoneOutput> {
  const { userId, milestoneId } = input

  // Step 1: load milestone
  const milestone = await milestoneRepo.getByIdAndUserId(milestoneId, userId)
  if (!milestone) return { success: false, error: 'MILESTONE_NOT_FOUND' }

  // Step 3: already acknowledged (BR-22)
  if (milestone.acknowledgedAt !== null) return { success: false, error: 'ALREADY_ACKNOWLEDGED' }

  // Step 4: acknowledge
  const updated = await milestoneRepo.acknowledge(milestoneId, new Date())
  return { success: true, milestone: updated }
}

// ─── Operación 4: getPaymentHistory ───────────────────────────────────────────

export async function getPaymentHistory(
  input: { userId: string; debtId?: string; limit?: number; offset?: number },
  debtRepo: DebtRepository,
  paymentRepo: PaymentRepository,
  planRepo: PlanRepository
): Promise<GetPaymentHistoryOutput> {
  const { userId, debtId, limit = 50, offset = 0 } = input

  // Step 1: fetch payments
  const payments = await paymentRepo.getByUserId(userId, { debtId, limit, offset })
  const total = await paymentRepo.countByUserId(userId, { debtId })

  // Step 2: enrich with debt label and plan action details
  const debtIds = [...new Set(payments.map(p => p.debtId))]
  const debts = await Promise.all(debtIds.map(id => debtRepo.getById(id)))
  const debtMap = new Map(debts.filter(Boolean).map(d => [d!.id, d!]))

  const planActionIds = payments.map(p => p.planActionId).filter(Boolean) as string[]
  const planActions = await Promise.all(planActionIds.map(id => planRepo.getActionById(id)))
  const actionMap = new Map(planActions.filter(Boolean).map(a => [a!.id, a!]))

  const enriched = payments.map(p => {
    const debt = debtMap.get(p.debtId)
    const action = p.planActionId ? actionMap.get(p.planActionId) : null
    return {
      ...p,
      debtLabel: debt?.label ?? p.debtId,
      ...(action
        ? {
            planActionDetails: {
              monthOffset: action.monthOffset,
              suggestedAmount: Number(action.paymentAmount),
            },
          }
        : {}),
    }
  })

  return { success: true, payments: enriched, total }
}
