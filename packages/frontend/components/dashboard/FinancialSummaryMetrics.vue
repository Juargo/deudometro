<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Deuda Total</h3>
      <p class="mt-2 text-2xl font-bold text-gray-900">{{ formatCLP(debtStore.totalRemainingBalance) }}</p>
      <p v-if="debtStore.debts.length === 0" class="mt-1 text-xs text-gray-400">No tienes deudas activas</p>
    </div>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Costo Mensual en Intereses</h3>
      <p class="mt-2 text-2xl font-bold text-red-600">{{ formatCLP(debtStore.totalMonthlyInterestCost) }}</p>
      <p v-if="debtStore.debts.length === 0" class="mt-1 text-xs text-gray-400">No tienes deudas activas</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebtStore } from '~/stores/debt';
import { useCurrency } from '~/composables/useCurrency';

const debtStore = useDebtStore();
const { formatCLP } = useCurrency();
</script>
