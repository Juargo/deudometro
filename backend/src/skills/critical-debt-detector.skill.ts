// SKILL: critical-debt-detector
// Spec: specs/skills/SKILL-critical-debt-detector.md
// Pure computation — no side effects, no DB access.

import type { DebtType, DebtStatus } from '../types/domain'

export interface DebtInput {
  id: string
  label: string
  debtType: DebtType
  remainingBalance: number
  monthlyInterestRate: number | null
  minimumPayment: number
  status: DebtStatus
  [key: string]: unknown
}

export interface CriticalDebtResult extends DebtInput {
  isCritical: boolean
  monthlyInterestCost: number
}

export interface CriticalDebtDetectorOutput {
  debts: CriticalDebtResult[]
  criticalCount: number
  hasCriticalDebts: boolean
}

export function detectCriticalDebts(input: { debts: DebtInput[] }): CriticalDebtDetectorOutput {
  const debts: CriticalDebtResult[] = input.debts.map(debt => {
    // Rule 1: only 'active' debts are evaluated
    if (debt.status !== 'active') {
      return { ...debt, isCritical: false, monthlyInterestCost: 0 }
    }

    // Rule 4: null rate → no interest, not critical
    if (debt.monthlyInterestRate == null) {
      return { ...debt, isCritical: false, monthlyInterestCost: 0 }
    }

    // Rule 2: monthlyInterestCost = remainingBalance × (monthlyInterestRate / 100)
    const monthlyInterestCost = debt.remainingBalance * (debt.monthlyInterestRate / 100)

    // Rule 3: isCritical = monthlyInterestCost >= minimumPayment (BR-06)
    const isCritical = monthlyInterestCost >= debt.minimumPayment

    return { ...debt, isCritical, monthlyInterestCost }
  })

  // Rule 6-7: counts
  const criticalCount = debts.filter(d => d.isCritical).length

  return {
    debts,       // Rule 5: preserves input order
    criticalCount,
    hasCriticalDebts: criticalCount > 0,
  }
}
