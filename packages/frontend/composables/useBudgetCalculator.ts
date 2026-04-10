import type { Ref } from 'vue';
import type { FixedExpenses } from '~/stores/profile';

export interface BudgetCalculatorInput {
  monthlyIncome: Ref<number>;
  availableCapital: Ref<number>;
  monthlyAllocation: Ref<number>;
  fixedExpenses: Ref<FixedExpenses>;
  reservePercentage: Ref<number>;
}

export function useBudgetCalculator(input: BudgetCalculatorInput) {
  const effectiveIncome = computed(() => {
    return input.monthlyIncome.value > 0 ? input.monthlyIncome.value : input.monthlyAllocation.value;
  });

  const incomeSource = computed<'salary' | 'capital'>(() => {
    return input.monthlyIncome.value > 0 ? 'salary' : 'capital';
  });

  const totalFixedCosts = computed(() => {
    const exp = input.fixedExpenses.value;
    return (exp.rent ?? 0) + (exp.utilities ?? 0) + (exp.food ?? 0) + (exp.transport ?? 0) + (exp.other ?? 0);
  });

  const netAfterExpenses = computed(() => {
    return effectiveIncome.value - totalFixedCosts.value;
  });

  const reserveAmount = computed(() => {
    return (netAfterExpenses.value * input.reservePercentage.value) / 100;
  });

  const availableBudget = computed(() => {
    const raw = netAfterExpenses.value - reserveAmount.value;
    return raw > 0 ? raw : 0;
  });

  return {
    effectiveIncome,
    incomeSource,
    totalFixedCosts,
    netAfterExpenses,
    reserveAmount,
    availableBudget,
  };
}
