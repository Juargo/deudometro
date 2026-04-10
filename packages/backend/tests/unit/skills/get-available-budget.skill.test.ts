import { describe, it, expect } from 'vitest';
import { GetAvailableBudgetSkill } from '../../../src/skills/get-available-budget.skill';
import { Decimal } from '@prisma/client/runtime/library';

describe('GetAvailableBudgetSkill', () => {
  const skill = new GetAvailableBudgetSkill();

  it('salary scenario: correct budget calculation', () => {
    const result = skill.calculate({
      monthlyIncome: new Decimal('1000000'),
      availableCapital: new Decimal('0'),
      monthlyAllocation: new Decimal('0'),
      fixedExpenses: { rent: 200000, utilities: 50000, food: 150000, transport: 50000, other: 0 },
      reservePercentage: new Decimal('10'),
    });

    expect(result.incomeSource).toBe('salary');
    expect(result.effectiveIncome.toNumber()).toBe(1000000);
    expect(result.totalFixedCosts.toNumber()).toBe(450000);
    // netAfterExpenses = 1000000 - 450000 = 550000
    // reserveAmount = 550000 * 10 / 100 = 55000
    // availableBudget = 550000 - 55000 = 495000
    expect(result.netAfterExpenses.toNumber()).toBe(550000);
    expect(result.reserveAmount.toNumber()).toBe(55000);
    expect(result.availableBudget.toNumber()).toBe(495000);
  });

  it('capital scenario: income=0, returns incomeSource="capital"', () => {
    const result = skill.calculate({
      monthlyIncome: new Decimal('0'),
      availableCapital: new Decimal('5000000'),
      monthlyAllocation: new Decimal('300000'),
      fixedExpenses: null,
      reservePercentage: new Decimal('10'),
    });

    expect(result.incomeSource).toBe('capital');
    expect(result.effectiveIncome.toNumber()).toBe(300000);
  });

  it('null expenses results in totalFixedCosts=0', () => {
    const result = skill.calculate({
      monthlyIncome: new Decimal('800000'),
      availableCapital: new Decimal('0'),
      monthlyAllocation: new Decimal('0'),
      fixedExpenses: null,
      reservePercentage: new Decimal('10'),
    });

    expect(result.totalFixedCosts.toNumber()).toBe(0);
  });

  it('budget warning when minimums > available budget', () => {
    const result = skill.calculate({
      monthlyIncome: new Decimal('500000'),
      availableCapital: new Decimal('0'),
      monthlyAllocation: new Decimal('0'),
      fixedExpenses: { rent: 400000, utilities: 0, food: 0, transport: 0, other: 0 },
      reservePercentage: new Decimal('10'),
      activeDebtMinimums: [new Decimal('100000'), new Decimal('100000')],
    });

    // netAfterExpenses = 500000 - 400000 = 100000
    // reserveAmount = 100000 * 10 / 100 = 10000
    // availableBudget = 100000 - 10000 = 90000
    // minimumPaymentsTotal = 200000 > 90000 → budgetWarning = true
    expect(result.budgetWarning).toBe(true);
    expect(result.minimumPaymentsTotal?.toNumber()).toBe(200000);
  });

  it('available budget floors at 0 when expenses exceed income', () => {
    const result = skill.calculate({
      monthlyIncome: new Decimal('100000'),
      availableCapital: new Decimal('0'),
      monthlyAllocation: new Decimal('0'),
      fixedExpenses: { rent: 200000, utilities: 0, food: 0, transport: 0, other: 0 },
      reservePercentage: new Decimal('10'),
    });

    expect(result.availableBudget.toNumber()).toBe(0);
  });
});
