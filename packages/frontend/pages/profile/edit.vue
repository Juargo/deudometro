<template>
  <div class="max-w-xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Editar perfil</h1>
      <NuxtLink
        to="/dashboard"
        class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Cancelar
      </NuxtLink>
    </div>

    <div v-if="loadingProfile" class="text-sm text-gray-400">Cargando perfil...</div>
    <p v-else-if="fetchError" class="text-sm text-red-600">{{ fetchError }}</p>

    <form v-else class="space-y-6" @submit.prevent="handleSave">
      <!-- Display name -->
      <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Información personal</h2>
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tu nombre"
          />
        </div>
      </div>

      <!-- Income & capital -->
      <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ingresos y capital</h2>
        <div>
          <label for="monthlyIncome" class="block text-sm font-medium text-gray-700">Ingreso mensual (CLP)</label>
          <input
            id="monthlyIncome"
            v-model.number="form.monthlyIncome"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
          <p class="mt-1 text-xs text-gray-500">Ingresa 0 si usarás capital disponible en lugar de ingresos.</p>
        </div>
        <div>
          <label for="availableCapital" class="block text-sm font-medium text-gray-700">Capital disponible (CLP)</label>
          <input
            id="availableCapital"
            v-model.number="form.availableCapital"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div v-if="form.monthlyIncome === 0">
          <label for="monthlyAllocation" class="block text-sm font-medium text-gray-700">Asignación mensual desde capital (CLP)</label>
          <input
            id="monthlyAllocation"
            v-model.number="form.monthlyAllocation"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
          <p class="mt-1 text-xs text-gray-500">Monto mensual que destinarás desde tu capital.</p>
        </div>
      </div>

      <!-- Fixed expenses -->
      <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Gastos fijos mensuales</h2>
        <div>
          <label for="rent" class="block text-sm font-medium text-gray-700">Arriendo / Hipoteca (CLP)</label>
          <input
            id="rent"
            v-model.number="form.fixedExpenses.rent"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label for="food" class="block text-sm font-medium text-gray-700">Alimentación (CLP)</label>
          <input
            id="food"
            v-model.number="form.fixedExpenses.food"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label for="transport" class="block text-sm font-medium text-gray-700">Transporte (CLP)</label>
          <input
            id="transport"
            v-model.number="form.fixedExpenses.transport"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label for="utilities" class="block text-sm font-medium text-gray-700">Servicios básicos (CLP)</label>
          <input
            id="utilities"
            v-model.number="form.fixedExpenses.utilities"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label for="other" class="block text-sm font-medium text-gray-700">Otros gastos fijos (CLP)</label>
          <input
            id="other"
            v-model.number="form.fixedExpenses.other"
            type="number"
            min="0"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div class="pt-2 border-t border-gray-100">
          <p class="text-sm text-gray-600">
            Total gastos fijos:
            <span class="font-bold text-gray-900">{{ formatCLP(totalExpenses) }}</span>
          </p>
        </div>
      </div>

      <!-- Reserve percentage -->
      <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Porcentaje de reserva</h2>
        <p class="text-sm text-gray-500">Porcentaje de tu ingreso neto que reservarás como fondo de emergencia.</p>
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

      <!-- Situación laboral y conocimiento de inversiones -->
      <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Perfil financiero</h2>
        <div>
          <label for="employmentStatus" class="block text-sm font-medium text-gray-700">Situación laboral</label>
          <select
            id="employmentStatus"
            v-model="form.employmentStatus"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Sin especificar</option>
            <option value="employed">Empleado</option>
            <option value="independent">Independiente</option>
            <option value="unemployed">Cesante</option>
          </select>
        </div>
        <div>
          <label for="investmentKnowledge" class="block text-sm font-medium text-gray-700">Nivel de inversiones</label>
          <select
            id="investmentKnowledge"
            v-model="form.investmentKnowledge"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Sin especificar</option>
            <option value="high">Alto — Manejo inversiones activamente</option>
            <option value="medium">Medio — Tengo conocimientos pero no invierto</option>
            <option value="low">Bajo — No tengo conocimiento sobre inversiones</option>
          </select>
        </div>
      </div>

      <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
        <NuxtLink
          to="/dashboard"
          class="flex-1 px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useProfile } from '~/composables/useProfile';
import { useCurrency } from '~/composables/useCurrency';
import type { EmploymentStatus, InvestmentKnowledge } from '~/stores/profile';

const { fetchProfile, updateFinancial, profile } = useProfile();
const { formatCLP } = useCurrency();

const loadingProfile = ref(true);
const fetchError = ref('');
const saving = ref(false);
const saveError = ref('');
const useCustomReserve = ref(false);

const form = reactive({
  displayName: '',
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
  employmentStatus: '' as EmploymentStatus | '',
  investmentKnowledge: '' as InvestmentKnowledge | '',
});

const totalExpenses = computed(() =>
  form.fixedExpenses.rent +
  form.fixedExpenses.utilities +
  form.fixedExpenses.food +
  form.fixedExpenses.transport +
  form.fixedExpenses.other
);

onMounted(async () => {
  try {
    await fetchProfile();
    const p = profile.value;
    if (p) {
      form.displayName = p.displayName;
      form.monthlyIncome = p.monthlyIncome;
      form.availableCapital = p.availableCapital;
      form.monthlyAllocation = p.monthlyAllocation;
      form.reservePercentage = p.reservePercentage;
      if (p.fixedExpenses) {
        form.fixedExpenses.rent = p.fixedExpenses.rent;
        form.fixedExpenses.utilities = p.fixedExpenses.utilities;
        form.fixedExpenses.food = p.fixedExpenses.food;
        form.fixedExpenses.transport = p.fixedExpenses.transport;
        form.fixedExpenses.other = p.fixedExpenses.other;
      }
      // Detect if current reservePercentage is a custom value
      if (![10, 20, 30].includes(p.reservePercentage)) {
        useCustomReserve.value = true;
      }
      form.employmentStatus = p.employmentStatus ?? '';
      form.investmentKnowledge = p.investmentKnowledge ?? '';
    }
  } catch {
    fetchError.value = 'Error al cargar el perfil.';
  } finally {
    loadingProfile.value = false;
  }
});

async function handleSave() {
  saveError.value = '';
  saving.value = true;
  try {
    await updateFinancial({
      monthlyIncome: form.monthlyIncome,
      availableCapital: form.availableCapital,
      monthlyAllocation: form.monthlyAllocation,
      fixedExpenses: form.fixedExpenses,
      reservePercentage: form.reservePercentage,
      employmentStatus: form.employmentStatus || null,
      investmentKnowledge: form.investmentKnowledge || null,
    });
    navigateTo('/dashboard');
  } catch {
    saveError.value = 'Error al guardar los cambios. Intenta de nuevo.';
  } finally {
    saving.value = false;
  }
}
</script>
