<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' })

const { api } = useApi()
const router = useRouter()
const step = ref(1)
const error = ref('')
const saving = ref(false)

// Step 1: Name + Income
const displayName = ref('')
const monthlyIncome = ref<number | null>(null)

// Step 2: Fixed expenses
const fixedExpenses = reactive({
  rent: 0,
  utilities: 0,
  food: 0,
  transport: 0,
  other: 0,
})

// Step 3: Reserve percentage
const reservePercentage = ref(20)
const customReserve = ref<number | null>(null)

const totalFixedCosts = computed(() =>
  fixedExpenses.rent + fixedExpenses.utilities + fixedExpenses.food + fixedExpenses.transport + fixedExpenses.other
)

const grossSurplus = computed(() => (monthlyIncome.value ?? 0) - totalFixedCosts.value)

const effectiveReserve = computed(() =>
  reservePercentage.value === -1 ? (customReserve.value ?? 0) : reservePercentage.value
)

const availableBudget = computed(() =>
  Math.max(0, grossSurplus.value * (1 - effectiveReserve.value / 100))
)

function nextStep() {
  error.value = ''
  if (step.value === 1) {
    if (!displayName.value.trim()) { error.value = 'Ingresa tu nombre'; return }
    if (!monthlyIncome.value || monthlyIncome.value <= 0) { error.value = 'Ingresa tu ingreso mensual'; return }
  }
  if (step.value === 2) {
    if (totalFixedCosts.value >= (monthlyIncome.value ?? 0)) {
      error.value = 'Tus gastos fijos superan tu ingreso. Revisa los montos.'
      return
    }
  }
  step.value++
}

function prevStep() {
  error.value = ''
  step.value--
}

async function submit() {
  error.value = ''
  saving.value = true
  try {
    await api('/api/profile', {
      method: 'POST',
      body: {
        displayName: displayName.value.trim(),
        monthlyIncome: monthlyIncome.value,
        fixedExpenses: { ...fixedExpenses },
      },
    })
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.data?.message ?? e.message ?? 'Error al guardar perfil'
  } finally {
    saving.value = false
  }
}

function formatCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <h1 class="text-2xl font-bold text-gray-900 text-center">Configura tu perfil</h1>

      <!-- Progress -->
      <div class="flex items-center gap-2 mt-4 mb-8 justify-center">
        <div
          v-for="s in 3"
          :key="s"
          :class="[
            'h-2 w-12 rounded-full transition-colors',
            s <= step ? 'bg-primary-500' : 'bg-gray-200'
          ]"
        />
      </div>

      <!-- Step 1: Name + Income -->
      <div v-if="step === 1" class="space-y-4">
        <p class="text-sm text-gray-600">Empecemos con lo básico.</p>
        <div>
          <label class="block text-sm font-medium text-gray-700">Tu nombre</label>
          <input
            v-model="displayName"
            type="text"
            placeholder="Jorge"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Ingreso líquido mensual</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-2 text-sm text-gray-400">$</span>
            <input
              v-model.number="monthlyIncome"
              type="number"
              min="1"
              placeholder="1.200.000"
              class="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <p class="mt-1 text-xs text-gray-400">Lo que recibes después de impuestos y descuentos.</p>
        </div>
      </div>

      <!-- Step 2: Fixed Expenses -->
      <div v-if="step === 2" class="space-y-4">
        <p class="text-sm text-gray-600">¿Cuánto gastas al mes en cada categoría?</p>

        <div v-for="(label, key) in { rent: 'Arriendo / dividendo', utilities: 'Servicios (agua, luz, gas)', food: 'Alimentación', transport: 'Transporte', other: 'Otros gastos fijos' }" :key="key">
          <label class="block text-sm font-medium text-gray-700">{{ label }}</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-2 text-sm text-gray-400">$</span>
            <input
              v-model.number="fixedExpenses[key as keyof typeof fixedExpenses]"
              type="number"
              min="0"
              class="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div class="rounded-md bg-gray-100 p-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Total gastos fijos</span>
            <span class="font-medium text-gray-900">{{ formatCLP(totalFixedCosts) }}</span>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-gray-500">Excedente bruto</span>
            <span :class="grossSurplus > 0 ? 'text-green-600' : 'text-danger-500'" class="font-medium">
              {{ formatCLP(grossSurplus) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Step 3: Reserve Percentage -->
      <div v-if="step === 3" class="space-y-4">
        <p class="text-sm text-gray-600">
          ¿Qué porcentaje de tu excedente quieres reservar para emergencias?
        </p>

        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="pct in [10, 20, 30]"
            :key="pct"
            @click="reservePercentage = pct"
            :class="[
              'rounded-md border px-4 py-3 text-sm font-medium transition-colors',
              reservePercentage === pct
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ pct }}%
          </button>
          <button
            @click="reservePercentage = -1"
            :class="[
              'rounded-md border px-4 py-3 text-sm font-medium transition-colors',
              reservePercentage === -1
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            Personalizado
          </button>
        </div>

        <div v-if="reservePercentage === -1">
          <label class="block text-sm font-medium text-gray-700">Porcentaje personalizado</label>
          <div class="relative mt-1">
            <input
              v-model.number="customReserve"
              type="number"
              min="0"
              max="50"
              class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <span class="absolute right-3 top-2 text-sm text-gray-400">%</span>
          </div>
        </div>

        <div class="rounded-md bg-primary-50 border border-primary-200 p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Excedente bruto</span>
            <span class="font-medium">{{ formatCLP(grossSurplus) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Reserva ({{ effectiveReserve }}%)</span>
            <span class="font-medium text-gray-500">-{{ formatCLP(grossSurplus * effectiveReserve / 100) }}</span>
          </div>
          <hr class="border-primary-200" />
          <div class="flex justify-between text-sm">
            <span class="font-medium text-primary-700">Presupuesto para deudas</span>
            <span class="font-bold text-primary-700 text-lg">{{ formatCLP(availableBudget) }}</span>
          </div>
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="mt-4 text-sm text-danger-500">{{ error }}</p>

      <!-- Navigation -->
      <div class="flex gap-3 mt-6">
        <button
          v-if="step > 1"
          @click="prevStep"
          class="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Atrás
        </button>
        <button
          v-if="step < 3"
          @click="nextStep"
          class="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Siguiente
        </button>
        <button
          v-if="step === 3"
          @click="submit"
          :disabled="saving"
          class="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {{ saving ? 'Guardando...' : 'Comenzar' }}
        </button>
      </div>
    </div>
  </div>
</template>
