<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Elige tu estrategia de pago</h1>
      <p class="mt-1 text-sm text-gray-500">Selecciona cómo quieres atacar tus deudas.</p>
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
import type { PlanStrategy } from '~/stores/plan';

const strategies = useStrategies();
const debtStore = useDebtStore();
const planStore = usePlanStore();

const hasCriticalDebts = computed(() => debtStore.criticalDebts.length > 0);
const selectedStrategy = ref<PlanStrategy | null>(null);
const isGenerating = computed(() => planStore.isGenerating);
const error = ref('');

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
  } catch {
    error.value = 'Error al generar el plan. Intenta de nuevo.';
  }
}

onMounted(async () => {
  if (debtStore.debts.length === 0) {
    await debtStore.fetchDebts('active');
  }
});
</script>
