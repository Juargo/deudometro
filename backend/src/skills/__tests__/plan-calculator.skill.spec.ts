// Tests for plan-calculator skill
// Each test maps to a rule from SKILL-plan-calculator.md

import { describe, it, expect } from 'vitest'
import { calculatePlan } from '../plan-calculator.skill'
import type { SortedDebt } from '../strategy-sorter.skill'

function makeDebt(overrides: Partial<SortedDebt> & { id: string }): SortedDebt {
  return {
    label: `Debt ${overrides.id}`,
    debtType: 'consumer_loan',
    originalBalance: 100_000,
    remainingBalance: 100_000,
    monthlyInterestRate: 2,
    minimumPayment: 5_000,
    paymentDueDay: 15,
    lenderName: null,
    status: 'active',
    isCritical: false,
    monthlyInterestCost: 2_000,
    debtOrder: 1,
    priorityScore: 100,
    metadata: {},
    ...overrides,
  }
}

const START_DATE = new Date('2026-01-01')

describe('plan-calculator', () => {
  // Rule 1: INSUFFICIENT_BUDGET (BR-10)
  it('Rule 1 — returns INSUFFICIENT_BUDGET when monthlyBudget < total minimums', () => {
    const debt = makeDebt({ id: 'd1', minimumPayment: 5_000 })
    const result = calculatePlan({ sortedDebts: [debt], monthlyBudget: 4_000, planStartDate: START_DATE })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INSUFFICIENT_BUDGET')
      expect(result.deficit).toBe(1_000)
    }
  })

  // Basic plan: single debt, no extra budget
  it('produces a plan for a single debt with no surplus', () => {
    const debt = makeDebt({ id: 'd1', remainingBalance: 10_000, minimumPayment: 2_000, monthlyInterestRate: 1 })
    const result = calculatePlan({ sortedDebts: [debt], monthlyBudget: 2_000, planStartDate: START_DATE })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.planActions.length).toBeGreaterThan(0)
      expect(result.totalMonths).toBeGreaterThan(0)
    }
  })

  // Rule 7: principalAmount + interestAmount = paymentAmount (BR-23)
  it('Rule 7 — principalAmount + interestAmount === paymentAmount (BR-23)', () => {
    const debt = makeDebt({ id: 'd1', remainingBalance: 50_000, minimumPayment: 3_000, monthlyInterestRate: 2 })
    const result = calculatePlan({ sortedDebts: [debt], monthlyBudget: 5_000, planStartDate: START_DATE })
    expect(result.success).toBe(true)
    if (result.success) {
      for (const action of result.planActions) {
        const sum = action.principalAmount + action.interestAmount
        expect(Math.abs(sum - action.paymentAmount)).toBeLessThanOrEqual(0.01) // ±1 tolerance
      }
    }
  })

  // Rule 8: no negative remainingBalanceAfter
  it('Rule 8 — remainingBalanceAfter is never negative', () => {
    const debt = makeDebt({ id: 'd1', remainingBalance: 5_000, minimumPayment: 3_000, monthlyInterestRate: 1 })
    const result = calculatePlan({ sortedDebts: [debt], monthlyBudget: 10_000, planStartDate: START_DATE })
    expect(result.success).toBe(true)
    if (result.success) {
      for (const action of result.planActions) {
        expect(action.remainingBalanceAfter).toBeGreaterThanOrEqual(0)
      }
    }
  })

  // Surplus is applied to priority debt (debtOrder=1)
  it('applies surplus to debtOrder=1 first', () => {
    const d1 = makeDebt({ id: 'd1', debtOrder: 1, remainingBalance: 50_000, minimumPayment: 2_000, monthlyInterestRate: 0 })
    const d2 = makeDebt({ id: 'd2', debtOrder: 2, remainingBalance: 50_000, minimumPayment: 2_000, monthlyInterestRate: 0 })
    const result = calculatePlan({ sortedDebts: [d1, d2], monthlyBudget: 6_000, planStartDate: START_DATE })
    expect(result.success).toBe(true)
    if (result.success) {
      const firstMonthD1 = result.planActions.find(a => a.monthOffset === 1 && a.debtId === 'd1')
      const firstMonthD2 = result.planActions.find(a => a.monthOffset === 1 && a.debtId === 'd2')
      expect(firstMonthD1!.paymentAmount).toBeGreaterThan(2_000)  // gets surplus
      expect(firstMonthD2!.paymentAmount).toBe(2_000)             // only minimum
    }
  })

  // totalInterestNoPlan > totalInterestProjected (plan saves money)
  it('plan reduces total interest vs paying only minimums', () => {
    const debt = makeDebt({ id: 'd1', remainingBalance: 100_000, minimumPayment: 3_000, monthlyInterestRate: 2 })
    const result = calculatePlan({ sortedDebts: [debt], monthlyBudget: 8_000, planStartDate: START_DATE })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.totalInterestNoPlan).toBeGreaterThan(result.totalInterestProjected)
      expect(result.totalSavings).toBeGreaterThan(0)
    }
  })

  // informal_lender with null rate has no interest
  it('informal_lender (null rate) accumulates no interest', () => {
    const debt = makeDebt({
      id: 'd1',
      debtType: 'informal_lender',
      monthlyInterestRate: null,
      remainingBalance: 10_000,
      minimumPayment: 2_000,
    })
    const result = calculatePlan({ sortedDebts: [debt], monthlyBudget: 5_000, planStartDate: START_DATE })
    expect(result.success).toBe(true)
    if (result.success) {
      const totalInterest = result.planActions.reduce((s, a) => s + a.interestAmount, 0)
      expect(totalInterest).toBe(0)
    }
  })

  // estimatedPayoffDate is after planStartDate
  it('estimatedPayoffDate is after planStartDate', () => {
    const debt = makeDebt({ id: 'd1', remainingBalance: 10_000, minimumPayment: 2_000 })
    const result = calculatePlan({ sortedDebts: [debt], monthlyBudget: 5_000, planStartDate: START_DATE })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.estimatedPayoffDate.getTime()).toBeGreaterThan(START_DATE.getTime())
    }
  })
})
