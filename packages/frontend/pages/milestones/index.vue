<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Mis Logros</h1>

    <div v-if="paymentStore.loading" class="text-sm text-gray-400">Cargando logros...</div>
    <p v-else-if="paymentStore.error" class="text-sm text-red-600">{{ paymentStore.error }}</p>

    <template v-else>
      <!-- Empty state -->
      <div
        v-if="sortedMilestones.length === 0"
        class="text-center py-16 bg-white rounded-lg border border-gray-200"
      >
        <p class="text-gray-500 text-sm">No tienes logros aún. ¡Registra tu primer pago!</p>
        <NuxtLink
          to="/debts"
          class="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Ver deudas
        </NuxtLink>
      </div>

      <!-- Milestones list -->
      <div v-else class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div
          v-for="milestone in sortedMilestones"
          :key="milestone.id"
          class="flex items-start gap-4 px-5 py-4"
          :class="!milestone.acknowledgedAt ? 'bg-blue-50' : ''"
        >
          <!-- Type badge -->
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap mt-0.5 flex-shrink-0"
            :class="badgeClass(milestone.milestoneType)"
          >
            {{ typeLabel(milestone.milestoneType) }}
          </span>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800">{{ milestone.message }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(milestone.createdAt) }}</p>
          </div>

          <!-- Acknowledge button or acknowledged checkmark -->
          <div class="flex-shrink-0">
            <button
              v-if="!milestone.acknowledgedAt"
              type="button"
              :disabled="acknowledging === milestone.id"
              class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50"
              @click="handleAcknowledge(milestone.id)"
            >
              {{ acknowledging === milestone.id ? '...' : 'Aceptar' }}
            </button>
            <span v-else class="text-xs text-gray-400">Visto</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePaymentStore } from '~/stores/payment';

const paymentStore = usePaymentStore();
const acknowledging = ref<string | null>(null);

const milestoneTypeMap: Record<string, { label: string; classes: string }> = {
  first_payment: { label: 'Primer pago', classes: 'bg-blue-100 text-blue-800' },
  debt_paid_off: { label: 'Deuda pagada', classes: 'bg-green-100 text-green-800' },
  total_reduced_25pct: { label: '25% reducido', classes: 'bg-amber-100 text-amber-800' },
  total_reduced_50pct: { label: '50% reducido', classes: 'bg-orange-100 text-orange-800' },
  total_reduced_75pct: { label: '75% reducido', classes: 'bg-emerald-100 text-emerald-800' },
  plan_on_track: { label: 'Plan al día', classes: 'bg-purple-100 text-purple-800' },
};

function typeLabel(type: string): string {
  return milestoneTypeMap[type]?.label ?? type;
}

function badgeClass(type: string): string {
  return milestoneTypeMap[type]?.classes ?? 'bg-gray-100 text-gray-800';
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

const sortedMilestones = computed(() =>
  [...paymentStore.milestones].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
);

onMounted(async () => {
  await paymentStore.fetchMilestones();
});

async function handleAcknowledge(id: string) {
  acknowledging.value = id;
  try {
    await paymentStore.acknowledgeMilestone(id);
  } catch {
    // error already set in store
  } finally {
    acknowledging.value = null;
  }
}
</script>
