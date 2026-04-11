import { defineStore } from 'pinia';

export type PlanStrategy = 'avalanche' | 'snowball' | 'hybrid' | 'crisis_first' | 'guided_consolidation';
export type PlanStatus = 'active' | 'superseded' | 'archived';
export type AiStatus = 'completed' | 'timeout' | 'pending' | 'failed';

export interface PlanAction {
  id: string;
  planId: string;
  month: number;
  debtId: string;
  debtLabel: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

export interface AiAnalysis {
  summary: string | null;
  strategy_rationale: string | null;
  monthly_focus: string | null;
  key_milestones: Array<{ month: number; event: string; message: string }> | null;
  critical_alerts: string[] | null;
}

export interface PaymentPlan {
  id: string;
  financialSpaceId: string;
  strategy: PlanStrategy;
  status: PlanStatus;
  totalMonths: number;
  totalInterestPaid: number;
  financialFreedomDate: string | null;
  aiAnalysis: AiAnalysis | null;
  aiStatus: AiStatus;
  createdAt: string;
  updatedAt: string;
}

export const usePlanStore = defineStore('plan', () => {
  const activePlan = ref<PaymentPlan | null>(null);
  const activePlanActions = ref<PlanAction[]>([]);
  const planHistory = ref<PaymentPlan[]>([]);
  const isGenerating = ref(false);
  const generationAiStatus = ref<AiStatus | null>(null);
  const error = ref<string | null>(null);

  const { api } = useApi();

  async function generatePlan(strategy: PlanStrategy): Promise<{ plan: PaymentPlan; actions: PlanAction[]; aiStatus: AiStatus }> {
    isGenerating.value = true;
    error.value = null;
    try {
      const data = await api<{ plan: PaymentPlan; actions: PlanAction[]; aiStatus: AiStatus }>('/plan/generate', {
        method: 'POST',
        body: { strategy },
      });
      activePlan.value = data.plan;
      activePlanActions.value = data.actions;
      generationAiStatus.value = data.aiStatus;
      return data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al generar el plan';
      throw e;
    } finally {
      isGenerating.value = false;
    }
  }

  async function fetchActivePlan(): Promise<void> {
    error.value = null;
    try {
      const data = await api<{ plan: PaymentPlan; actions: PlanAction[] } | null>('/plan');
      if (data) {
        activePlan.value = data.plan;
        activePlanActions.value = data.actions;
      } else {
        activePlan.value = null;
        activePlanActions.value = [];
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar el plan';
      throw e;
    }
  }

  async function fetchPlanHistory(): Promise<void> {
    error.value = null;
    try {
      const data = await api<{ plans: PaymentPlan[] }>('/plan/history');
      planHistory.value = data.plans;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar el historial';
      throw e;
    }
  }

  async function retryAi(planId: string): Promise<void> {
    error.value = null;
    try {
      const data = await api<{ plan: PaymentPlan }>(`/plan/${planId}/retry-ai`, {
        method: 'POST',
      });
      activePlan.value = data.plan;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al reintentar análisis de IA';
      throw e;
    }
  }

  return {
    activePlan,
    activePlanActions,
    planHistory,
    isGenerating,
    generationAiStatus,
    error,
    generatePlan,
    fetchActivePlan,
    fetchPlanHistory,
    retryAi,
  };
});
