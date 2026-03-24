// SKILL: plan-calculator
// Spec: specs/skills/SKILL-plan-calculator.md
// Pure computation — no side effects, no DB access.

import type { SortedDebt } from './strategy-sorter.skill'

export interface PlanActionData {
  debtId: string
  monthOffset: number
  paymentAmount: number
  principalAmount: number
  interestAmount: number
  remainingBalanceAfter: number
  debtOrder: number
}

export interface PlanCalculatorInput {
  sortedDebts: SortedDebt[]
  monthlyBudget: number
  planStartDate: Date
}

export type PlanCalculatorOutput =
  | {
      success: true
      planActions: PlanActionData[]
      estimatedPayoffDate: Date
      totalInterestProjected: number
      totalInterestNoPlan: number
      totalSavings: number
      totalMonths: number
    }
  | {
      success: false
      error: 'INSUFFICIENT_BUDGET'
      deficit: number
    }

const MAX_MONTHS = 600 // 50-year safety cap
const EPSILON = 0.01  // tolerance for floating-point zero checks

export function calculatePlan(input: PlanCalculatorInput): PlanCalculatorOutput {
  const { sortedDebts, monthlyBudget, planStartDate } = input
  const activeDebts = sortedDebts.filter(d => d.status === 'active')

  // Rule 1: check budget sufficiency (BR-10)
  const totalMinimum = activeDebts.reduce((sum, d) => sum + d.minimumPayment, 0)
  if (monthlyBudget < totalMinimum) {
    return { success: false, error: 'INSUFFICIENT_BUDGET', deficit: totalMinimum - monthlyBudget }
  }

  // Rule 2: working balances (copy — never modify originals)
  const workingBalances = new Map<string, number>()
  for (const debt of activeDebts) {
    workingBalances.set(debt.id, debt.remainingBalance)
  }

  const planActions: PlanActionData[] = []
  let totalInterestProjected = 0
  let month = 0

  while (month < MAX_MONTHS) {
    // Check if all debts are paid
    const totalRemaining = [...workingBalances.values()].reduce((a, b) => a + b, 0)
    if (totalRemaining < EPSILON) break

    month++

    // Debts still active this month
    const stillActive = activeDebts.filter(d => (workingBalances.get(d.id) ?? 0) >= EPSILON)

    // Step a+b: calculate (possibly adjusted) interest per debt
    const adjustedInterest = new Map<string, number>()
    for (const debt of stillActive) {
      const rate = debt.monthlyInterestRate ?? 0
      const balance = workingBalances.get(debt.id)!
      const rawInterest = balance * (rate / 100)
      const minPayment = debt.minimumPayment
      // If minimum doesn't cover interest, all minimum goes to interest
      adjustedInterest.set(debt.id, rawInterest >= minPayment ? minPayment : rawInterest)
    }

    // Step c: surplus over all minimums for active debts
    const activeMinimumTotal = stillActive.reduce((s, d) => s + d.minimumPayment, 0)
    const surplus = monthlyBudget - activeMinimumTotal

    // Step d: priority debt = lowest debtOrder still active
    const priorityDebt = stillActive.reduce((prev, cur) =>
      cur.debtOrder < prev.debtOrder ? cur : prev
    )

    // Step e: generate PlanActionData for each active debt
    for (const debt of stillActive) {
      const balance = workingBalances.get(debt.id)!
      const interest = adjustedInterest.get(debt.id)!
      const minPayment = debt.minimumPayment
      const minimumPrincipal = Math.max(0, minPayment - interest)

      let paymentAmount: number
      if (debt.id === priorityDebt.id) {
        const maxExtra = Math.max(0, balance - minimumPrincipal)
        const extraPayment = Math.min(surplus, maxExtra)
        paymentAmount = minPayment + extraPayment
      } else {
        paymentAmount = minPayment
      }

      let principalAmount = paymentAmount - interest
      let remainingBalanceAfter = balance - principalAmount

      // Rule 8+step e: remainingBalanceAfter cannot be negative
      if (remainingBalanceAfter < 0) {
        remainingBalanceAfter = 0
        principalAmount = balance
        paymentAmount = principalAmount + interest
      }

      const action: PlanActionData = {
        debtId: debt.id,
        monthOffset: month,
        paymentAmount: round2(paymentAmount),
        principalAmount: round2(principalAmount),
        interestAmount: round2(interest),
        remainingBalanceAfter: round2(remainingBalanceAfter),
        debtOrder: debt.debtOrder,
      }

      planActions.push(action)
      totalInterestProjected += interest

      // Step f: update working balance
      workingBalances.set(debt.id, remainingBalanceAfter)
    }
    // Step g: paid-off debts have balance 0 and won't appear in stillActive next month
    // Their minimumPayment contributes to surplus automatically (via activeMinimumTotal)
  }

  // Rule 4: estimatedPayoffDate
  const payoffDate = new Date(planStartDate)
  payoffDate.setMonth(payoffDate.getMonth() + month)

  // Rule 6: totalInterestNoPlan — simulate each debt independently with minimums only
  const totalInterestNoPlan = calcNoplanInterest(activeDebts)

  return {
    success: true,
    planActions,
    estimatedPayoffDate: payoffDate,
    totalInterestProjected: round2(totalInterestProjected),
    totalInterestNoPlan: round2(totalInterestNoPlan),
    totalSavings: round2(totalInterestNoPlan - totalInterestProjected),
    totalMonths: month,
  }
}

function calcNoplanInterest(debts: SortedDebt[]): number {
  let total = 0
  for (const debt of debts) {
    let balance = debt.remainingBalance
    const rate = debt.monthlyInterestRate ?? 0
    const minPayment = debt.minimumPayment
    let m = 0

    while (balance >= EPSILON && m < MAX_MONTHS) {
      const interest = balance * (rate / 100)
      const principal = minPayment - interest
      total += interest
      if (principal <= 0) {
        // Minimum doesn't cover interest — cap at MAX_MONTHS
        total += interest * (MAX_MONTHS - m - 1)
        break
      }
      balance -= principal
      if (balance < 0) balance = 0
      m++
    }
  }
  return total
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
