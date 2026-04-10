<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Mis Deudas</h1>
      <NuxtLink
        to="/debts/new"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Nueva Deuda
      </NuxtLink>
    </div>

    <!-- Tab filter -->
    <div class="flex gap-1 border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="
          activeTab === tab.value
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        "
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-sm text-gray-400">Cargando deudas...</div>

    <!-- Error state -->
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- Empty state -->
    <div v-else-if="debts.length === 0" class="text-center py-16 text-gray-400">
      <p class="text-base">No tienes deudas registradas</p>
    </div>

    <!-- Debt cards -->
    <div v-else class="space-y-3">
      <div
        v-for="debt in debts"
        :key="debt.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer hover:border-gray-300 transition-colors"
        @click="navigateTo(`/debts/${debt.id}`)"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-gray-900">{{ debt.label }}</h3>
              <span
                v-if="debt.isCritical"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"
              >
                Crítica
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-0.5">{{ debt.lenderName }} &middot; {{ debtTypeLabel(debt.debtType) }}</p>
          </div>
          <div class="text-right">
            <p class="text-base font-bold text-gray-900">{{ formatCLP(debt.remainingBalance) }}</p>
            <p class="text-xs text-gray-400 mt-0.5">saldo restante</p>
          </div>
        </div>
        <div class="mt-3 flex gap-6 text-xs text-gray-500">
          <span>Tasa: {{ debt.monthlyInterestRate }}% mensual</span>
          <span>Cuota mínima: {{ formatCLP(debt.minimumPayment) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebtStore } from '~/stores/debt';
import type { DebtType } from '~/stores/debt';

const debtStore = useDebtStore();
const debts = computed(() => debtStore.debts);
const loading = computed(() => debtStore.loading);
const error = computed(() => debtStore.error);

type TabValue = 'active' | 'frozen';

const tabs: { label: string; value: TabValue }[] = [
  { label: 'Activas', value: 'active' },
  { label: 'Archivadas', value: 'frozen' },
];
const activeTab = ref<TabValue>('active');

function formatCLP(amount: number | string): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount));
}

function debtTypeLabel(type: DebtType): string {
  const labels: Record<DebtType, string> = {
    credit_card: 'Tarjeta de Crédito',
    consumer_loan: 'Crédito de Consumo',
    mortgage: 'Hipotecario',
    informal_lender: 'Deuda Informal',
  };
  return labels[type];
}

async function switchTab(tab: TabValue) {
  activeTab.value = tab;
  await debtStore.fetchDebts(tab === 'frozen' ? 'frozen' : 'active');
}

onMounted(async () => {
  await debtStore.fetchDebts('active');
});
</script>
