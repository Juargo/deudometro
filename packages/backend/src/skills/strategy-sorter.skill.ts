import { Decimal } from '@prisma/client/runtime/library';

export interface DebtForPlan {
  id: string;
  label: string;
  debtType: string;
  remainingBalance: Decimal;
  monthlyInterestRate: Decimal;
  minimumPayment: Decimal;
  isCritical: boolean;
}

export interface SortedDebt extends DebtForPlan {
  attackOrder: number;
}

export type SortStrategy = 'avalanche' | 'snowball' | 'hybrid' | 'crisis_first' | 'guided_consolidation';

export interface StrategySorterInput {
  debts: DebtForPlan[];
  strategy: SortStrategy;
}

export class StrategySorterSkill {
  sort(input: StrategySorterInput): SortedDebt[] {
    const { debts, strategy } = input;

    const sorted = [...debts].sort((a, b) => {
      // informal_lender ALWAYS first
      const aIsInformal = a.debtType === 'informal_lender';
      const bIsInformal = b.debtType === 'informal_lender';
      if (aIsInformal && !bIsInformal) return -1;
      if (!aIsInformal && bIsInformal) return 1;

      switch (strategy) {
        case 'avalanche':
          // highest rate first
          return b.monthlyInterestRate.comparedTo(a.monthlyInterestRate);

        case 'snowball':
          // smallest balance first
          return a.remainingBalance.comparedTo(b.remainingBalance);

        case 'crisis_first':
          // critical debts first, then by rate desc
          if (a.isCritical && !b.isCritical) return -1;
          if (!a.isCritical && b.isCritical) return 1;
          return b.monthlyInterestRate.comparedTo(a.monthlyInterestRate);

        case 'hybrid':
        case 'guided_consolidation': {
          // weighted score = (normalizedRate * 0.6) + (normalizedInverseBalance * 0.4) desc
          const scoreA = this.hybridScore(a, debts);
          const scoreB = this.hybridScore(b, debts);
          return scoreB.comparedTo(scoreA);
        }

        default:
          return 0;
      }
    });

    return sorted.map((debt, index) => ({
      ...debt,
      attackOrder: index + 1,
    }));
  }

  private hybridScore(debt: DebtForPlan, allDebts: DebtForPlan[]): Decimal {
    const rates = allDebts.map((d) => d.monthlyInterestRate);
    const balances = allDebts.map((d) => d.remainingBalance);

    const maxRate = rates.reduce((max, r) => (r.greaterThan(max) ? r : max), rates[0]);
    const minRate = rates.reduce((min, r) => (r.lessThan(min) ? r : min), rates[0]);
    const maxBalance = balances.reduce((max, b) => (b.greaterThan(max) ? b : max), balances[0]);
    const minBalance = balances.reduce((min, b) => (b.lessThan(min) ? b : min), balances[0]);

    let normalizedRate: Decimal;
    if (maxRate.equals(minRate)) {
      normalizedRate = new Decimal(1);
    } else {
      normalizedRate = debt.monthlyInterestRate.sub(minRate).div(maxRate.sub(minRate));
    }

    let normalizedInverseBalance: Decimal;
    if (maxBalance.equals(minBalance)) {
      normalizedInverseBalance = new Decimal(1);
    } else {
      // inverse: smaller balance → higher score
      normalizedInverseBalance = maxBalance.sub(debt.remainingBalance).div(maxBalance.sub(minBalance));
    }

    return normalizedRate.mul(new Decimal('0.6')).add(normalizedInverseBalance.mul(new Decimal('0.4')));
  }
}
