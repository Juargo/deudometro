import { defineStore } from 'pinia';
import { ref } from 'vue';
import { u as useApi } from './useApi-VHnIxUUO.mjs';

const usePlanStore = defineStore("plan", () => {
  const activePlan = ref(null);
  const activePlanActions = ref([]);
  const planHistory = ref([]);
  const isGenerating = ref(false);
  const generationAiStatus = ref(null);
  const error = ref(null);
  const { api } = useApi();
  async function generatePlan(strategy) {
    isGenerating.value = true;
    error.value = null;
    try {
      const data = await api("/plan/generate", {
        method: "POST",
        body: { strategy }
      });
      activePlan.value = data.plan;
      activePlanActions.value = data.actions;
      generationAiStatus.value = data.aiStatus;
      return data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Error al generar el plan";
      throw e;
    } finally {
      isGenerating.value = false;
    }
  }
  async function fetchActivePlan() {
    var _a;
    error.value = null;
    try {
      const data = await api("/plan");
      activePlan.value = data.plan;
      activePlanActions.value = (_a = data.actions) != null ? _a : [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Error al cargar el plan";
      throw e;
    }
  }
  async function fetchPlanHistory() {
    error.value = null;
    try {
      const data = await api("/plan/history");
      planHistory.value = data.plans;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Error al cargar el historial";
      throw e;
    }
  }
  async function retryAi(planId) {
    error.value = null;
    try {
      const data = await api(`/plan/${planId}/retry-ai`, {
        method: "POST"
      });
      activePlan.value = data.plan;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Error al reintentar an\xE1lisis de IA";
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
    retryAi
  };
});

export { usePlanStore as u };
//# sourceMappingURL=plan-BO2V3g5d.mjs.map
