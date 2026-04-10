import { Decimal } from '@prisma/client/runtime/library';
import type { SortedDebt } from './strategy-sorter.skill';
import type { CreatePlanActionInput } from '../repositories/interfaces/plan-action.repository';
import type { DebtType } from '@prisma/client';

export interface PlanCalculatorInput {
  sortedDebts: SortedDebt[];
  monthlyBudget: Decimal;
  debtPlanId: string;
  maxMonths?: number;
}

export interface PlanCalculationResult {
  actions: CreatePlanActionInput[];
  totalMonths: number;
  totalInterestPaid: Decimal;
  financialFreedomDate: Date;
  exceededMaxMonths: boolean;
}

interface WorkingDebt {
  id: string;
  label: string;
  debtType: string;
  attackOrder: number;
  minimumPayment: Decimal;
  monthlyInterestRate: Decimal;
  currentBalance: Decimal;
  paid: boolean;
}

export class PlanCalculatorSkill {
  calculate(input: PlanCalculatorInput): PlanCalculationResult {
    const { sortedDebts, monthlyBudget, debtPlanId, maxMonths = 360 } = input;
    const zero = new Decimal(0);

    const workingDebts: WorkingDebt[] = sortedDebts.map((d) => ({
      id: d.id,
      label: d.label,
      debtType: d.debtType,
      attackOrder: d.attackOrder,
      minimumPayment: d.minimumPayment,
      monthlyInterestRate: d.monthlyInterestRate,
      currentBalance: d.remainingBalance,
      paid: false,
    }));

    const actions: CreatePlanActionInput[] = [];
    let totalMonths = 0;
    let exceededMaxMonths = false;

    for (let month = 1; month <= maxMonths; month++) {
      const activeDebts = workingDebts.filter((d) => !d.paid);
      if (activeDebts.length === 0) break;

      totalMonths = month;

      // Map from debtId to the action index for this month (for surplus updates)
      const monthActionIndex: Map<string, number> = new Map();
      let totalMinPaid = zero;

      // Step 1: pay minimums for each active debt
      for (const debt of activeDebts) {
        // Skip debts already at zero balance (mark paid, no action needed)
        if (debt.currentBalance.lessThanOrEqualTo(zero)) {
          debt.paid = true;
          continue;
        }

        const interest = debt.currentBalance.mul(debt.monthlyInterestRate).div(100);
        const balancePlusInterest = debt.currentBalance.add(interest);
        const effectiveMin = Decimal.min(debt.minimumPayment, balancePlusInterest);

        let principal = effectiveMin.sub(interest);
        let actualInterest = interest;
        if (principal.lessThan(zero)) {
          principal = zero;
          actualInterest = effectiveMin;
        }

        const newBalance = balancePlusInterest.sub(effectiveMin);
        const runningBalance = newBalance.lessThan(zero) ? zero : newBalance;

        const actionIndex = actions.length;
        actions.push({
          debtPlanId,
          debtId: debt.id,
          debtLabel: debt.label,
          debtType: debt.debtType as DebtType,
          month,
          paymentAmount: effectiveMin,
          principalAmount: principal,
          interestAmount: actualInterest,
          runningBalance,
        });

        monthActionIndex.set(debt.id, actionIndex);
        debt.currentBalance = runningBalance;
        totalMinPaid = totalMinPaid.add(effectiveMin);

        // Mark as paid if balance reached zero via minimum payment
        if (debt.currentBalance.lessThanOrEqualTo(zero)) {
          debt.paid = true;
        }
      }

      // Step 2: apply surplus to highest priority active debts
      let surplus = monthlyBudget.sub(totalMinPaid);

      for (const debt of activeDebts.sort((a, b) => a.attackOrder - b.attackOrder)) {
        if (surplus.lessThanOrEqualTo(zero)) break;
        if (debt.currentBalance.lessThanOrEqualTo(zero)) continue;

        const extraPayment = Decimal.min(surplus, debt.currentBalance);
        const idx = monthActionIndex.get(debt.id)!;

        actions[idx] = {
          ...actions[idx],
          paymentAmount: actions[idx].paymentAmount.add(extraPayment),
          principalAmount: actions[idx].principalAmount.add(extraPayment),
          runningBalance: actions[idx].runningBalance.sub(extraPayment),
        };

        debt.currentBalance = debt.currentBalance.sub(extraPayment);
        surplus = surplus.sub(extraPayment);

        if (debt.currentBalance.lessThanOrEqualTo(zero)) {
          debt.paid = true;
        }
      }

      // Check if all debts are now paid
      if (workingDebts.every((d) => d.paid)) break;
    }

    // Check if we hit maxMonths without finishing
    if (workingDebts.some((d) => !d.paid)) {
      exceededMaxMonths = true;
    }

    // Compute total interest paid
    const totalInterestPaid = actions.reduce((sum, a) => sum.add(a.interestAmount), zero);

    // Compute financial freedom date
    const financialFreedomDate = new Date();
    financialFreedomDate.setMonth(financialFreedomDate.getMonth() + totalMonths);

    return {
      actions,
      totalMonths,
      totalInterestPaid,
      financialFreedomDate,
      exceededMaxMonths,
    };
  }
}
