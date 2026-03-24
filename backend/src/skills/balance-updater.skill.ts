// SKILL: balance-updater
// Spec: specs/skills/SKILL-balance-updater.md
// Atomic balance + status update after a validated payment.

import type { DebtRepository } from '../repositories/DebtRepository'

export interface BalanceUpdaterInput {
  debtId: string
  paymentAmount: number
}

export interface BalanceUpdaterOutput {
  success: true
  debtId: string
  previousBalance: number
  newBalance: number
  isPaidOff: boolean
}

export async function updateBalance(
  input: BalanceUpdaterInput,
  debtRepo: DebtRepository
): Promise<BalanceUpdaterOutput> {
  const { debtId, paymentAmount } = input

  // Rule 1: read current balance from DB (source of truth)
  const debt = await debtRepo.getById(debtId)
  if (!debt) throw new Error(`Debt ${debtId} not found in balance-updater — precondition violated`)

  const previousBalance = Number(debt.remainingBalance)

  // Rule 2: never negative (BR-17)
  const newBalance = Math.max(0, previousBalance - paymentAmount)

  // Rule 3+5: atomic update — paid_off if newBalance === 0
  const isPaidOff = newBalance === 0
  await debtRepo.updateBalance(debtId, newBalance, isPaidOff ? 'paid_off' : undefined)

  return { success: true, debtId, previousBalance, newBalance, isPaidOff }
}
