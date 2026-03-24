// Tests for critical-debt-detector skill
// Each test maps to a rule from SKILL-critical-debt-detector.md

import { describe, it, expect } from 'vitest'
import { detectCriticalDebts } from '../critical-debt-detector.skill'
import type { DebtInput } from '../critical-debt-detector.skill'

function makeDebt(overrides: Partial<DebtInput> = {}): DebtInput {
  return {
    id: 'debt-1',
    label: 'Tarjeta Visa',
    debtType: 'credit_card',
    remainingBalance: 500_000,
    monthlyInterestRate: 3,
    minimumPayment: 14_000,
    status: 'active',
    ...overrides,
  }
}

describe('critical-debt-detector', () => {
  // Rule 2-3: standard critical detection (example from spec)
  it('Rule 2-3 — detects critical debt (interest >= minimum)', () => {
    const debt = makeDebt({ remainingBalance: 500_000, monthlyInterestRate: 3, minimumPayment: 14_000 })
    // interest = 500000 × 0.03 = 15000 ≥ 14000 → critical
    const { debts } = detectCriticalDebts({ debts: [debt] })
    expect(debts[0].isCritical).toBe(true)
    expect(debts[0].monthlyInterestCost).toBeCloseTo(15_000)
  })

  it('Rule 2-3 — non-critical debt (interest < minimum)', () => {
    const debt = makeDebt({ remainingBalance: 200_000, monthlyInterestRate: 1.5, minimumPayment: 5_000 })
    // interest = 200000 × 0.015 = 3000 < 5000 → not critical
    const { debts } = detectCriticalDebts({ debts: [debt] })
    expect(debts[0].isCritical).toBe(false)
    expect(debts[0].monthlyInterestCost).toBeCloseTo(3_000)
  })

  // Rule 1: non-active debts are not evaluated
  it('Rule 1 — paid_off debt gets isCritical: false and monthlyInterestCost: 0', () => {
    const debt = makeDebt({ status: 'paid_off', remainingBalance: 0, minimumPayment: 0 })
    const { debts } = detectCriticalDebts({ debts: [debt] })
    expect(debts[0].isCritical).toBe(false)
    expect(debts[0].monthlyInterestCost).toBe(0)
  })

  it('Rule 1 — frozen debt gets isCritical: false', () => {
    const debt = makeDebt({ status: 'frozen' })
    const { debts } = detectCriticalDebts({ debts: [debt] })
    expect(debts[0].isCritical).toBe(false)
  })

  // Rule 4: null rate → not critical
  it('Rule 4 — informal_lender with null rate is not critical', () => {
    const debt = makeDebt({ debtType: 'informal_lender', monthlyInterestRate: null, minimumPayment: 10_000 })
    const { debts } = detectCriticalDebts({ debts: [debt] })
    expect(debts[0].isCritical).toBe(false)
    expect(debts[0].monthlyInterestCost).toBe(0)
  })

  // Rule 5: order preserved
  it('Rule 5 — output order matches input order', () => {
    const d1 = makeDebt({ id: 'a', label: 'First' })
    const d2 = makeDebt({ id: 'b', label: 'Second' })
    const { debts } = detectCriticalDebts({ debts: [d1, d2] })
    expect(debts[0].id).toBe('a')
    expect(debts[1].id).toBe('b')
  })

  // Rule 6-7: counts
  it('Rule 6-7 — criticalCount and hasCriticalDebts correct', () => {
    const critical = makeDebt({ id: '1', remainingBalance: 500_000, monthlyInterestRate: 3, minimumPayment: 14_000 })
    const normal = makeDebt({ id: '2', remainingBalance: 200_000, monthlyInterestRate: 1, minimumPayment: 5_000 })
    const result = detectCriticalDebts({ debts: [critical, normal] })
    expect(result.criticalCount).toBe(1)
    expect(result.hasCriticalDebts).toBe(true)
  })

  it('hasCriticalDebts is false when no critical debts', () => {
    const debt = makeDebt({ remainingBalance: 100_000, monthlyInterestRate: 1, minimumPayment: 5_000 })
    // interest = 1000 < 5000 → not critical
    const result = detectCriticalDebts({ debts: [debt] })
    expect(result.hasCriticalDebts).toBe(false)
    expect(result.criticalCount).toBe(0)
  })

  // BR-06: exact equality (interest === minimum) is critical
  it('BR-06 — interest exactly equal to minimum is critical', () => {
    const debt = makeDebt({ remainingBalance: 100_000, monthlyInterestRate: 5, minimumPayment: 5_000 })
    // interest = 100000 × 0.05 = 5000 === 5000 → critical
    const { debts } = detectCriticalDebts({ debts: [debt] })
    expect(debts[0].isCritical).toBe(true)
  })
})
