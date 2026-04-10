<template>
  <div class="max-w-xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Configurar perfil financiero</h1>

    <!-- Step indicators -->
    <div class="flex gap-2 mb-8">
      <div
        v-for="s in 5"
        :key="s"
        class="h-1.5 flex-1 rounded-full transition-colors"
        :class="s <= step ? 'bg-blue-600' : 'bg-gray-200'"
      />
    </div>

    <!-- Step 1: Income -->
    <div v-if="step === 1" class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Paso 1: Ingreso mensual</h2>
      <div>
        <label class="block text-sm font-medium text-gray-700">Ingreso mensual (CLP)</label>
        <input
          v-model.number="form.monthlyIncome"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
        <p class="mt-1 text-xs text-gray-500">Ingresa 0 si usarás capital disponible en lugar de ingresos.</p>
      </div>
    </div>

    <!-- Step 2: Capital -->
    <div v-else-if="step === 2" class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Paso 2: Capital disponible</h2>
      <div>
        <label class="block text-sm font-medium text-gray-700">Capital disponible (CLP)</label>
        <input
          v-model.number="form.availableCapital"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>
      <div v-if="form.monthlyIncome === 0">
        <label class="block text-sm font-medium text-gray-700">Asignación mensual desde capital (CLP)</label>
        <input
          v-model.number="form.monthlyAllocation"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
        <p class="mt-1 text-xs text-gray-500">Monto mensual que destinarás desde tu capital para cubrir gastos y deudas.</p>
      </div>
    </div>

    <!-- Step 3: Expenses -->
    <div v-else-if="step === 3" class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Paso 3: Gastos fijos mensuales</h2>
      <div>
        <label class="block text-sm font-medium text-gray-700">Arriendo / Hipoteca (CLP)</label>
        <input
          v-model.number="form.fixedExpenses.rent"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Servicios básicos (CLP)</label>
        <input
          v-model.number="form.fixedExpenses.utilities"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Alimentación (CLP)</label>
        <input
          v-model.number="form.fixedExpenses.food"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Transporte (CLP)</label>
        <input
          v-model.number="form.fixedExpenses.transport"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Otros gastos fijos (CLP)</label>
        <input
          v-model.number="form.fixedExpenses.other"
          type="number"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
      </div>
      <div class="pt-2 border-t border-gray-200">
        <p class="text-sm font-medium text-gray-700">
          Total gastos fijos:
          <span class="font-bold text-gray-900">{{ formatCLP(totalExpenses) }}</span>
        </p>
      </div>
    </div>

    <!-- Step 4: Reserve -->
    <div v-else-if="step === 4" class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Paso 4: Porcentaje de reserva</h2>
      <p class="text-sm text-gray-500">Define qué porcentaje de tu ingreso neto reservarás como fondo de emergencia.</p>
      <div class="space-y-2">
        <label
          v-for="option in [10, 20, 30]"
          :key="option"
          class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
          :class="form.reservePercentage === option && !useCustomReserve ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
        >
          <input
            v-model="form.reservePercentage"
            type="radio"
            :value="option"
            class="text-blue-600"
            @change="useCustomReserve = false"
          />
          <span class="text-sm font-medium text-gray-700">{{ option }}%</span>
        </label>
        <label
          class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
          :class="useCustomReserve ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
        >
          <input
            v-model="useCustomReserve"
            type="radio"
            :value="true"
            class="text-blue-600"
          />
          <span class="text-sm font-medium text-gray-700">Personalizado</span>
        </label>
      </div>
      <div v-if="useCustomReserve">
        <label class="block text-sm font-medium text-gray-700">Porcentaje de reserva (0–50%)</label>
        <input
          v-model.number="form.reservePercentage"
          type="number"
          min="0"
          max="50"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Step 5: Summary -->
    <div v-else-if="step === 5" class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Paso 5: Resumen de tu presupuesto</h2>
      <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div class="flex justify-between px-4 py-3 text-sm">
          <span class="text-gray-500">Fuente de ingresos</span>
          <span class="font-medium text-gray-900">{{ incomeSource === 'salary' ? 'Salario' : 'Capital' }}</span>
        </div>
        <div class="flex justify-between px-4 py-3 text-sm">
          <span class="text-gray-500">Ingreso efectivo</span>
          <span class="font-medium text-gray-900">{{ formatCLP(effectiveIncome) }}</span>
        </div>
        <div class="flex justify-between px-4 py-3 text-sm">
          <span class="text-gray-500">Gastos fijos totales</span>
          <span class="font-medium text-red-600">- {{ formatCLP(totalFixedCosts) }}</span>
        </div>
        <div class="flex justify-between px-4 py-3 text-sm">
          <span class="text-gray-500">Neto tras gastos</span>
          <span class="font-medium text-gray-900">{{ formatCLP(netAfterExpenses) }}</span>
        </div>
        <div class="flex justify-between px-4 py-3 text-sm">
          <span class="text-gray-500">Reserva ({{ form.reservePercentage }}%)</span>
          <span class="font-medium text-yellow-600">- {{ formatCLP(reserveAmount) }}</span>
        </div>
        <div class="flex justify-between px-4 py-3 text-sm bg-green-50">
          <span class="font-semibold text-gray-700">Presupuesto disponible</span>
          <span class="font-bold text-green-700">{{ formatCLP(availableBudget) }}</span>
        </div>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Navigation -->
    <div class="mt-8 flex justify-between">
      <button
        v-if="step > 1"
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        @click="step--"
      >
        Anterior
      </button>
      <div v-else />

      <button
        v-if="step < 5"
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        @click="step++"
      >
        Siguiente
      </button>
      <button
        v-else
        type="button"
        :disabled="saving"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        @click="handleSave"
      >
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProfile } from '~/composables/useProfile';
import { useBudgetCalculator } from '~/composables/useBudgetCalculator';

const { updateFinancial } = useProfile();

const step = ref(1);
const saving = ref(false);
const error = ref('');
const useCustomReserve = ref(false);

const form = reactive({
  monthlyIncome: 0,
  availableCapital: 0,
  monthlyAllocation: 0,
  fixedExpenses: {
    rent: 0,
    utilities: 0,
    food: 0,
    transport: 0,
    other: 0,
  },
  reservePercentage: 10,
});

const totalExpenses = computed(() => {
  return (
    form.fixedExpenses.rent +
    form.fixedExpenses.utilities +
    form.fixedExpenses.food +
    form.fixedExpenses.transport +
    form.fixedExpenses.other
  );
});

const monthlyIncomeRef = computed(() => form.monthlyIncome);
const availableCapitalRef = computed(() => form.availableCapital);
const monthlyAllocationRef = computed(() => form.monthlyAllocation);
const fixedExpensesRef = computed(() => form.fixedExpenses);
const reservePercentageRef = computed(() => form.reservePercentage);

const { effectiveIncome, incomeSource, totalFixedCosts, netAfterExpenses, reserveAmount, availableBudget } =
  useBudgetCalculator({
    monthlyIncome: monthlyIncomeRef,
    availableCapital: availableCapitalRef,
    monthlyAllocation: monthlyAllocationRef,
    fixedExpenses: fixedExpensesRef,
    reservePercentage: reservePercentageRef,
  });

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
}

async function handleSave() {
  error.value = '';
  saving.value = true;
  try {
    await updateFinancial({
      monthlyIncome: form.monthlyIncome,
      availableCapital: form.availableCapital,
      monthlyAllocation: form.monthlyAllocation,
      fixedExpenses: form.fixedExpenses,
      reservePercentage: form.reservePercentage,
    });
    navigateTo('/dashboard');
  } catch {
    error.value = 'Error al guardar el perfil. Intenta de nuevo.';
  } finally {
    saving.value = false;
  }
}
</script>
