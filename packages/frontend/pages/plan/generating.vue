<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
    <!-- Error state -->
    <template v-if="error">
      <div class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900">Error al generar el plan</h2>
        <p class="text-sm text-red-600 max-w-sm">{{ error }}</p>
        <NuxtLink
          to="/plan/strategy"
          class="inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Volver
        </NuxtLink>
      </div>
    </template>

    <!-- Generating state -->
    <template v-else>
      <!-- Spinner -->
      <div class="relative">
        <div class="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      </div>

      <div class="space-y-2">
        <h2 class="text-xl font-semibold text-gray-900">Generando tu plan de pagos...</h2>
        <p class="text-sm text-gray-500">Estamos calculando la mejor estrategia para ti.</p>
      </div>

      <!-- Delay warning -->
      <div
        v-if="showDelayWarning"
        class="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-sm text-sm text-yellow-800"
      >
        Esto está tardando más de lo esperado. El análisis de IA puede demorar un poco más — ya casi está.
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePlanGeneration } from '~/composables/usePlanGeneration';

const { error, showDelayWarning } = usePlanGeneration();
</script>
