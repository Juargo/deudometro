import { defineStore } from 'pinia';
import { u as useApi } from './useApi-VHnIxUUO.mjs';
import { ref } from 'vue';

function usePayments() {
  const { api } = useApi();
  async function recordPayment(debtId, amount, paidAt, idempotencyKey) {
    return await api("/payments", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey
      },
      body: { debtId, amount, paidAt }
    });
  }
  async function fetchPayments(debtId) {
    const query = debtId ? `?debtId=${debtId}` : "";
    const data = await api(`/payments${query}`);
    return data.payments;
  }
  async function fetchAlerts() {
    const data = await api("/payments/alerts");
    return data.alerts;
  }
  async function fetchMilestones() {
    const data = await api("/milestones");
    return data.milestones;
  }
  async function acknowledgeMilestone(id) {
    const data = await api(`/milestones/${id}/acknowledge`, {
      method: "POST"
    });
    return data.milestone;
  }
  return { recordPayment, fetchPayments, fetchAlerts, fetchMilestones, acknowledgeMilestone };
}
const usePaymentStore = defineStore("payment", () => {
  const payments = ref([]);
  const milestones = ref([]);
  const alerts = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const lastMilestones = ref([]);
  const { recordPayment: apiRecordPayment, fetchPayments, fetchAlerts, fetchMilestones, acknowledgeMilestone: apiAcknowledge } = usePayments();
  async function recordPayment(debtId, amount, paidAt, idempotencyKey) {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiRecordPayment(debtId, amount, paidAt, idempotencyKey);
      payments.value.unshift(result.payment);
      lastMilestones.value = result.milestones;
      if (result.milestones.length > 0) {
        milestones.value.push(...result.milestones);
      }
      return result;
    } catch (err) {
      error.value = "Error al registrar el pago";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function fetchHistory(debtId) {
    loading.value = true;
    error.value = null;
    try {
      payments.value = await fetchPayments(debtId);
    } catch (err) {
      error.value = "Error al cargar el historial de pagos";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function fetchAlertsAction() {
    loading.value = true;
    error.value = null;
    try {
      alerts.value = await fetchAlerts();
    } catch (err) {
      error.value = "Error al cargar las alertas";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function fetchMilestonesAction() {
    loading.value = true;
    error.value = null;
    try {
      milestones.value = await fetchMilestones();
    } catch (err) {
      error.value = "Error al cargar los hitos";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function acknowledgeMilestone(id) {
    try {
      const updated = await apiAcknowledge(id);
      const idx = milestones.value.findIndex((m) => m.id === id);
      if (idx !== -1) milestones.value[idx] = updated;
      const lastIdx = lastMilestones.value.findIndex((m) => m.id === id);
      if (lastIdx !== -1) lastMilestones.value[lastIdx] = updated;
      return updated;
    } catch (err) {
      error.value = "Error al confirmar el hito";
      throw err;
    }
  }
  function clearLastMilestones() {
    lastMilestones.value = [];
  }
  return {
    payments,
    milestones,
    alerts,
    loading,
    error,
    lastMilestones,
    recordPayment,
    fetchHistory,
    fetchAlerts: fetchAlertsAction,
    fetchMilestones: fetchMilestonesAction,
    acknowledgeMilestone,
    clearLastMilestones
  };
});

export { usePaymentStore as u };
//# sourceMappingURL=payment-BzRX-Lks.mjs.map
