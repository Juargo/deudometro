import { describe, it, expect, beforeEach } from 'vitest';
import { PlanCalculatorSkill } from '../../../src/skills/plan-calculator.skill';
import type { SortedDebt } from '../../../src/skills/strategy-sorter.skill';
import { Decimal } from '@prisma/client/runtime/library';

function makeSortedDebt(overrides: Partial<SortedDebt> = {}): SortedDebt {
  return {
    id: 'debt-1',
    label: 'Test Debt',
    debtType: 'credit_card',
    remainingBalance: new Decimal('500000'),
    monthlyInterestRate: new Decimal('2.0'),
    minimumPayment: new Decimal('20000'),
    isCritical: false,
    attackOrder: 1,
    ...overrides,
  };
}

describe('PlanCalculatorSkill', () => {
  let skill: PlanCalculatorSkill;

  beforeEach(() => {
    skill = new PlanCalculatorSkill();
  });

  it('single debt zero-interest exact payoff in 2 months', () => {
    // balance=100000, rate=0, min=50000, budget=50000 → 2 months
    const debt = makeSortedDebt({
      id: 'debt-1',
      remainingBalance: new Decimal('100000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('50000'),
      attackOrder: 1,
    });

    const result = skill.calculate({
      sortedDebts: [debt],
      monthlyBudget: new Decimal('50000'),
      debtPlanId: 'plan-1',
    });

    expect(result.totalMonths).toBe(2);
    expect(result.exceededMaxMonths).toBe(false);
    expect(result.totalInterestPaid.toNumber()).toBe(0);
  });

  it('two debts: surplus redistributed after first debt is paid off', () => {
    // debt-1 (attackOrder=1): balance=100000, rate=0, min=50000
    // debt-2 (attackOrder=2): balance=200000, rate=0, min=50000
    // budget=100000 → both get minimums, zero surplus initially
    // After month 2, debt-1 is fully paid, surplus of 50000 goes to debt-2
    const debt1 = makeSortedDebt({
      id: 'debt-1',
      remainingBalance: new Decimal('100000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('50000'),
      attackOrder: 1,
    });
    const debt2 = makeSortedDebt({
      id: 'debt-2',
      remainingBalance: new Decimal('200000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('50000'),
      attackOrder: 2,
    });

    const result = skill.calculate({
      sortedDebts: [debt1, debt2],
      monthlyBudget: new Decimal('100000'),
      debtPlanId: 'plan-1',
    });

    // Month 1: each debt pays its minimum (50000), no surplus
    // Month 2: debt-1 pays its last 50000 (done), debt-2 pays 50000 (150000→100000)
    // Month 3: debt-1 is paid; debt-2 gets 50000 minimum + 50000 surplus = 100000 → paid off
    expect(result.totalMonths).toBe(3);
    expect(result.exceededMaxMonths).toBe(false);
    // After debt-1 is paid, debt-2 month-3 action should have larger payment
    const debt2Actions = result.actions.filter(a => a.debtId === 'debt-2');
    const lastDebt2Action = debt2Actions[debt2Actions.length - 1];
    expect(lastDebt2Action.runningBalance.toNumber()).toBe(0);
    // Month 3 debt-2 payment should be 100000 (full surplus applied)
    expect(lastDebt2Action.paymentAmount.toNumber()).toBe(100000);
  });

  it('zero-interest debt: all payment is principal, no interest', () => {
    const debt = makeSortedDebt({
      id: 'debt-1',
      remainingBalance: new Decimal('50000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('50000'),
      attackOrder: 1,
    });

    const result = skill.calculate({
      sortedDebts: [debt],
      monthlyBudget: new Decimal('50000'),
      debtPlanId: 'plan-1',
    });

    expect(result.totalInterestPaid.toNumber()).toBe(0);
    result.actions.forEach(action => {
      expect(action.interestAmount.toNumber()).toBe(0);
      expect(action.principalAmount.toNumber()).toBe(action.paymentAmount.toNumber());
    });
  });

  it('budget equals sum of minimums: zero surplus, debts paid only via minimums', () => {
    const debt1 = makeSortedDebt({
      id: 'debt-1',
      remainingBalance: new Decimal('100000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('30000'),
      attackOrder: 1,
    });
    const debt2 = makeSortedDebt({
      id: 'debt-2',
      remainingBalance: new Decimal('60000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('20000'),
      attackOrder: 2,
    });

    // budget = 50000 = sum of minimums (30000 + 20000)
    const result = skill.calculate({
      sortedDebts: [debt1, debt2],
      monthlyBudget: new Decimal('50000'),
      debtPlanId: 'plan-1',
    });

    // No extra payments — paymentAmount equals minimumPayment for each action
    const debt1Actions = result.actions.filter(a => a.debtId === 'debt-1');
    // Each month, debt-1 gets exactly 30000
    expect(debt1Actions[0].paymentAmount.toNumber()).toBe(30000);
    expect(result.exceededMaxMonths).toBe(false);
  });

  it('exceededMaxMonths=true when debts cannot be paid in maxMonths', () => {
    // balance=1000000, rate=2%, min=5000, budget=5000 — can never pay off in 3 months
    const debt = makeSortedDebt({
      id: 'debt-1',
      remainingBalance: new Decimal('1000000'),
      monthlyInterestRate: new Decimal('2.0'),
      minimumPayment: new Decimal('5000'),
      attackOrder: 1,
    });

    const result = skill.calculate({
      sortedDebts: [debt],
      monthlyBudget: new Decimal('5000'),
      debtPlanId: 'plan-1',
      maxMonths: 3,
    });

    expect(result.exceededMaxMonths).toBe(true);
  });

  it('rounding invariant: principal + interest ≈ payment (±1) for all actions', () => {
    const debt = makeSortedDebt({
      id: 'debt-1',
      remainingBalance: new Decimal('750000'),
      monthlyInterestRate: new Decimal('3.5'),
      minimumPayment: new Decimal('25000'),
      attackOrder: 1,
    });

    const result = skill.calculate({
      sortedDebts: [debt],
      monthlyBudget: new Decimal('50000'),
      debtPlanId: 'plan-1',
    });

    for (const action of result.actions) {
      const computed = action.principalAmount.add(action.interestAmount);
      const diff = computed.sub(action.paymentAmount).abs().toNumber();
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  it('no actions emitted for debts already at zero balance', () => {
    const paidDebt = makeSortedDebt({
      id: 'debt-paid',
      remainingBalance: new Decimal('0'),
      monthlyInterestRate: new Decimal('2.0'),
      minimumPayment: new Decimal('0'),
      attackOrder: 1,
    });
    const activeDebt = makeSortedDebt({
      id: 'debt-active',
      remainingBalance: new Decimal('100000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('50000'),
      attackOrder: 2,
    });

    const result = skill.calculate({
      sortedDebts: [paidDebt, activeDebt],
      monthlyBudget: new Decimal('50000'),
      debtPlanId: 'plan-1',
    });

    // Paid debt should have no actions (it starts paid)
    const paidActions = result.actions.filter(a => a.debtId === 'debt-paid');
    expect(paidActions).toHaveLength(0);
  });
});
