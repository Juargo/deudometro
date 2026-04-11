import { useApi } from '~/composables/useApi';
import type { PaymentResponse, MilestoneResponse, UpcomingAlertResponse } from '~/stores/payment';

interface RecordPaymentResponse {
  payment: PaymentResponse;
  updatedDebt: { id: string; remainingBalance: string; status: string };
  milestones: MilestoneResponse[];
}

export function usePayments() {
  const { api } = useApi();

  async function recordPayment(
    debtId: string,
    amount: number,
    paidAt: string,
    idempotencyKey: string,
  ): Promise<RecordPaymentResponse> {
    return await api<RecordPaymentResponse>('/payments', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: { debtId, amount, paidAt },
    });
  }

  async function fetchPayments(debtId?: string): Promise<PaymentResponse[]> {
    const query = debtId ? `?debtId=${debtId}` : '';
    const data = await api<{ payments: PaymentResponse[] }>(`/payments${query}`);
    return data.payments;
  }

  async function fetchAlerts(): Promise<UpcomingAlertResponse[]> {
    const data = await api<{ alerts: UpcomingAlertResponse[] }>('/payments/alerts');
    return data.alerts;
  }

  async function fetchMilestones(): Promise<MilestoneResponse[]> {
    const data = await api<{ milestones: MilestoneResponse[] }>('/milestones');
    return data.milestones;
  }

  async function acknowledgeMilestone(id: string): Promise<MilestoneResponse> {
    const data = await api<{ milestone: MilestoneResponse }>(`/milestones/${id}/acknowledge`, {
      method: 'POST',
    });
    return data.milestone;
  }

  return { recordPayment, fetchPayments, fetchAlerts, fetchMilestones, acknowledgeMilestone };
}
