<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { api } = useApi()
const loading = ref(true)
const generating = ref(false)
const error = ref('')
const showGenerator = ref(false)

// Active plan
const hasPlan = ref(false)
const plan = ref<any>(null)
const currentMonthActions = ref<any[]>([])

// Generator form
const strategy = ref('avalanche')
const reservePercentage = ref(20)
const customReserve = ref<number | null>(null)

const strategies = [
  { value: 'avalanche', label: 'Avalancha', desc: 'Prioriza las deudas con mayor tasa de interés. Minimiza el costo total.' },
  { value: 'snowball', label: 'Bola de nieve', desc: 'Prioriza las deudas más pequeñas. Genera motivación con victorias rápidas.' },
  { value: 'hybrid', label: 'Híbrida', desc: 'Equilibra costo e impacto psicológico. Combina avalancha y bola de nieve.' },
  { value: 'crisis_first', label: 'Primero el fuego', desc: 'Ataca las deudas críticas primero (próximas a vencer o en mora).' },
  { value: 'guided_consolidation', label: 'Consolidación guiada', desc: 'Analiza opciones de consolidar deudas en una sola cuota menor.' },
]

const effectiveReserve = computed(() =>
  reservePercentage.value === -1 ? (customReserve.value ?? 0) : reservePercentage.value
)

async function loadPlan() {
  loading.value = true
  try {
    const res = await api<{ hasPlan: boolean; plan: any }>('/api/plan/active')
    hasPlan.value = res.hasPlan
    plan.value = res.plan
    currentMonthActions.value = res.plan?.currentMonthActions ?? []
  } catch { /* empty */ }
  loading.value = false
}

async function generatePlan() {
  error.value = ''
  generating.value = true
  try {
    const res = await api<{ plan: any; aiGenerated: boolean }>('/api/plan/generate', {
      method: 'POST',
      body: {
        strategy: strategy.value,
        reservePercentage: effectiveReserve.value,
      },
    })
    plan.value = res.plan
    hasPlan.value = true
    showGenerator.value = false
    await loadPlan()
  } catch (e: any) {
    const data = e.data
    if (data?.code === 'PROFILE_INCOMPLETE') {
      error.value = 'Completa tu perfil financiero antes de generar un plan.'
    } else if (data?.code === 'NO_ACTIVE_DEBTS') {
      error.value = 'No tienes deudas activas. Registra al menos una deuda.'
    } else if (data?.code === 'INSUFFICIENT_BUDGET') {
      error.value = 'Tu presupuesto disponible no alcanza para cubrir los pagos mínimos.'
    } else if (data?.code === 'NO_SURPLUS') {
      error.value = 'Tus gastos fijos consumen todo tu ingreso.'
    } else {
      error.value = data?.message ?? e.message ?? 'Error al generar plan'
    }
  } finally {
    generating.value = false
  }
}

async function retryAi() {
  if (!plan.value?.id) return
  try {
    const res = await api<{ aiOutput: any }>(`/api/plan/${plan.value.id}/retry-ai`, { method: 'POST' })
    plan.value.aiOutput = res.aiOutput
  } catch { /* empty */ }
}

function formatCLP(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$' + Math.round(Number(n)).toLocaleString('es-CL')
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })
}

const strategyLabels: Record<string, string> = {
  avalanche: 'Avalancha',
  snowball: 'Bola de nieve',
  hybrid: 'Híbrida',
  crisis_first: 'Primero el fuego',
  guided_consolidation: 'Consolidación guiada',
}

const debtTypeLabels: Record<string, string> = {
  credit_card: 'Tarjeta',
  consumer_loan: 'Consumo',
  mortgage: 'Hipotecario',
  informal_lender: 'Informal',
}

// Group plan actions by monthOffset
const actionsByMonth = computed(() => {
  if (!plan.value?.planActions) return []
  const grouped: Record<number, any[]> = {}
  for (const a of plan.value.planActions) {
    if (!grouped[a.monthOffset]) grouped[a.monthOffset] = []
    grouped[a.monthOffset].push(a)
  }
  return Object.entries(grouped)
    .map(([month, actions]) => ({ month: Number(month), actions }))
    .sort((a, b) => a.month - b.month)
})

// Interest savings
const interestSaved = computed(() => {
  if (!plan.value) return 0
  return Number(plan.value.totalInterestNoPlan) - Number(plan.value.totalInterestProjected)
})

onMounted(loadPlan)
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Plan de pagos</h1>
        <p class="mt-1 text-sm text-gray-500">Genera y visualiza tu plan de pagos personalizado.</p>
      </div>
      <button
        @click="showGenerator = !showGenerator"
        class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        {{ hasPlan ? 'Nuevo plan' : 'Generar plan' }}
      </button>
    </div>

    <!-- Generator -->
    <div v-if="showGenerator" class="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Generar plan de pagos</h2>

      <!-- Strategy selector -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700">Estrategia</label>
        <div class="space-y-2">
          <button
            v-for="s in strategies"
            :key="s.value"
            @click="strategy = s.value"
            :class="[
              'w-full text-left rounded-lg border p-4 transition-colors',
              strategy === s.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:bg-gray-50'
            ]"
          >
            <p :class="['text-sm font-medium', strategy === s.value ? 'text-primary-700' : 'text-gray-900']">
              {{ s.label }}
            </p>
            <p class="text-xs text-gray-500 mt-0.5">{{ s.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Reserve percentage -->
      <div class="mt-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Reserva de emergencia</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="pct in [10, 20, 30]"
            :key="pct"
            @click="reservePercentage = pct"
            :class="[
              'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
              reservePercentage === pct
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ pct }}%
          </button>
          <button
            @click="reservePercentage = -1"
            :class="[
              'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
              reservePercentage === -1
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            ]"
          >
            Otro
          </button>
        </div>
        <div v-if="reservePercentage === -1" class="mt-2">
          <input
            v-model.number="customReserve"
            type="number"
            min="0"
            max="50"
            placeholder="15"
            class="block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <p v-if="error" class="mt-4 text-sm text-danger-500">{{ error }}</p>

      <button
        @click="generatePlan"
        :disabled="generating"
        class="mt-6 rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {{ generating ? 'Generando plan...' : 'Generar plan' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mt-8 text-center text-sm text-gray-400">Cargando...</div>

    <!-- No plan -->
    <div v-else-if="!hasPlan && !showGenerator" class="mt-8 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">Aún no tienes un plan de pagos.</p>
      <button
        @click="showGenerator = true"
        class="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Crear mi primer plan
      </button>
    </div>

    <!-- Active plan -->
    <div v-else-if="plan" class="mt-6 space-y-6">
      <!-- Plan summary cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <p class="text-xs text-gray-500">Estrategia</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ strategyLabels[plan.strategy] ?? plan.strategy }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <p class="text-xs text-gray-500">Presupuesto mensual</p>
          <p class="mt-1 text-lg font-bold text-primary-600">{{ formatCLP(plan.monthlyBudget) }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <p class="text-xs text-gray-500">Libre de deudas</p>
          <p class="mt-1 text-sm font-semibold text-gray-900">{{ formatDate(plan.estimatedPayoffDate) }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <p class="text-xs text-gray-500">Ahorro en intereses</p>
          <p class="mt-1 text-lg font-bold text-green-600">{{ formatCLP(interestSaved) }}</p>
        </div>
      </div>

      <!-- AI Output -->
      <div v-if="plan.aiOutput" class="rounded-lg border border-primary-200 bg-primary-50 p-5 space-y-4">
        <h3 class="text-sm font-semibold text-primary-800">Diagnóstico IA</h3>
        <p class="text-sm text-gray-700">{{ plan.aiOutput.summary }}</p>

        <div v-if="plan.aiOutput.strategy_rationale">
          <p class="text-xs font-medium text-gray-500 uppercase">Por qué esta estrategia</p>
          <p class="text-sm text-gray-700 mt-1">{{ plan.aiOutput.strategy_rationale }}</p>
        </div>

        <div v-if="plan.aiOutput.monthly_focus">
          <p class="text-xs font-medium text-gray-500 uppercase">Foco este mes</p>
          <p class="text-sm text-gray-700 mt-1">{{ plan.aiOutput.monthly_focus }}</p>
        </div>

        <div v-if="plan.aiOutput.critical_alerts?.length" class="space-y-1">
          <p class="text-xs font-medium text-danger-600 uppercase">Alertas</p>
          <p v-for="(alert, i) in plan.aiOutput.critical_alerts" :key="i" class="text-sm text-danger-600">
            {{ alert }}
          </p>
        </div>

        <div v-if="plan.aiOutput.key_milestones?.length">
          <p class="text-xs font-medium text-gray-500 uppercase">Hitos clave</p>
          <div class="mt-1 space-y-1">
            <div v-for="(m, i) in plan.aiOutput.key_milestones" :key="i" class="flex items-baseline gap-2 text-sm">
              <span class="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-700">Mes {{ m.month }}</span>
              <span class="text-gray-700">{{ m.message }}</span>
            </div>
          </div>
        </div>

        <div v-if="plan.aiOutput.free_date_message" class="rounded-md bg-green-50 border border-green-200 p-3">
          <p class="text-sm font-medium text-green-700">{{ plan.aiOutput.free_date_message }}</p>
        </div>
      </div>

      <!-- Retry AI button if no AI output -->
      <div v-else class="rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
        <p class="text-sm text-gray-500">El diagnóstico IA no se generó. Puedes reintentarlo.</p>
        <button @click="retryAi" class="text-sm text-primary-600 hover:underline">Reintentar</button>
      </div>

      <!-- Current month actions -->
      <div v-if="currentMonthActions.length">
        <h3 class="text-lg font-semibold text-gray-900">Pagos de este mes</h3>
        <div class="mt-3 space-y-2">
          <div
            v-for="a in currentMonthActions"
            :key="a.id"
            class="flex items-center justify-between rounded-lg border border-primary-200 bg-white p-4"
          >
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ a.debtLabel }}
                <span class="ml-1 text-xs text-gray-400">({{ debtTypeLabels[a.debtType] ?? a.debtType }})</span>
              </p>
              <p class="text-xs text-gray-500">
                Capital: {{ formatCLP(a.principalAmount) }} · Interés: {{ formatCLP(a.interestAmount) }}
              </p>
            </div>
            <p class="text-lg font-bold text-primary-600">{{ formatCLP(a.paymentAmount) }}</p>
          </div>
        </div>
      </div>

      <!-- Full timeline -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Línea de tiempo</h3>
        <div class="mt-3 space-y-4">
          <div v-for="group in actionsByMonth" :key="group.month">
            <p class="text-sm font-medium text-gray-500 mb-2">Mes {{ group.month }}</p>
            <div class="space-y-1">
              <div
                v-for="a in group.actions"
                :key="a.id"
                class="flex items-center justify-between rounded border border-gray-100 bg-white px-3 py-2 text-sm"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 w-5 text-right">#{{ a.debtOrder }}</span>
                  <span class="text-gray-900">{{ a.debtLabel ?? 'Deuda' }}</span>
                  <span class="text-xs text-gray-400">({{ debtTypeLabels[a.debtType] ?? '' }})</span>
                </div>
                <div class="flex items-center gap-4 text-right">
                  <span class="text-gray-500 text-xs">Saldo después: {{ formatCLP(a.remainingBalanceAfter) }}</span>
                  <span class="font-medium text-gray-900">{{ formatCLP(a.paymentAmount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
