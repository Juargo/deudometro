// SKILL: payment-recorder
// Spec: specs/skills/SKILL-payment-recorder.md
// Validates and persists a payment.

import type { Payment } from '@prisma/client'
import type { DebtRepository } from '../repositories/DebtRepository'
import type { PaymentRepository } from '../repositories/PaymentRepository'
import type { PlanRepository } from '../repositories/PlanRepository'

export interface PaymentRecorderInput {
  userId: string
  debtId: string
  amount: number
  paidAt: Date
  planActionId?: string | null
  notes?: string | null
}

export type PaymentRecorderOutput =
  | { success: true; payment: Payment }
  | {
      success: false
      error:
        | 'DEBT_NOT_FOUND'
        | 'DEBT_ALREADY_PAID'
        | 'PAYMENT_EXCEEDS_BALANCE'
        | 'INVALID_AMOUNT'
        | 'PLAN_ACTION_NOT_FOUND'
        | 'INVALID_PAYMENT_DATE'
    }

export async function recordPayment(
  input: PaymentRecorderInput,
  debtRepo: DebtRepository,
  paymentRepo: PaymentRepository,
  planRepo: PlanRepository
): Promise<PaymentRecorderOutput> {
  const { userId, debtId, amount, paidAt, planActionId, notes } = input

  // Rule 3: amount > 0
  if (amount <= 0) return { success: false, error: 'INVALID_AMOUNT' }

  // Rule 7: paidAt cannot be future
  if (paidAt > new Date()) return { success: false, error: 'INVALID_PAYMENT_DATE' }

  // Rule 1: debt must exist and belong to userId (BR-16)
  const debt = await debtRepo.getByIdAndUserId(debtId, userId)
  if (!debt) return { success: false, error: 'DEBT_NOT_FOUND' }

  // Rule 2: debt cannot be paid_off
  if (debt.status === 'paid_off') return { success: false, error: 'DEBT_ALREADY_PAID' }

  // Rule 4: amount <= remainingBalance (BR-18)
  if (amount > Number(debt.remainingBalance)) return { success: false, error: 'PAYMENT_EXCEEDS_BALANCE' }

  // Rule 5: planActionId must be valid if provided
  if (planActionId) {
    const action = await planRepo.getActionById(planActionId)
    if (!action) return { success: false, error: 'PLAN_ACTION_NOT_FOUND' }
  }

  // Rule 6: truncate notes silently
  const safeNotes = notes ? notes.slice(0, 255) : null

  // Rule 8: persist and return
  const payment = await paymentRepo.save({ userId, debtId, planActionId, amount, paidAt, notes: safeNotes })
  return { success: true, payment }
}
