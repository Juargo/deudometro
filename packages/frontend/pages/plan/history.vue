<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Historial de Planes</h1>
      <NuxtLink
        to="/plan/strategy"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Nuevo Plan
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-sm text-gray-400">Cargando historial...</div>

    <!-- Error -->
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- Empty state -->
    <div v-else-if="plans.length === 0" class="text-center py-16 text-gray-400">
      <p class="text-base">No tienes planes generados aún.</p>
      <NuxtLink
        to="/plan/strategy"
        class="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700"
      >
        Generar tu primer plan
      </NuxtLink>
    </div>

    <!-- Plans list -->
    <div v-else class="space-y-3">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="bg-white rounded-lg border border-gray-200 p-5 space-y-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-semibold text-gray-900">{{ strategyName(plan.strategy) }}</h3>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="statusClass(plan.status)"
              >
                {{ statusLabel(plan.status) }}
              </span>
            </div>
            <p class="text-xs text-gray-400">
              Generado el {{ formatDate(plan.createdAt) }}
            </p>
          </div>
          <div class="text-right text-sm text-gray-500 shrink-0">
            <template v-if="plan.totalMonths">
              {{ plan.totalMonths }} meses
            </template>
          </div>
        </div>

        <!-- AI status pill -->
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="aiStatusClass(plan.aiStatus)"
          >
            IA: {{ aiStatusLabel(plan.aiStatus) }}
          </span>
          <span v-if="plan.financialFreedomDate" class="text-xs text-green-700 font-medium">
            Libertad financiera: {{ formatDate(plan.financialFreedomDate) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlanStore } from '~/stores/plan';
import { useStrategies } from '~/composables/useStrategies';
import type { PlanStrategy, PlanStatus, AiStatus } from '~/stores/plan';

const planStore = usePlanStore();
const strategies = useStrategies();

const plans = computed(() => planStore.planHistory);
const loading = ref(true);
const error = ref<string | null>(null);

function strategyName(strategy: PlanStrategy): string {
  return strategies.find((s) => s.id === strategy)?.name ?? strategy;
}

function statusLabel(status: PlanStatus): string {
  const labels: Record<PlanStatus, string> = {
    active: 'Activo',
    superseded: 'Reemplazado',
    archived: 'Archivado',
  };
  return labels[status] ?? status;
}

function statusClass(status: PlanStatus): string {
  const classes: Record<PlanStatus, string> = {
    active: 'bg-green-100 text-green-700',
    superseded: 'bg-gray-100 text-gray-600',
    archived: 'bg-gray-100 text-gray-500',
  };
  return classes[status] ?? 'bg-gray-100 text-gray-600';
}

function aiStatusLabel(status: AiStatus): string {
  const labels: Record<AiStatus, string> = {
    completed: 'Completado',
    timeout: 'Tiempo agotado',
    pending: 'Pendiente',
    failed: 'Fallido',
  };
  return labels[status] ?? status;
}

function aiStatusClass(status: AiStatus): string {
  const classes: Record<AiStatus, string> = {
    completed: 'bg-blue-100 text-blue-700',
    timeout: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };
  return classes[status] ?? 'bg-gray-100 text-gray-600';
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

onMounted(async () => {
  try {
    await planStore.fetchPlanHistory();
  } catch {
    error.value = 'Error al cargar el historial de planes.';
  } finally {
    loading.value = false;
  }
});
</script>
