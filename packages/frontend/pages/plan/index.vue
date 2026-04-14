<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Plan de Pagos</h1>
        <p class="mt-1 text-sm text-gray-500">Diagnóstico y estrategia financiera personalizada</p>
      </div>
      <NuxtLink
        to="/plan/history"
        class="text-sm text-blue-600 hover:text-blue-700"
      >
        Ver historial
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-sm text-gray-400">Cargando plan...</div>

    <!-- Error -->
    <p v-else-if="fetchError" class="text-sm text-red-600">{{ fetchError }}</p>

    <!-- DiagnosisPanel (RF-31: primary view while feature is active) -->
    <PlanDiagnosisPanel v-else />

    <!-- Legacy plan content — hidden per RF-31 while diagnosis feature is active -->
    <!-- v-if="false" keeps the code but prevents rendering -->
    <template v-if="false">
      <!-- aiPending banner -->
      <div
        v-if="aiPending"
        class="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
      >
        <svg class="w-5 h-5 mt-0.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>El análisis de IA está pendiente. Puede tomar unos minutos adicionales. Puedes reintentar más tarde.</span>
      </div>

      <!-- Plan content -->
      <template v-if="plan">

        <!-- 1. AI Summary -->
        <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
          <h2 class="text-base font-semibold text-gray-900">Resumen de IA</h2>
          <template v-if="plan.aiAnalysis?.summary">
            <p class="text-sm text-gray-700">{{ plan.aiAnalysis.summary }}</p>
            <p v-if="plan.aiAnalysis.strategy_rationale" class="text-sm text-gray-500 italic">
              {{ plan.aiAnalysis.strategy_rationale }}
            </p>
          </template>
          <template v-else>
            <p class="text-sm text-gray-400">Resumen de IA pendiente...</p>
            <button
              type="button"
              :disabled="retrying"
              class="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              @click="handleRetryAi"
            >
              {{ retrying ? 'Reintentando...' : 'Reintentar' }}
            </button>
          </template>
        </section>

        <!-- 2. Monthly Focus -->
        <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-2">
          <h2 class="text-base font-semibold text-gray-900">Enfoque mensual</h2>
          <p v-if="plan.aiAnalysis?.monthly_focus" class="text-sm text-gray-700">
            {{ plan.aiAnalysis.monthly_focus }}
          </p>
          <p v-else class="text-sm text-gray-400">Información pendiente...</p>
        </section>

        <!-- 3. Critical Alerts -->
        <section v-if="plan.aiAnalysis?.critical_alerts?.length" class="space-y-2">
          <h2 class="text-base font-semibold text-gray-900">Alertas críticas</h2>
          <div
            v-for="(alert, idx) in plan.aiAnalysis.critical_alerts"
            :key="idx"
            class="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
          >
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {{ alert }}
          </div>
        </section>

        <!-- 4. Attack Order -->
        <section class="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
          <h2 class="text-base font-semibold text-gray-900">Orden de ataque</h2>
          <p class="text-xs text-gray-400">Deudas priorizadas según la estrategia seleccionada.</p>
          <ol class="space-y-2">
            <li
              v-for="item in attackOrder"
              :key="item.debtId"
              class="flex items-center gap-3"
            >
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {{ item.order }}
              </span>
              <span class="text-sm text-gray-800">{{ item.debtLabel }}</span>
            </li>
          </ol>
          <p v-if="attackOrder.length === 0" class="text-sm text-gray-400">Sin datos de acciones aún.</p>
        </section>

        <!-- 5. Financial Freedom -->
        <section
          v-if="plan.financialFreedomDate"
          class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center space-y-1"
        >
          <p class="text-sm font-medium text-green-700">Libre de deudas en</p>
          <p class="text-3xl font-bold text-green-800">{{ formatFreedomDate(plan.financialFreedomDate) }}</p>
        </section>

        <!-- 6. Milestones -->
        <section v-if="plan.aiAnalysis?.key_milestones?.length" class="space-y-3">
          <h2 class="text-base font-semibold text-gray-900">Hitos clave</h2>
          <div class="space-y-2">
            <div
              v-for="(milestone, idx) in plan.aiAnalysis.key_milestones"
              :key="idx"
              class="flex items-start gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg"
            >
              <span class="flex-shrink-0 text-xs font-semibold text-gray-400 pt-0.5 w-14">Mes {{ milestone.month }}</span>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ milestone.event }}</p>
                <p class="text-xs text-gray-500">{{ milestone.message }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 7. Monthly Timeline -->
        <section class="space-y-3">
          <h2 class="text-base font-semibold text-gray-900">Timeline mensual</h2>
          <div class="space-y-2">
            <details
              v-for="(monthActions, month) in actionsByMonth"
              :key="month"
              class="bg-white border border-gray-200 rounded-lg"
            >
              <summary class="px-5 py-3 cursor-pointer text-sm font-medium text-gray-800 flex items-center justify-between list-none">
                <span>{{ formatMonth(Number(month)) }}</span>
                <span class="text-xs text-gray-400">{{ monthActions.length }} pago(s)</span>
              </summary>
              <div class="border-t border-gray-100 divide-y divide-gray-50">
                <div
                  v-for="action in monthActions"
                  :key="action.id"
                  class="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600"
                >
                  <div>
                    <p class="text-gray-400">Deuda</p>
                    <p class="font-medium text-gray-800">{{ action.debtLabel }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400">Pago</p>
                    <p class="font-medium">{{ formatCLP(action.paymentAmount) }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400">Capital / Interés</p>
                    <p class="font-medium">{{ formatCLP(action.principalAmount) }} / {{ formatCLP(action.interestAmount) }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400">Saldo restante</p>
                    <p class="font-medium">{{ formatCLP(action.remainingBalance) }}</p>
                  </div>
                </div>
              </div>
            </details>
          </div>
          <p v-if="Object.keys(actionsByMonth).length === 0" class="text-sm text-gray-400">Sin acciones generadas aún.</p>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router';
import { usePlanStore } from '~/stores/plan';
import { usePlanView } from '~/composables/usePlanView';
import { useStrategies } from '~/composables/useStrategies';
import { useDiagnosis } from '~/composables/useDiagnosis';

const planStore = usePlanStore();
const { actionsByMonth, attackOrder, formatCLP, formatMonth, formatFreedomDate } = usePlanView();
const diagnosis = useDiagnosis();

const route = useRoute();
const aiPending = computed(() => route.query.aiPending === 'true');

const plan = computed(() => planStore.activePlan);
const loading = ref(true);
const fetchError = ref<string | null>(null);
const retrying = ref(false);

const strategies = useStrategies();
const strategyName = computed(() => {
  if (!plan.value) return '';
  return strategies.find((s) => s.id === plan.value!.strategy)?.name ?? plan.value.strategy;
});

async function handleRetryAi() {
  if (!plan.value) return;
  retrying.value = true;
  try {
    await planStore.retryAi(plan.value.id);
  } catch {
    // error is stored in planStore.error
  } finally {
    retrying.value = false;
  }
}

onMounted(async () => {
  try {
    await planStore.fetchActivePlan();
    // Note: we no longer redirect to /plan/strategy when no plan exists,
    // since DiagnosisPanel is the primary view and doesn't require an active plan.
  } catch {
    fetchError.value = 'Error al cargar el plan';
  } finally {
    loading.value = false;
  }
});

// S-31-E: reset Panel 2 diagnosis state when navigating away
onBeforeRouteLeave(() => {
  diagnosis.reset();
});
</script>
