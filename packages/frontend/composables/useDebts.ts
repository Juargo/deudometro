import { useDebtStore } from '~/stores/debt';
import type { DebtStatus, CreateDebtInput } from '~/stores/debt';

export function useDebts() {
  const debtStore = useDebtStore();

  const debts = computed(() => debtStore.debts);
  const loading = computed(() => debtStore.loading);
  const error = computed(() => debtStore.error);
  const criticalDebts = computed(() => debtStore.criticalDebts);

  async function fetchDebts(status?: DebtStatus) {
    await debtStore.fetchDebts(status);
  }

  async function createDebt(input: CreateDebtInput) {
    return await debtStore.createDebt(input);
  }

  return { debts, loading, error, criticalDebts, fetchDebts, createDebt };
}
