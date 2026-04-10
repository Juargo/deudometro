import { Decimal } from '@prisma/client/runtime/library';
import type { FixedExpenses } from './update-financial-profile.skill';

export interface BudgetInput {
  monthlyIncome: Decimal;
  availableCapital: Decimal;
  monthlyAllocation: Decimal;
  fixedExpenses?: FixedExpenses | null;
  reservePercentage: Decimal;
  activeDebtMinimums?: Decimal[];
}

export interface BudgetBreakdown {
  effectiveIncome: Decimal;
  incomeSource: 'salary' | 'capital';
  totalFixedCosts: Decimal;
  netAfterExpenses: Decimal;
  reserveAmount: Decimal;
  availableBudget: Decimal;
  minimumPaymentsTotal: Decimal | null;
  budgetWarning: boolean;
}

export class GetAvailableBudgetSkill {
  calculate(input: BudgetInput): BudgetBreakdown {
    const zero = new Decimal(0);
    const hundred = new Decimal(100);

    const incomeIsPositive = input.monthlyIncome.greaterThan(zero);
    const effectiveIncome = incomeIsPositive ? input.monthlyIncome : input.monthlyAllocation;
    const incomeSource: 'salary' | 'capital' = incomeIsPositive ? 'salary' : 'capital';

    let totalFixedCosts = zero;
    if (input.fixedExpenses) {
      for (const value of Object.values(input.fixedExpenses)) {
        totalFixedCosts = totalFixedCosts.add(new Decimal(value));
      }
    }

    const netAfterExpenses = effectiveIncome.sub(totalFixedCosts);
    const reserveAmount = netAfterExpenses.mul(input.reservePercentage).div(hundred);
    const rawAvailable = netAfterExpenses.sub(reserveAmount);
    const availableBudget = rawAvailable.greaterThan(zero) ? rawAvailable : zero;

    let minimumPaymentsTotal: Decimal | null = null;
    if (input.activeDebtMinimums !== undefined && input.activeDebtMinimums.length > 0) {
      minimumPaymentsTotal = input.activeDebtMinimums.reduce((sum, m) => sum.add(m), zero);
    }

    const budgetWarning =
      minimumPaymentsTotal !== null && availableBudget.lessThan(minimumPaymentsTotal);

    return {
      effectiveIncome,
      incomeSource,
      totalFixedCosts,
      netAfterExpenses,
      reserveAmount,
      availableBudget,
      minimumPaymentsTotal,
      budgetWarning,
    };
  }
}
