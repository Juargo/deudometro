<template>
  <div class="space-y-6">
    <!-- Greeting -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        Hola, {{ authStore.user?.displayName }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        {{ authStore.financialSpace?.name }} &middot;
        <span class="capitalize">{{ authStore.role }}</span>
      </p>
    </div>

    <!-- Upcoming Alerts -->
    <UpcomingAlerts />

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="h-28 bg-gray-100 rounded-lg animate-pulse" />
        <div class="h-28 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="h-64 bg-gray-100 rounded-lg animate-pulse" />
        <div class="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>

    <!-- Dashboard content -->
    <template v-else>
      <!-- Metrics row -->
      <FinancialSummaryMetrics />

      <!-- Gauge + Freedom Date -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DeudometroGauge :progress="debtStore.payoffProgress" />
        <FreedomDateCard />
      </div>

      <!-- Debt cards -->
      <DebtCardList />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store';
import { useDebtStore } from '~/stores/debt';
import { usePlanStore } from '~/stores/plan';

const authStore = useAuthStore();
const debtStore = useDebtStore();
const planStore = usePlanStore();

const loading = ref(true);

onMounted(async () => {
  try {
    await Promise.all([
      debtStore.fetchDebts(),
      planStore.fetchActivePlan().catch(() => null),
    ]);
  } finally {
    loading.value = false;
  }
});
</script>
