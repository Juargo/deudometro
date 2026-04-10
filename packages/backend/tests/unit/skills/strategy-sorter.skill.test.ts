import { describe, it, expect, beforeEach } from 'vitest';
import { StrategySorterSkill } from '../../../src/skills/strategy-sorter.skill';
import type { DebtForPlan } from '../../../src/skills/strategy-sorter.skill';
import { Decimal } from '@prisma/client/runtime/library';

function makeDebtForPlan(overrides: Partial<DebtForPlan> = {}): DebtForPlan {
  return {
    id: 'debt-1',
    label: 'Test Debt',
    debtType: 'credit_card',
    remainingBalance: new Decimal('500000'),
    monthlyInterestRate: new Decimal('2.0'),
    minimumPayment: new Decimal('20000'),
    isCritical: false,
    ...overrides,
  };
}

describe('StrategySorterSkill', () => {
  let skill: StrategySorterSkill;

  beforeEach(() => {
    skill = new StrategySorterSkill();
  });

  describe('avalanche strategy', () => {
    it('sorts debts by monthly interest rate descending', () => {
      const debts: DebtForPlan[] = [
        makeDebtForPlan({ id: 'debt-a', monthlyInterestRate: new Decimal('1.5') }),
        makeDebtForPlan({ id: 'debt-b', monthlyInterestRate: new Decimal('3.5') }),
        makeDebtForPlan({ id: 'debt-c', monthlyInterestRate: new Decimal('2.0') }),
      ];

      const result = skill.sort({ debts, strategy: 'avalanche' });

      expect(result[0].id).toBe('debt-b');
      expect(result[1].id).toBe('debt-c');
      expect(result[2].id).toBe('debt-a');
    });
  });

  describe('snowball strategy', () => {
    it('sorts debts by remaining balance ascending', () => {
      const debts: DebtForPlan[] = [
        makeDebtForPlan({ id: 'debt-a', remainingBalance: new Decimal('1000000') }),
        makeDebtForPlan({ id: 'debt-b', remainingBalance: new Decimal('200000') }),
        makeDebtForPlan({ id: 'debt-c', remainingBalance: new Decimal('500000') }),
      ];

      const result = skill.sort({ debts, strategy: 'snowball' });

      expect(result[0].id).toBe('debt-b');
      expect(result[1].id).toBe('debt-c');
      expect(result[2].id).toBe('debt-a');
    });
  });

  describe('crisis_first strategy', () => {
    it('places critical debts before non-critical, then by rate desc within each group', () => {
      const debts: DebtForPlan[] = [
        makeDebtForPlan({ id: 'debt-a', isCritical: false, monthlyInterestRate: new Decimal('3.0') }),
        makeDebtForPlan({ id: 'debt-b', isCritical: true, monthlyInterestRate: new Decimal('1.5') }),
        makeDebtForPlan({ id: 'debt-c', isCritical: true, monthlyInterestRate: new Decimal('2.5') }),
        makeDebtForPlan({ id: 'debt-d', isCritical: false, monthlyInterestRate: new Decimal('2.0') }),
      ];

      const result = skill.sort({ debts, strategy: 'crisis_first' });

      // Critical first
      expect(result[0].isCritical).toBe(true);
      expect(result[1].isCritical).toBe(true);
      // Within critical: highest rate first
      expect(result[0].id).toBe('debt-c');
      expect(result[1].id).toBe('debt-b');
      // Non-critical after, by rate desc
      expect(result[2].id).toBe('debt-a');
      expect(result[3].id).toBe('debt-d');
    });
  });

  describe('hybrid strategy', () => {
    it('sorts by weighted score (rate * 0.6 + inverse balance * 0.4) descending', () => {
      // debt-a: high rate, high balance → moderate score
      // debt-b: low rate, low balance → moderate score
      // debt-c: high rate, low balance → highest score
      const debts: DebtForPlan[] = [
        makeDebtForPlan({ id: 'debt-a', monthlyInterestRate: new Decimal('4.0'), remainingBalance: new Decimal('1000000') }),
        makeDebtForPlan({ id: 'debt-b', monthlyInterestRate: new Decimal('1.0'), remainingBalance: new Decimal('100000') }),
        makeDebtForPlan({ id: 'debt-c', monthlyInterestRate: new Decimal('4.0'), remainingBalance: new Decimal('100000') }),
      ];

      const result = skill.sort({ debts, strategy: 'hybrid' });

      // debt-c has max rate AND min balance → highest score
      expect(result[0].id).toBe('debt-c');
    });
  });

  describe('informal_lender priority', () => {
    it('places informal_lender first regardless of strategy', () => {
      const debts: DebtForPlan[] = [
        makeDebtForPlan({ id: 'debt-a', debtType: 'credit_card', monthlyInterestRate: new Decimal('5.0') }),
        makeDebtForPlan({ id: 'debt-b', debtType: 'informal_lender', monthlyInterestRate: new Decimal('0') }),
        makeDebtForPlan({ id: 'debt-c', debtType: 'consumer_loan', monthlyInterestRate: new Decimal('3.0') }),
      ];

      const avalancheResult = skill.sort({ debts, strategy: 'avalanche' });
      expect(avalancheResult[0].id).toBe('debt-b');

      const snowballResult = skill.sort({ debts, strategy: 'snowball' });
      expect(snowballResult[0].id).toBe('debt-b');

      const crisisResult = skill.sort({ debts, strategy: 'crisis_first' });
      expect(crisisResult[0].id).toBe('debt-b');
    });
  });

  describe('single debt', () => {
    it('returns single debt with attackOrder=1', () => {
      const debts: DebtForPlan[] = [
        makeDebtForPlan({ id: 'debt-only' }),
      ];

      const result = skill.sort({ debts, strategy: 'avalanche' });

      expect(result).toHaveLength(1);
      expect(result[0].attackOrder).toBe(1);
    });
  });

  describe('attackOrder', () => {
    it('assigns sequential attackOrder starting at 1', () => {
      const debts: DebtForPlan[] = [
        makeDebtForPlan({ id: 'debt-a', monthlyInterestRate: new Decimal('3.0') }),
        makeDebtForPlan({ id: 'debt-b', monthlyInterestRate: new Decimal('2.0') }),
        makeDebtForPlan({ id: 'debt-c', monthlyInterestRate: new Decimal('1.0') }),
      ];

      const result = skill.sort({ debts, strategy: 'avalanche' });

      expect(result[0].attackOrder).toBe(1);
      expect(result[1].attackOrder).toBe(2);
      expect(result[2].attackOrder).toBe(3);
    });
  });
});
