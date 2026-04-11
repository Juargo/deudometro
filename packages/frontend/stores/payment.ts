import { defineStore } from 'pinia';
import { usePayments } from '~/composables/usePayments';

export interface PaymentResponse {
  id: string;
  debtId: string;
  debtLabel?: string;
  financialSpaceId: string;
  recordedByUserId: string;
  amount: string;
  principalAmount: string;
  interestAmount: string;
  paidAt: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface MilestoneResponse {
  id: string;
  financialSpaceId: string;
  milestoneType: string;
  debtId: string | null;
  message: string;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface UpcomingAlertResponse {
  debtId: string;
  label: string;
  debtType: string;
  remainingBalance: string;
  minimumPayment: string;
  paymentDueDay: number;
  daysUntilDue: number;
}

export const usePaymentStore = defineStore('payment', () => {
  const payments = ref<PaymentResponse[]>([]);
  const milestones = ref<MilestoneResponse[]>([]);
  const alerts = ref<UpcomingAlertResponse[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  // Milestones returned from the last recordPayment call
  const lastMilestones = ref<MilestoneResponse[]>([]);

  const { recordPayment: apiRecordPayment, fetchPayments, fetchAlerts, fetchMilestones, acknowledgeMilestone: apiAcknowledge } = usePayments();

  async function recordPayment(
    debtId: string,
    amount: number,
    paidAt: string,
    idempotencyKey: string,
  ) {
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
    } catch (err: unknown) {
      error.value = 'Error al registrar el pago';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchHistory(debtId?: string) {
    loading.value = true;
    error.value = null;
    try {
      payments.value = await fetchPayments(debtId);
    } catch (err: unknown) {
      error.value = 'Error al cargar el historial de pagos';
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
    } catch (err: unknown) {
      error.value = 'Error al cargar las alertas';
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
    } catch (err: unknown) {
      error.value = 'Error al cargar los hitos';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function acknowledgeMilestone(id: string) {
    try {
      const updated = await apiAcknowledge(id);
      const idx = milestones.value.findIndex((m) => m.id === id);
      if (idx !== -1) milestones.value[idx] = updated;
      const lastIdx = lastMilestones.value.findIndex((m) => m.id === id);
      if (lastIdx !== -1) lastMilestones.value[lastIdx] = updated;
      return updated;
    } catch (err: unknown) {
      error.value = 'Error al confirmar el hito';
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
    clearLastMilestones,
  };
});
