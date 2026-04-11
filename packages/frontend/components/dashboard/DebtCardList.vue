<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Tus Deudas</h2>
      <NuxtLink
        v-if="debtStore.debts.length > maxCards"
        to="/debts"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        Ver todas &rarr;
      </NuxtLink>
    </div>
    <div v-if="visibleDebts.length === 0" class="text-sm text-gray-400">
      No tienes deudas registradas.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DebtCard v-for="debt in visibleDebts" :key="debt.id" :debt="debt" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebtStore } from '~/stores/debt';

const debtStore = useDebtStore();
const maxCards = 6;

const visibleDebts = computed(() => debtStore.sortedDebtsForDashboard.slice(0, maxCards));
</script>
