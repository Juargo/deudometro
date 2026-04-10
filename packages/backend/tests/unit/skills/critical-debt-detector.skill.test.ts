import { describe, it, expect } from 'vitest';
import { CriticalDebtDetectorSkill } from '../../../src/skills/critical-debt-detector.skill';
import { makeDebt } from './helpers';
import { Decimal } from '@prisma/client/runtime/library';

describe('CriticalDebtDetectorSkill', () => {
  const skill = new CriticalDebtDetectorSkill();

  it('marks debt as critical when monthly interest > minimum payment', () => {
    // remainingBalance=1000000, rate=5% => interest=50000 > minimumPayment=25000
    const debt = makeDebt({
      remainingBalance: new Decimal('1000000'),
      monthlyInterestRate: new Decimal('5'),
      minimumPayment: new Decimal('25000'),
      status: 'active',
    });

    const [result] = skill.detect([debt]);
    expect(result.isCritical).toBe(true);
  });

  it('marks debt as non-critical when monthly interest < minimum payment', () => {
    // remainingBalance=100000, rate=1% => interest=1000 < minimumPayment=25000
    const debt = makeDebt({
      remainingBalance: new Decimal('100000'),
      monthlyInterestRate: new Decimal('1'),
      minimumPayment: new Decimal('25000'),
      status: 'active',
    });

    const [result] = skill.detect([debt]);
    expect(result.isCritical).toBe(false);
  });

  it('marks debt as non-critical when rate=0', () => {
    const debt = makeDebt({
      remainingBalance: new Decimal('1000000'),
      monthlyInterestRate: new Decimal('0'),
      minimumPayment: new Decimal('25000'),
      status: 'active',
    });

    const [result] = skill.detect([debt]);
    expect(result.isCritical).toBe(false);
  });

  it('marks frozen debt as non-critical regardless of interest', () => {
    const debt = makeDebt({
      remainingBalance: new Decimal('1000000'),
      monthlyInterestRate: new Decimal('10'),
      minimumPayment: new Decimal('1'),
      status: 'frozen',
    });

    const [result] = skill.detect([debt]);
    expect(result.isCritical).toBe(false);
  });

  it('returns empty array for empty input', () => {
    const result = skill.detect([]);
    expect(result).toEqual([]);
  });
});
