// Tests for strategy-sorter skill
// Each test maps to a rule from SKILL-strategy-sorter.md

import { describe, it, expect } from 'vitest'
import { sortDebtsByStrategy } from '../strategy-sorter.skill'
import type { DebtWithCritical } from '../strategy-sorter.skill'

function makeDebt(overrides: Partial<DebtWithCritical> & { id: string }): DebtWithCritical {
  return {
    label: `Debt ${overrides.id}`,
    debtType: 'consumer_loan',
    remainingBalance: 100_000,
    monthlyInterestRate: 2,
    minimumPayment: 5_000,
    status: 'active',
    isCritical: false,
    monthlyInterestCost: 2_000,
    metadata: {},
    paymentDueDay: 15,
    lenderName: null,
    ...overrides,
  }
}

describe('strategy-sorter', () => {
  // Level 1: informal_lender always first (BR-07)
  it('Level 1 — informal_lender gets debtOrder 1 regardless of strategy', () => {
    const informal = makeDebt({ id: 'inf', debtType: 'informal_lender', metadata: { urgencyLevel: 'low' } })
    const cc = makeDebt({ id: 'cc', debtType: 'credit_card', monthlyInterestRate: 5 })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [cc, informal], strategy: 'avalanche' })
    expect(sortedDebts[0].id).toBe('inf')
    expect(sortedDebts[0].debtOrder).toBe(1)
  })

  // Level 1: urgency ordering for multiple informal_lenders
  it('Level 1 — multiple informal: high before medium before low (BR-27)', () => {
    const high = makeDebt({ id: 'h', debtType: 'informal_lender', metadata: { urgencyLevel: 'high' } })
    const low = makeDebt({ id: 'l', debtType: 'informal_lender', metadata: { urgencyLevel: 'low' } })
    const med = makeDebt({ id: 'm', debtType: 'informal_lender', metadata: { urgencyLevel: 'medium' } })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [low, med, high], strategy: 'avalanche' })
    expect(sortedDebts[0].id).toBe('h')
    expect(sortedDebts[1].id).toBe('m')
    expect(sortedDebts[2].id).toBe('l')
  })

  // Avalanche (BR-13): higher rate first
  it('avalanche — orders debts by rate descending', () => {
    const d1 = makeDebt({ id: 'd1', monthlyInterestRate: 1 })
    const d2 = makeDebt({ id: 'd2', monthlyInterestRate: 3 })
    const d3 = makeDebt({ id: 'd3', monthlyInterestRate: 2 })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [d1, d2, d3], strategy: 'avalanche' })
    expect(sortedDebts[0].id).toBe('d2') // highest rate
    expect(sortedDebts[1].id).toBe('d3')
    expect(sortedDebts[2].id).toBe('d1') // lowest rate
  })

  // Snowball (BR-14): lower balance first
  it('snowball — orders debts by balance ascending', () => {
    const d1 = makeDebt({ id: 'd1', remainingBalance: 300_000 })
    const d2 = makeDebt({ id: 'd2', remainingBalance: 50_000 })
    const d3 = makeDebt({ id: 'd3', remainingBalance: 150_000 })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [d1, d2, d3], strategy: 'snowball' })
    expect(sortedDebts[0].id).toBe('d2') // lowest balance
    expect(sortedDebts[1].id).toBe('d3')
    expect(sortedDebts[2].id).toBe('d1') // highest balance
  })

  // Hybrid (BR-15): critical debts by rate, then non-critical by rate
  it('hybrid — critical debts before non-critical', () => {
    const critical = makeDebt({ id: 'crit', isCritical: true, monthlyInterestRate: 2 })
    const normal = makeDebt({ id: 'norm', isCritical: false, monthlyInterestRate: 5 })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [normal, critical], strategy: 'hybrid' })
    expect(sortedDebts[0].id).toBe('crit')
    expect(sortedDebts[1].id).toBe('norm')
  })

  // Crisis first (BR-26): all critical before any non-critical
  it('crisis_first — all critical debts grouped before non-critical', () => {
    const c1 = makeDebt({ id: 'c1', isCritical: true, monthlyInterestRate: 1 })
    const c2 = makeDebt({ id: 'c2', isCritical: true, monthlyInterestRate: 5 })
    const n1 = makeDebt({ id: 'n1', isCritical: false, monthlyInterestRate: 10 })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [n1, c1, c2], strategy: 'crisis_first' })
    // Both critical debts must come before non-critical
    const critPositions = sortedDebts.filter(d => d.isCritical).map(d => d.debtOrder)
    const normPositions = sortedDebts.filter(d => !d.isCritical).map(d => d.debtOrder)
    expect(Math.max(...critPositions)).toBeLessThan(Math.min(...normPositions))
  })

  // Level 3: debtOrder assignment
  it('Level 3 — debtOrder is sequential starting at 1', () => {
    const d1 = makeDebt({ id: 'd1' })
    const d2 = makeDebt({ id: 'd2' })
    const d3 = makeDebt({ id: 'd3' })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [d1, d2, d3], strategy: 'snowball' })
    const orders = sortedDebts.map(d => d.debtOrder).sort((a, b) => a - b)
    expect(orders).toEqual([1, 2, 3])
  })

  // guided_consolidation (BR-28): score-based ordering
  it('guided_consolidation — produces deterministic ordering', () => {
    const d1 = makeDebt({ id: 'd1', monthlyInterestRate: 5, remainingBalance: 500_000 })
    const d2 = makeDebt({ id: 'd2', monthlyInterestRate: 1, remainingBalance: 50_000 })
    const { sortedDebts } = sortDebtsByStrategy({ debts: [d1, d2], strategy: 'guided_consolidation' })
    // Both debts get a score — just verify ordering is produced
    expect(sortedDebts).toHaveLength(2)
    expect(sortedDebts[0].debtOrder).toBe(1)
    expect(sortedDebts[1].debtOrder).toBe(2)
  })
})
