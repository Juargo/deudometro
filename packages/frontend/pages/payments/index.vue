<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Historial de Pagos</h1>
    </div>

    <!-- Filter by debt -->
    <div class="flex items-center gap-3">
      <label for="debtFilter" class="text-sm font-medium text-gray-700">Filtrar por deuda:</label>
      <select
        id="debtFilter"
        v-model="selectedDebtId"
        class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @change="handleFilterChange"
      >
        <option value="">Todas las deudas</option>
        <option v-for="debt in debtStore.debts" :key="debt.id" :value="debt.id">
          {{ debt.label }}
        </option>
      </select>
    </div>

    <!-- Loading / Error -->
    <div v-if="paymentStore.loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-10 bg-gray-100 rounded animate-pulse" />
    </div>
    <p v-else-if="paymentStore.error" class="text-sm text-red-600">{{ paymentStore.error }}</p>

    <!-- Empty state -->
    <div
      v-else-if="paymentStore.payments.length === 0"
      class="text-center py-12 text-gray-400"
    >
      <p class="text-base">No hay pagos registrados aun.</p>
      <NuxtLink
        to="/debts"
        class="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700"
      >
        Ir a mis deudas para registrar un pago
      </NuxtLink>
    </div>

    <!-- Payments table -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Deuda</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Monto</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Capital</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Interés</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="payment in paymentStore.payments" :key="payment.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
              {{ formatDate(payment.paidAt) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ payment.debtLabel ?? payment.debtId }}
            </td>
            <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
              {{ formatCLP(payment.amount) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
              {{ formatCLP(payment.principalAmount) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
              {{ formatCLP(payment.interestAmount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePaymentStore } from '~/stores/payment';
import { useDebtStore } from '~/stores/debt';

const paymentStore = usePaymentStore();
const debtStore = useDebtStore();

const selectedDebtId = ref('');

function formatCLP(value: string | number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value));
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

async function handleFilterChange() {
  await paymentStore.fetchHistory(selectedDebtId.value || undefined);
}

onMounted(async () => {
  await Promise.all([
    paymentStore.fetchHistory(),
    debtStore.debts.length === 0 ? debtStore.fetchDebts() : Promise.resolve(),
  ]);
});
</script>
