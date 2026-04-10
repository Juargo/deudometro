<template>
  <div class="max-w-xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Editar Deuda</h1>

    <div v-if="fetchLoading" class="text-sm text-gray-400">Cargando deuda...</div>
    <p v-else-if="fetchError" class="text-sm text-red-600">{{ fetchError }}</p>

    <form v-else class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Original balance (read-only) -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Monto original (CLP)</label>
        <input
          :value="formatCLP(debt?.originalBalance ?? 0)"
          type="text"
          disabled
          class="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 cursor-not-allowed"
        />
      </div>

      <!-- Label -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Nombre / etiqueta</label>
        <input
          v-model="form.label"
          type="text"
          maxlength="100"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Lender name -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Acreedor / entidad</label>
        <input
          v-model="form.lenderName"
          type="text"
          maxlength="100"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Remaining balance -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Saldo restante (CLP)</label>
        <input
          v-model.number="form.remainingBalance"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Monthly interest rate -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Tasa de interés mensual (%)</label>
        <input
          v-model.number="form.monthlyInterestRate"
          type="number"
          min="0"
          max="99.9999"
          step="0.01"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Minimum payment -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Cuota mínima (CLP)</label>
        <input
          v-model.number="form.minimumPayment"
          type="number"
          min="1"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Payment due day -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Día de vencimiento del pago</label>
        <input
          v-model.number="form.paymentDueDay"
          type="number"
          min="1"
          max="31"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Cutoff day -->
      <div v-if="debt?.debtType === 'credit_card'">
        <label class="block text-sm font-medium text-gray-700">Día de corte</label>
        <input
          v-model.number="form.cutoffDay"
          type="number"
          min="1"
          max="31"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex gap-3 pt-2">
        <NuxtLink
          :to="`/debts/${debtId}`"
          class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-center"
        >
          Cancelar
        </NuxtLink>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useDebt } from '~/composables/useDebt';
import type { DebtDTO } from '~/stores/debt';

const route = useRoute();
const debtId = route.params.id as string;

const { getDebt, updateDebt } = useDebt();

const debt = ref<DebtDTO | null>(null);
const fetchLoading = ref(true);
const fetchError = ref('');
const saving = ref(false);
const error = ref('');

const form = reactive({
  label: '',
  lenderName: '',
  remainingBalance: 0,
  monthlyInterestRate: 0,
  minimumPayment: 0,
  paymentDueDay: 1,
  cutoffDay: undefined as number | undefined,
});

function formatCLP(amount: number | string): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount));
}

onMounted(async () => {
  try {
    debt.value = await getDebt(debtId);
    form.label = debt.value.label;
    form.lenderName = debt.value.lenderName;
    form.remainingBalance = Number(debt.value.remainingBalance);
    form.monthlyInterestRate = Number(debt.value.monthlyInterestRate);
    form.minimumPayment = Number(debt.value.minimumPayment);
    form.paymentDueDay = debt.value.paymentDueDay;
    form.cutoffDay = debt.value.cutoffDay ?? undefined;
  } catch {
    fetchError.value = 'Error al cargar la deuda.';
  } finally {
    fetchLoading.value = false;
  }
});

async function handleSubmit() {
  error.value = '';
  saving.value = true;
  try {
    await updateDebt(debtId, {
      label: form.label,
      lenderName: form.lenderName,
      remainingBalance: form.remainingBalance,
      monthlyInterestRate: form.monthlyInterestRate,
      minimumPayment: form.minimumPayment,
      paymentDueDay: form.paymentDueDay,
      cutoffDay: debt.value?.debtType === 'credit_card' ? form.cutoffDay : undefined,
    });
    navigateTo(`/debts/${debtId}`);
  } catch {
    error.value = 'Error al guardar los cambios. Intenta de nuevo.';
  } finally {
    saving.value = false;
  }
}
</script>
