// SKILL: debt-entry
// Spec: specs/skills/SKILL-debt-entry.md
// Validates and persists a new debt.

import type { Debt } from '@prisma/client'
import type { DebtType } from '../types/domain'
import { validateDebt, type ValidationError } from './debt-validator.skill'
import type { DebtRepository } from '../repositories/DebtRepository'

export interface DebtEntryInput {
  userId: string
  debtType: DebtType
  formData: {
    label: string
    lenderName?: string | null
    remainingBalance: number
    monthlyInterestRate?: number | null
    minimumPayment: number
    paymentDueDay: number
    cutoffDay?: number | null
    metadata: Record<string, unknown>
  }
}

export type DebtEntryOutput =
  | { success: true; debt: Debt }
  | { success: false; errors: ValidationError[] }

export async function entryDebt(
  input: DebtEntryInput,
  debtRepo: DebtRepository
): Promise<DebtEntryOutput> {
  const { userId, debtType, formData } = input

  // Rule 10: validate all rules, collect all errors
  const validation = validateDebt({ debtType, formData })
  if (!validation.isValid) {
    return { success: false, errors: validation.errors }
  }

  // Rule 4: informal_lender without rate → null rate + hasInterest: false
  let monthlyInterestRate = formData.monthlyInterestRate ?? null
  let metadata = { ...formData.metadata }
  if (debtType === 'informal_lender' && monthlyInterestRate == null) {
    metadata = { ...metadata, hasInterest: false }
  }

  // Rule 8: cutoffDay only for credit_card — silently ignore for others
  const cutoffDay = debtType === 'credit_card' ? (formData.cutoffDay ?? null) : null

  // Rule 5: originalBalance = remainingBalance (never from input)
  const debt = await debtRepo.save({
    userId,
    label: formData.label.trim(),
    debtType,
    lenderName: formData.lenderName ?? null,
    remainingBalance: formData.remainingBalance,
    monthlyInterestRate,
    minimumPayment: formData.minimumPayment,
    paymentDueDay: formData.paymentDueDay,
    cutoffDay,
    metadata,
  })

  return { success: true, debt }
}
