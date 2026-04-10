<template>
  <div class="max-w-xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Nueva Deuda</h1>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Debt type -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Tipo de deuda</label>
        <select
          v-model="form.debtType"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>Selecciona un tipo</option>
          <option value="credit_card">Tarjeta de Crédito</option>
          <option value="consumer_loan">Crédito de Consumo</option>
          <option value="mortgage">Hipotecario</option>
          <option value="informal_lender">Deuda Informal</option>
        </select>
      </div>

      <!-- Label -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Nombre / etiqueta</label>
        <input
          v-model="form.label"
          type="text"
          required
          maxlength="100"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Tarjeta Banco Chile"
        />
      </div>

      <!-- Lender name -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Acreedor / entidad</label>
        <input
          v-model="form.lenderName"
          type="text"
          required
          maxlength="100"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Banco Chile"
        />
      </div>

      <!-- Balance -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Monto de la deuda (CLP)</label>
        <input
          v-model.number="form.balance"
          type="number"
          required
          min="1"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>

      <!-- Monthly interest rate -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Tasa de interés mensual (%)</label>
        <input
          v-model.number="form.monthlyInterestRate"
          type="number"
          required
          min="0"
          max="99.9999"
          step="0.01"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0.00"
        />
      </div>

      <!-- Minimum payment -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Cuota mínima (CLP)</label>
        <input
          v-model.number="form.minimumPayment"
          type="number"
          required
          min="1"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>

      <!-- Payment due day -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Día de vencimiento del pago</label>
        <input
          v-model.number="form.paymentDueDay"
          type="number"
          required
          min="1"
          max="31"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="1–31"
        />
      </div>

      <!-- Cutoff day (credit card only) -->
      <div v-if="form.debtType === 'credit_card'">
        <label class="block text-sm font-medium text-gray-700">Día de corte</label>
        <input
          v-model.number="form.cutoffDay"
          type="number"
          min="1"
          max="31"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="1–31"
        />
      </div>

      <!-- Informal lender extras -->
      <div v-if="form.debtType === 'informal_lender'" class="space-y-4">
        <div class="flex items-center gap-3">
          <input
            id="hasInterest"
            v-model="form.hasInterest"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600"
          />
          <label for="hasInterest" class="text-sm font-medium text-gray-700">¿Cobra intereses?</label>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Urgencia</label>
          <select
            v-model="form.urgency"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Sin especificar</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>

      <!-- Shared checkbox -->
      <div class="flex items-center gap-3">
        <input
          id="isShared"
          v-model="form.isShared"
          type="checkbox"
          class="rounded border-gray-300 text-blue-600"
        />
        <label for="isShared" class="text-sm font-medium text-gray-700">Deuda compartida (visible para todos los miembros)</label>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex gap-3 pt-2">
        <NuxtLink
          to="/debts"
          class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-center"
        >
          Cancelar
        </NuxtLink>
        <button
          type="submit"
          :disabled="loading"
          class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Guardando...' : 'Crear deuda' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useDebtStore } from '~/stores/debt';
import type { DebtType, DebtUrgency } from '~/stores/debt';

const debtStore = useDebtStore();
const loading = computed(() => debtStore.loading);
const error = ref('');

const form = reactive({
  debtType: '' as DebtType | '',
  label: '',
  lenderName: '',
  balance: 0,
  monthlyInterestRate: 0,
  minimumPayment: 0,
  paymentDueDay: 1,
  cutoffDay: undefined as number | undefined,
  isShared: false,
  hasInterest: false,
  urgency: '' as DebtUrgency | '',
});

async function handleSubmit() {
  if (!form.debtType) return;
  error.value = '';
  try {
    await debtStore.createDebt({
      label: form.label,
      debtType: form.debtType,
      lenderName: form.lenderName,
      balance: form.balance,
      monthlyInterestRate: form.monthlyInterestRate,
      minimumPayment: form.minimumPayment,
      paymentDueDay: form.paymentDueDay,
      cutoffDay: form.debtType === 'credit_card' ? form.cutoffDay : undefined,
      isShared: form.isShared,
      metadata:
        form.debtType === 'informal_lender'
          ? {
              hasInterest: form.hasInterest,
              urgency: form.urgency || undefined,
            }
          : undefined,
    });
    navigateTo('/debts');
  } catch {
    error.value = 'Error al crear la deuda. Verifica los datos e intenta de nuevo.';
  }
}
</script>
