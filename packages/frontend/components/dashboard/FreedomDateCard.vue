<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Libertad Financiera</h3>

    <!-- State 1: No plan -->
    <template v-if="!planStore.activePlan">
      <p class="text-sm text-gray-500 mb-3">Genera un plan para ver tu fecha de libertad financiera</p>
      <NuxtLink
        to="/plan/strategy"
        class="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Generar plan
      </NuxtLink>
    </template>

    <!-- State 2: Plan without date -->
    <template v-else-if="!planStore.activePlan.financialFreedomDate">
      <p class="text-sm text-gray-500">Regenera tu plan para calcular la fecha</p>
    </template>

    <!-- State 3: Plan with date -->
    <template v-else>
      <p class="text-sm text-gray-500 mb-1">Libre de deudas en</p>
      <p class="text-2xl font-bold text-green-700 capitalize">{{ formattedDate }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePlanStore } from '~/stores/plan';

const planStore = usePlanStore();

const dateFormatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

const formattedDate = computed(() => {
  const raw = planStore.activePlan?.financialFreedomDate;
  if (!raw) return '';
  return dateFormatter.format(new Date(raw));
});
</script>
