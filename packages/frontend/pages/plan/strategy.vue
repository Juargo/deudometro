<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Elige tu estrategia de pago</h1>
      <p class="mt-1 text-sm text-gray-500">Selecciona cómo quieres atacar tus deudas.</p>
    </div>

    <!-- Budget summary -->
    <div v-if="budgetLoading" class="text-sm text-gray-500">Cargando presupuesto...</div>
    <div v-else-if="budget" class="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
      <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Resumen de presupuesto</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="text-gray-500">Ingreso efectivo</span>
          <p class="font-semibold text-gray-900">{{ formatCLP(budget.effectiveIncome) }}</p>
        </div>
        <div>
          <span class="text-gray-500">Gastos fijos</span>
          <p class="font-semibold text-gray-900">{{ formatCLP(budget.totalFixedCosts) }}</p>
        </div>
        <div>
          <span class="text-gray-500">Reserva</span>
          <p class="font-semibold text-gray-900">{{ formatCLP(budget.reserveAmount) }}</p>
        </div>
        <div>
          <span class="text-gray-500">Cuotas minimas</span>
          <p class="font-semibold text-gray-900">{{ budget.minimumPaymentsTotal != null ? formatCLP(budget.minimumPaymentsTotal) : '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Deudas activas</span>
          <p class="font-semibold text-gray-900">{{ activeDebtsCount }}</p>
        </div>
        <div>
          <span class="text-gray-500">Disponible para deudas</span>
          <p class="font-semibold" :class="budget.availableBudget > 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCLP(budget.availableBudget) }}
          </p>
        </div>
      </div>
      <div v-if="budget.budgetWarning" class="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <svg class="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        El presupuesto disponible es menor a la suma de cuotas minimas. Revisa tu perfil financiero.
      </div>
    </div>

    <!-- Strategy grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        v-for="strategy in strategies"
        :key="strategy.id"
        type="button"
        class="relative text-left p-5 rounded-lg border-2 transition-all focus:outline-none"
        :class="[
          selectedStrategy === strategy.id
            ? colorSelected[strategy.color]
            : 'border-gray-200 bg-white hover:border-gray-300',
        ]"
        @click="selectedStrategy = strategy.id"
      >
        <!-- Recommended badge -->
        <span
          v-if="strategy.id === 'crisis_first' && hasCriticalDebts"
          class="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700"
        >
          ¡Recomendado!
        </span>

        <!-- Color accent bar -->
        <div class="w-8 h-1 rounded-full mb-3" :class="colorBar[strategy.color]" />

        <h3 class="text-base font-semibold text-gray-900">{{ strategy.name }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ strategy.description }}</p>

        <!-- Selected indicator -->
        <div
          v-if="selectedStrategy === strategy.id"
          class="absolute top-3 left-3 w-3 h-3 rounded-full"
          :class="colorDot[strategy.color]"
        />
      </button>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- CTA -->
    <div class="flex justify-end pt-2">
      <button
        type="button"
        :disabled="!selectedStrategy || isGenerating"
        class="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleGenerate"
      >
        {{ isGenerating ? 'Generando...' : 'Generar Plan' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStrategies } from '~/composables/useStrategies';
import { useDebtStore } from '~/stores/debt';
import { usePlanStore } from '~/stores/plan';
import { useProfileStore } from '~/stores/profile';
import type { PlanStrategy } from '~/stores/plan';

const strategies = useStrategies();
const debtStore = useDebtStore();
const planStore = usePlanStore();
const profileStore = useProfileStore();
const { formatCLP } = useCurrency();

const hasCriticalDebts = computed(() => debtStore.criticalDebts.length > 0);
const selectedStrategy = ref<PlanStrategy | null>(null);
const isGenerating = computed(() => planStore.isGenerating);
const error = ref('');
const budget = computed(() => profileStore.budget);
const budgetLoading = computed(() => profileStore.loading);
const activeDebtsCount = computed(() => debtStore.debts.filter(d => d.status === 'active').length);

type StrategyColor = 'blue' | 'green' | 'purple' | 'red' | 'orange';

const colorSelected: Record<StrategyColor, string> = {
  blue: 'border-blue-500 bg-blue-50',
  green: 'border-green-500 bg-green-50',
  purple: 'border-purple-500 bg-purple-50',
  red: 'border-red-500 bg-red-50',
  orange: 'border-orange-500 bg-orange-50',
};

const colorBar: Record<StrategyColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
};

const colorDot: Record<StrategyColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
};

async function handleGenerate() {
  if (!selectedStrategy.value) return;
  error.value = '';
  try {
    await planStore.generatePlan(selectedStrategy.value);
    const aiStatus = planStore.generationAiStatus;
    if (aiStatus === 'timeout' || aiStatus === 'circuit_open') {
      navigateTo('/plan?aiPending=true');
    } else {
      navigateTo('/plan');
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data: { error: string; message?: string } }).data;
      const messages: Record<string, string> = {
        NO_ACTIVE_DEBTS: 'No tienes deudas activas para generar un plan.',
        NO_SURPLUS: 'Tu presupuesto disponible es $0. Ajusta tu perfil financiero.',
        INSUFFICIENT_BUDGET: 'Tu presupuesto disponible es menor a la suma de cuotas minimas. Revisa tu perfil financiero o tus deudas.',
      };
      error.value = messages[data.error] || data.message || 'Error al generar el plan.';
    } else {
      error.value = 'Error al generar el plan. Intenta de nuevo.';
    }
  }
}

onMounted(async () => {
  await Promise.all([
    debtStore.debts.length === 0 ? debtStore.fetchDebts('active') : Promise.resolve(),
    profileStore.fetchProfile(),
  ]);
});
</script>
