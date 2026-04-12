import { u as useDebtStore } from './debt-DEiAVWjq.mjs';
import { u as useApi } from './useApi-VHnIxUUO.mjs';

function useDebt() {
  const debtStore = useDebtStore();
  const { api } = useApi();
  async function getDebt(id) {
    const data = await api(`/debts/${id}`);
    return data.debt;
  }
  async function updateDebt(id, input) {
    return await debtStore.updateDebt(id, input);
  }
  async function archiveDebt(id) {
    return await debtStore.archiveDebt(id);
  }
  async function toggleShared(id, isShared) {
    return await debtStore.toggleShared(id, isShared);
  }
  async function markDebtPaid(id) {
    return await debtStore.markDebtPaid(id);
  }
  return { getDebt, updateDebt, archiveDebt, toggleShared, markDebtPaid };
}

export { useDebt as u };
//# sourceMappingURL=useDebt-BqwciZML.mjs.map
