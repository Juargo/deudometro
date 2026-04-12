import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { u as useApi } from './useApi-VHnIxUUO.mjs';

const useDebtStore = defineStore("debt", () => {
  const debts = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const criticalDebts = computed(() => debts.value.filter((d) => d.isCritical));
  const totalRemainingBalance = computed(
    () => debts.value.reduce((sum, d) => sum + d.remainingBalance, 0)
  );
  const totalOriginalBalance = computed(
    () => debts.value.reduce((sum, d) => sum + d.originalBalance, 0)
  );
  const totalMonthlyInterestCost = computed(
    () => debts.value.filter((d) => d.status === "active").reduce((sum, d) => sum + d.remainingBalance * d.monthlyInterestRate / 100, 0)
  );
  const payoffProgress = computed(() => {
    const original = totalOriginalBalance.value;
    if (original === 0) return 0;
    return Math.round((original - totalRemainingBalance.value) / original * 100);
  });
  const sortedDebtsForDashboard = computed(
    () => [...debts.value].sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.remainingBalance - a.remainingBalance;
    })
  );
  const { api } = useApi();
  async function fetchDebts(status) {
    loading.value = true;
    error.value = null;
    try {
      const query = status ? `?status=${status}` : "";
      const data = await api(`/debts${query}`);
      debts.value = data.debts;
    } catch (err) {
      error.value = "Error al cargar las deudas";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function createDebt(input) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api("/debts", {
        method: "POST",
        body: input
      });
      debts.value.push(data.debt);
      return data.debt;
    } catch (err) {
      error.value = "Error al crear la deuda";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function updateDebt(id, input) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api(`/debts/${id}`, {
        method: "PATCH",
        body: input
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value[idx] = data.debt;
      return data.debt;
    } catch (err) {
      error.value = "Error al actualizar la deuda";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function archiveDebt(id) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api(`/debts/${id}/archive`, {
        method: "POST"
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value.splice(idx, 1);
      return data.debt;
    } catch (err) {
      error.value = "Error al archivar la deuda";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function toggleShared(id, isShared) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api(`/debts/${id}/shared`, {
        method: "PATCH",
        body: { isShared }
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value[idx] = data.debt;
      return data.debt;
    } catch (err) {
      error.value = "Error al actualizar la visibilidad de la deuda";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function markDebtPaid(id) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api(`/debts/${id}/mark-paid`, {
        method: "POST"
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value[idx] = data.debt;
      return data.debt;
    } catch (err) {
      error.value = "Error al marcar la deuda como pagada";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  return { debts, loading, error, criticalDebts, totalRemainingBalance, totalOriginalBalance, totalMonthlyInterestCost, payoffProgress, sortedDebtsForDashboard, fetchDebts, createDebt, updateDebt, archiveDebt, toggleShared, markDebtPaid };
});

export { useDebtStore as u };
//# sourceMappingURL=debt-DEiAVWjq.mjs.map
