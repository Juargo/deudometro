<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-sm text-gray-400">Cargando deuda...</div>
    <p v-else-if="fetchError" class="text-sm text-red-600">{{ fetchError }}</p>

    <template v-else-if="debt">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-gray-900">{{ debt.label }}</h1>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {{ debtTypeLabel(debt.debtType) }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1">{{ debt.lenderName }}</p>
        </div>
        <NuxtLink
          :to="`/debts/${debt.id}/edit`"
          class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Editar
        </NuxtLink>
      </div>

      <!-- Critical alert -->
      <div v-if="debt.isCritical" class="rounded-lg bg-red-50 border border-red-200 p-4">
        <p class="text-sm font-medium text-red-700">
          Esta deuda está marcada como crítica. El presupuesto disponible puede ser insuficiente para cubrir los pagos mínimos.
        </p>
      </div>

      <!-- Info grid -->
      <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div class="grid grid-cols-2 gap-x-4 px-5 py-4">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Monto original</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">{{ formatCLP(debt.originalBalance) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Saldo restante</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">{{ formatCLP(debt.remainingBalance) }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4 px-5 py-4">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Tasa mensual</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">{{ debt.monthlyInterestRate }}%</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Cuota mínima</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">{{ formatCLP(debt.minimumPayment) }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4 px-5 py-4">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">Día de vencimiento</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">Día {{ debt.paymentDueDay }}</p>
          </div>
          <div v-if="debt.cutoffDay">
            <p class="text-xs text-gray-400 uppercase tracking-wide">Día de corte</p>
            <p class="mt-1 text-sm font-semibold text-gray-900">Día {{ debt.cutoffDay }}</p>
          </div>
        </div>
        <div class="px-5 py-4">
          <p class="text-xs text-gray-400 uppercase tracking-wide">Estado</p>
          <p class="mt-1 text-sm font-semibold text-gray-900 capitalize">{{ debt.status }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <!-- Sharing toggle (owner only) -->
        <div v-if="authStore.role === 'owner'" class="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-5 py-4">
          <div>
            <p class="text-sm font-medium text-gray-700">Deuda compartida</p>
            <p class="text-xs text-gray-400">Visible para todos los miembros del espacio</p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
            :class="debt.isShared ? 'bg-blue-600' : 'bg-gray-200'"
            :disabled="togglingShared"
            @click="handleToggleShared"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200"
              :class="debt.isShared ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Archive button -->
        <button
          v-if="debt.status === 'active'"
          type="button"
          :disabled="archiving"
          class="w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
          @click="handleArchive"
        >
          {{ archiving ? 'Archivando...' : 'Archivar deuda' }}
        </button>
      </div>

      <p v-if="actionError" class="text-sm text-red-600">{{ actionError }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDebt } from '~/composables/useDebt';
import { useAuthStore } from '~/stores/auth.store';
import type { DebtDTO, DebtType } from '~/stores/debt';

const route = useRoute();
const debtId = route.params.id as string;

const { getDebt, archiveDebt, toggleShared } = useDebt();
const authStore = useAuthStore();

const debt = ref<DebtDTO | null>(null);
const loading = ref(true);
const fetchError = ref('');
const archiving = ref(false);
const togglingShared = ref(false);
const actionError = ref('');

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

onMounted(async () => {
  try {
    debt.value = await getDebt(debtId);
  } catch {
    fetchError.value = 'Error al cargar la deuda.';
  } finally {
    loading.value = false;
  }
});

async function handleArchive() {
  if (!confirm('¿Estás seguro de que deseas archivar esta deuda?')) return;
  actionError.value = '';
  archiving.value = true;
  try {
    await archiveDebt(debtId);
    navigateTo('/debts');
  } catch {
    actionError.value = 'Error al archivar la deuda.';
  } finally {
    archiving.value = false;
  }
}

async function handleToggleShared() {
  if (!debt.value) return;
  actionError.value = '';
  togglingShared.value = true;
  try {
    debt.value = await toggleShared(debtId, !debt.value.isShared);
  } catch {
    actionError.value = 'Error al actualizar la visibilidad.';
  } finally {
    togglingShared.value = false;
  }
}
</script>
