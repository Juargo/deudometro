<template>
  <div v-if="alerts.length > 0" class="space-y-3">
    <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Alertas de pago próximo</h2>
    <ul class="space-y-2">
      <li
        v-for="alert in alerts"
        :key="alert.debtId"
        class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-semibold text-amber-900">{{ alert.label }}</p>
          <p class="text-xs text-amber-700 mt-0.5">
            Vence en {{ alert.daysUntilDue === 0 ? 'hoy' : `${alert.daysUntilDue} día${alert.daysUntilDue === 1 ? '' : 's'}` }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-amber-900">{{ formatCLP(alert.minimumPayment) }}</p>
          <p class="text-xs text-amber-600">cuota mínima</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { usePaymentStore } from '~/stores/payment';

const paymentStore = usePaymentStore();
const alerts = computed(() => paymentStore.alerts);

function formatCLP(value: string | number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value));
}

onMounted(async () => {
  try {
    await paymentStore.fetchAlerts();
  } catch {
    // Non-fatal: silently hide on error
  }
});
</script>
