<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { api } = useApi()
const loading = ref(true)
const debts = ref<any[]>([])
const summary = ref<any>(null)
const showForm = ref(false)
const saving = ref(false)
const error = ref('')

// Form state
const debtType = ref<string>('credit_card')
const form = reactive({
  label: '',
  lenderName: '',
  remainingBalance: null as number | null,
  monthlyInterestRate: null as number | null,
  minimumPayment: null as number | null,
  paymentDueDay: null as number | null,
  cutoffDay: null as number | null,
  // Metadata per type
  creditLimit: null as number | null,
  isActivelyUsed: true,
  totalInstallments: null as number | null,
  remainingInstallments: null as number | null,
  hasInsurance: false,
  insuranceMonthlyAmount: null as number | null,
  allowsEarlyPayment: false,
  isFixedRate: true,
  isDFL2: false,
  hasInterest: null as boolean | null,
  urgencyLevel: 'medium' as string,
  agreedMonthlyPayment: null as number | null,
  agreedTermDescription: '',
})

const debtTypes = [
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'consumer_loan', label: 'Crédito de consumo' },
  { value: 'mortgage', label: 'Crédito hipotecario' },
  { value: 'informal_lender', label: 'Deuda informal' },
]

const debtTypeLabels: Record<string, string> = {
  credit_card: 'Tarjeta de crédito',
  consumer_loan: 'Crédito de consumo',
  mortgage: 'Crédito hipotecario',
  informal_lender: 'Deuda informal',
}

async function loadDebts() {
  loading.value = true
  try {
    const res = await api<{ debts: any[]; summary: any }>('/api/debts', { query: { status: 'active,paid_off,frozen' } })
    debts.value = res.debts
    summary.value = res.summary
  } catch { /* empty */ }
  loading.value = false
}

function buildMetadata(): Record<string, unknown> {
  switch (debtType.value) {
    case 'credit_card':
      return { creditLimit: form.creditLimit ?? 0, isActivelyUsed: form.isActivelyUsed }
    case 'consumer_loan':
      return {
        totalInstallments: form.totalInstallments ?? 0,
        remainingInstallments: form.remainingInstallments ?? 0,
        hasInsurance: form.hasInsurance,
        insuranceMonthlyAmount: form.insuranceMonthlyAmount,
        allowsEarlyPayment: form.allowsEarlyPayment,
      }
    case 'mortgage':
      return {
        remainingInstallments: form.remainingInstallments ?? 0,
        isFixedRate: form.isFixedRate,
        hasInsurance: form.hasInsurance,
        insuranceMonthlyAmount: form.insuranceMonthlyAmount,
        isDFL2: form.isDFL2,
      }
    case 'informal_lender':
      return {
        hasInterest: form.hasInterest,
        urgencyLevel: form.urgencyLevel,
        agreedMonthlyPayment: form.agreedMonthlyPayment,
        agreedTermDescription: form.agreedTermDescription,
      }
    default:
      return {}
  }
}

async function createDebt() {
  error.value = ''
  saving.value = true
  try {
    await api('/api/debts', {
      method: 'POST',
      body: {
        debtType: debtType.value,
        formData: {
          label: form.label,
          lenderName: form.lenderName || null,
          remainingBalance: form.remainingBalance,
          monthlyInterestRate: form.monthlyInterestRate,
          minimumPayment: form.minimumPayment,
          paymentDueDay: form.paymentDueDay,
          cutoffDay: debtType.value === 'credit_card' ? form.cutoffDay : null,
          metadata: buildMetadata(),
        },
      },
    })
    showForm.value = false
    resetForm()
    await loadDebts()
  } catch (e: any) {
    const data = e.data
    if (data?.errors) {
      error.value = data.errors.map((err: any) => err.message).join('. ')
    } else {
      error.value = data?.message ?? e.message ?? 'Error al registrar deuda'
    }
  } finally {
    saving.value = false
  }
}

async function archiveDebt(id: string) {
  try {
    await api(`/api/debts/${id}`, { method: 'DELETE' })
    await loadDebts()
  } catch { /* empty */ }
}

function resetForm() {
  form.label = ''
  form.lenderName = ''
  form.remainingBalance = null
  form.monthlyInterestRate = null
  form.minimumPayment = null
  form.paymentDueDay = null
  form.cutoffDay = null
  error.value = ''
}

function formatCLP(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$' + Math.round(Number(n)).toLocaleString('es-CL')
}

onMounted(loadDebts)
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Mis deudas</h1>
        <p class="mt-1 text-sm text-gray-500">Registra y gestiona tus deudas.</p>
      </div>
      <button
        @click="showForm = !showForm; resetForm()"
        class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        {{ showForm ? 'Cancelar' : '+ Nueva deuda' }}
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showForm" class="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Registrar deuda</h2>

      <div class="space-y-4">
        <!-- Debt type selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de deuda</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="dt in debtTypes"
              :key="dt.value"
              @click="debtType = dt.value"
              :class="[
                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                debtType === dt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              ]"
            >
              {{ dt.label }}
            </button>
          </div>
        </div>

        <!-- Common fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre de la deuda</label>
            <input v-model="form.label" type="text" placeholder="Visa BCI" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Acreedor</label>
            <input v-model="form.lenderName" type="text" placeholder="Banco BCI" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Saldo actual</label>
            <input v-model.number="form.remainingBalance" type="number" min="1" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div v-if="debtType !== 'informal_lender'">
            <label class="block text-sm font-medium text-gray-700">Tasa mensual (%)</label>
            <input v-model.number="form.monthlyInterestRate" type="number" step="0.01" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Pago mínimo mensual</label>
            <input v-model.number="form.minimumPayment" type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Día de vencimiento</label>
            <input v-model.number="form.paymentDueDay" type="number" min="1" max="31" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Type-specific: credit_card -->
        <div v-if="debtType === 'credit_card'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label class="block text-sm font-medium text-gray-700">Día de corte</label>
            <input v-model.number="form.cutoffDay" type="number" min="1" max="31" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Límite de crédito</label>
            <input v-model.number="form.creditLimit" type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.isActivelyUsed" type="checkbox" class="rounded border-gray-300" />
            La uso activamente
          </label>
        </div>

        <!-- Type-specific: consumer_loan -->
        <div v-if="debtType === 'consumer_loan'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label class="block text-sm font-medium text-gray-700">Cuotas totales</label>
            <input v-model.number="form.totalInstallments" type="number" min="1" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Cuotas restantes</label>
            <input v-model.number="form.remainingInstallments" type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.hasInsurance" type="checkbox" class="rounded border-gray-300" />
            Incluye seguro
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="form.allowsEarlyPayment" type="checkbox" class="rounded border-gray-300" />
            Permite prepago
          </label>
        </div>

        <!-- Type-specific: mortgage -->
        <div v-if="debtType === 'mortgage'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label class="block text-sm font-medium text-gray-700">Dividendos restantes</label>
            <input v-model.number="form.remainingInstallments" type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.isFixedRate" type="checkbox" class="rounded border-gray-300" />
              Tasa fija
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.hasInsurance" type="checkbox" class="rounded border-gray-300" />
              Incluye seguros
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.isDFL2" type="checkbox" class="rounded border-gray-300" />
              Acogido a DFL2
            </label>
          </div>
        </div>

        <!-- Type-specific: informal_lender -->
        <div v-if="debtType === 'informal_lender'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label class="block text-sm font-medium text-gray-700">Urgencia</label>
            <select v-model="form.urgencyLevel" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Monto acordado/mes</label>
            <input v-model.number="form.agreedMonthlyPayment" type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Plazo acordado</label>
            <input v-model="form.agreedTermDescription" type="text" placeholder="6 meses" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
        </div>

        <p v-if="error" class="text-sm text-danger-500">{{ error }}</p>

        <button
          @click="createDebt"
          :disabled="saving"
          class="rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {{ saving ? 'Guardando...' : 'Registrar deuda' }}
        </button>
      </div>
    </div>

    <!-- Debt list -->
    <div v-if="loading" class="mt-8 text-center text-sm text-gray-400">Cargando...</div>

    <div v-else-if="!debts.length" class="mt-8 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">No tienes deudas registradas.</p>
    </div>

    <div v-else class="mt-8 space-y-3">
      <div
        v-for="debt in debts"
        :key="debt.id"
        :class="[
          'rounded-lg border bg-white p-4',
          debt.isCritical ? 'border-danger-500' : 'border-gray-200',
          debt.status === 'frozen' ? 'opacity-60' : '',
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ debt.label }}
              <span class="ml-1 text-xs text-gray-400">({{ debtTypeLabels[debt.debtType] ?? debt.debtType }})</span>
              <span v-if="debt.isCritical" class="ml-1 rounded bg-danger-50 px-1.5 py-0.5 text-xs text-danger-600">critica</span>
              <span v-if="debt.status === 'paid_off'" class="ml-1 rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">saldada</span>
              <span v-if="debt.status === 'frozen'" class="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">archivada</span>
            </p>
            <p v-if="debt.lenderName" class="text-xs text-gray-400">{{ debt.lenderName }}</p>
          </div>
          <button
            v-if="debt.status === 'active'"
            @click="archiveDebt(debt.id)"
            class="text-xs text-gray-400 hover:text-danger-500"
          >
            Archivar
          </button>
        </div>
        <div class="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-gray-400 text-xs">Saldo</p>
            <p class="font-medium">{{ formatCLP(Number(debt.remainingBalance)) }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs">Mínimo</p>
            <p class="font-medium">{{ formatCLP(Number(debt.minimumPayment)) }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs">Interés/mes</p>
            <p :class="debt.monthlyInterestCost > 0 ? 'text-danger-500' : ''" class="font-medium">
              {{ formatCLP(debt.monthlyInterestCost) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
