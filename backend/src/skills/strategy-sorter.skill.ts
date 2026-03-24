// SKILL: strategy-sorter
// Spec: specs/skills/SKILL-strategy-sorter.md
// Pure computation — no side effects, no DB access.

import type { StrategyType, DebtType, DebtStatus } from '../types/domain'
import type { DebtInput } from './critical-debt-detector.skill'

export interface DebtWithCritical extends DebtInput {
  isCritical: boolean
  monthlyInterestCost: number
  metadata: Record<string, unknown>
}

export interface SortedDebt extends DebtWithCritical {
  debtOrder: number
  priorityScore: number
}

export interface StrategySorterOutput {
  sortedDebts: SortedDebt[]
}

export function sortDebtsByStrategy(input: {
  debts: DebtWithCritical[]
  strategy: StrategyType
}): StrategySorterOutput {
  const { debts, strategy } = input
  const activeDebts = debts.filter(d => d.status === 'active')

  // Level 1: separate informal_lender (always first, BR-07)
  const informalDebts = activeDebts.filter(d => d.debtType === 'informal_lender')
  const regularDebts = activeDebts.filter(d => d.debtType !== 'informal_lender')

  // Level 1: sort informal_lender by urgencyLevel then remainingBalance (BR-27)
  const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const sortedInformal = [...informalDebts].sort((a, b) => {
    const ua = urgencyOrder[(a.metadata.urgencyLevel as string) ?? 'low'] ?? 2
    const ub = urgencyOrder[(b.metadata.urgencyLevel as string) ?? 'low'] ?? 2
    if (ua !== ub) return ua - ub
    return b.remainingBalance - a.remainingBalance  // higher balance first on tie
  })

  // Level 2: sort regular debts by strategy
  const sortedRegular = sortRegular(regularDebts, strategy)

  // Level 3: assign debtOrder sequentially
  const combined = [...sortedInformal, ...sortedRegular]
  const sortedDebts: SortedDebt[] = combined.map((debt, idx) => ({
    ...debt,
    debtOrder: idx + 1,
    priorityScore: 'priorityScore' in debt ? (debt as SortedDebt).priorityScore : 0,
  }))

  // Backfill priorityScore for informal (use urgency-based score)
  for (let i = 0; i < sortedInformal.length; i++) {
    const urgency = urgencyOrder[(sortedDebts[i].metadata.urgencyLevel as string) ?? 'low'] ?? 2
    sortedDebts[i].priorityScore = (3 - urgency) * 10000  // high=20000, medium=10000, low=0
  }

  return { sortedDebts }
}

function sortRegular(debts: DebtWithCritical[], strategy: StrategyType): SortedDebt[] {
  const maxBalance = debts.length > 0 ? Math.max(...debts.map(d => d.remainingBalance)) : 1

  const withScore: SortedDebt[] = debts.map(d => {
    let priorityScore: number

    switch (strategy) {
      case 'avalanche':
        // Higher rate first; tie: lower balance first
        priorityScore =
          (d.monthlyInterestRate ?? 0) * 1000 +
          (d.remainingBalance > 0 ? 1 / d.remainingBalance : 0)
        break

      case 'snowball':
        // Lower balance first; tie: higher rate first
        priorityScore =
          (d.remainingBalance > 0 ? 1 / d.remainingBalance : 0) * 1000 +
          (d.monthlyInterestRate ?? 0)
        break

      case 'hybrid':
        // Critical debts sorted by rate (avalanche), then non-critical by rate
        priorityScore = d.isCritical
          ? (d.monthlyInterestRate ?? 0) + 1000
          : (d.monthlyInterestRate ?? 0)
        break

      case 'crisis_first':
        // All critical debts before any non-critical; within each group: higher rate first
        priorityScore = d.isCritical
          ? (d.monthlyInterestRate ?? 0) + 10000
          : (d.monthlyInterestRate ?? 0)
        break

      case 'guided_consolidation':
        // Weighted score: rate×0.6 + (maxBalance/balance)×0.4×100
        priorityScore =
          (d.monthlyInterestRate ?? 0) * 0.6 +
          (d.remainingBalance > 0 ? (maxBalance / d.remainingBalance) : 0) * 0.4 * 100
        break
    }

    return { ...d, priorityScore, debtOrder: 0 } // debtOrder assigned later
  })

  // Sort descending by priorityScore (higher = earlier payment)
  return [...withScore].sort((a, b) => b.priorityScore - a.priorityScore)
}
