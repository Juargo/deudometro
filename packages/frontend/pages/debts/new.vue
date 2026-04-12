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

        <!-- Tooltip info per debt type -->
        <div v-if="debtTypeInfo" class="mt-2 flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          <svg class="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
          <div>
            <p class="font-medium">{{ debtTypeInfo.title }}</p>
            <ul class="mt-1 list-disc list-inside space-y-0.5 text-blue-700">
              <li v-for="item in debtTypeInfo.items" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
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
        <div class="relative mt-1">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">$</span>
          <input
            :value="formatInputCLP(form.balance)"
            type="text"
            inputmode="numeric"
            required
            class="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
            @input="form.balance = parseInputCLP($event)"
          />
        </div>
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
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0.00"
        />
      </div>

      <!-- Minimum payment -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Cuota mínima (CLP)</label>
        <div class="relative mt-1">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">$</span>
          <input
            :value="formatInputCLP(form.minimumPayment)"
            type="text"
            inputmode="numeric"
            required
            class="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
            @input="form.minimumPayment = parseInputCLP($event)"
          />
        </div>
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

const clpFormatter = new Intl.NumberFormat('es-CL');

function formatInputCLP(value: number): string {
  if (!value) return '';
  return clpFormatter.format(value);
}

function parseInputCLP(event: Event): number {
  const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '');
  return parseInt(raw, 10) || 0;
}

const debtTypeInfoMap: Record<string, { title: string; items: string[] }> = {
  credit_card: {
    title: 'Tarjeta de Credito',
    items: [
      'Monto de la deuda: saldo utilizado actual de la tarjeta',
      'Tasa de interes: tasa mensual que cobra tu banco (rotativa)',
      'Cuota minima: pago minimo que aparece en tu estado de cuenta',
      'Dia de corte: dia del mes en que se cierra tu periodo de facturacion',
    ],
  },
  consumer_loan: {
    title: 'Credito de Consumo',
    items: [
      'Monto de la deuda: saldo pendiente del credito (no el monto original)',
      'Tasa de interes: tasa mensual del credito (revisa tu contrato o cartola)',
      'Cuota minima: valor de la cuota fija mensual',
    ],
  },
  mortgage: {
    title: 'Credito Hipotecario',
    items: [
      'Monto de la deuda: saldo insoluto (capital pendiente)',
      'Tasa de interes: tasa mensual (la tasa anual dividida por 12)',
      'Cuota minima: dividendo mensual que pagas',
    ],
  },
};

const debtTypeInfo = computed(() => {
  if (!form.debtType || !(form.debtType in debtTypeInfoMap)) return null;
  return debtTypeInfoMap[form.debtType];
});

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
