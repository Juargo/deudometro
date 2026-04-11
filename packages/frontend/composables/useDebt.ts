import { useDebtStore } from '~/stores/debt';
import type { UpdateDebtInput } from '~/stores/debt';
import { useApi } from '~/composables/useApi';
import type { DebtDTO } from '~/stores/debt';

export function useDebt() {
  const debtStore = useDebtStore();
  const { api } = useApi();

  async function getDebt(id: string): Promise<DebtDTO> {
    const data = await api<{ debt: DebtDTO }>(`/debts/${id}`);
    return data.debt;
  }

  async function updateDebt(id: string, input: UpdateDebtInput) {
    return await debtStore.updateDebt(id, input);
  }

  async function archiveDebt(id: string) {
    return await debtStore.archiveDebt(id);
  }

  async function toggleShared(id: string, isShared: boolean) {
    return await debtStore.toggleShared(id, isShared);
  }

  async function markDebtPaid(id: string) {
    return await debtStore.markDebtPaid(id);
  }

  return { getDebt, updateDebt, archiveDebt, toggleShared, markDebtPaid };
}
