<template>
  <div class="space-y-6 max-w-lg mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <NuxtLink :to="`/debts/${debtId}`" class="text-gray-400 hover:text-gray-600">
        ← Volver
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">Registrar Pago</h1>
    </div>

    <!-- Debt context -->
    <div v-if="debt" class="bg-white rounded-lg border border-gray-200 px-5 py-4 space-y-1">
      <p class="text-sm font-medium text-gray-700">{{ debt.label }}</p>
      <p class="text-xs text-gray-400">
        Saldo restante:
        <span class="font-semibold text-gray-800">{{ formatCLP(debt.remainingBalance) }}</span>
      </p>
      <p class="text-xs text-gray-400">
        Cuota mínima:
        <span class="font-semibold text-gray-800">{{ formatCLP(debt.minimumPayment) }}</span>
      </p>
    </div>

    <!-- Error banner -->
    <div v-if="submitError" class="rounded-lg bg-red-50 border border-red-200 p-4">
      <p class="text-sm text-red-700">{{ submitError }}</p>
    </div>

    <!-- Form -->
    <form class="bg-white rounded-lg border border-gray-200 p-6 space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            id="amount"
            v-model.number="amount"
            type="number"
            min="1"
            step="1"
            required
            placeholder="0"
            class="block w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label for="paidAt" class="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label>
        <input
          id="paidAt"
          v-model="paidAt"
          type="date"
          required
          class="block w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        :disabled="submitting"
        class="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ submitting ? 'Registrando...' : 'Registrar Pago' }}
      </button>
    </form>

    <!-- Milestone celebration modal -->
    <MilestoneCelebration
      :milestones="paymentStore.lastMilestones"
      :visible="showMilestones"
      @close="handleMilestoneClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useDebt } from '~/composables/useDebt';
import { usePaymentStore } from '~/stores/payment';
import type { DebtDTO } from '~/stores/debt';

const route = useRoute();
const debtId = route.params.id as string;

const { getDebt } = useDebt();
const paymentStore = usePaymentStore();

const debt = ref<DebtDTO | null>(null);
const amount = ref<number | null>(null);
const paidAt = ref('');
const submitting = ref(false);
const submitError = ref('');
const showMilestones = ref(false);

function formatCLP(value: number | string): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

onMounted(async () => {
  paidAt.value = todayISO();
  paymentStore.clearLastMilestones();
  try {
    debt.value = await getDebt(debtId);
  } catch {
    // Non-fatal: form still works without context
  }
});

const idempotencyKey = crypto.randomUUID();

const ERROR_MESSAGES: Record<string, string> = {
  DEBT_ALREADY_PAID: 'Esta deuda ya está pagada.',
  PAYMENT_EXCEEDS_BALANCE: 'El monto del pago supera el saldo restante.',
  DEBT_NOT_FOUND: 'No se encontró la deuda.',
  DEBT_FROZEN: 'Esta deuda está congelada y no acepta pagos.',
};

function extractErrorCode(err: unknown): string | null {
  if (err && typeof err === 'object') {
    const data = (err as { data?: { code?: string } }).data;
    if (data?.code) return data.code;
  }
  return null;
}

async function handleSubmit() {
  if (!amount.value || amount.value <= 0) return;

  submitting.value = true;
  submitError.value = '';

  try {
    await paymentStore.recordPayment(debtId, amount.value, paidAt.value, idempotencyKey);

    if (paymentStore.lastMilestones.length > 0) {
      showMilestones.value = true;
    } else {
      await navigateTo(`/debts/${debtId}`);
    }
  } catch (err: unknown) {
    const code = extractErrorCode(err);
    submitError.value = code && ERROR_MESSAGES[code]
      ? ERROR_MESSAGES[code]
      : 'Error al registrar el pago. Por favor intenta nuevamente.';
  } finally {
    submitting.value = false;
  }
}

async function handleMilestoneClose() {
  showMilestones.value = false;
  await navigateTo(`/debts/${debtId}`);
}
</script>
