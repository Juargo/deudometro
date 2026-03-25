<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { api } = useApi()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const showForm = ref(false)

// Payment list
const payments = ref<any[]>([])
const total = ref(0)

// Debts for selector
const debts = ref<any[]>([])

// Form
const form = reactive({
  debtId: '',
  amount: null as number | null,
  paidAt: new Date().toISOString().slice(0, 10),
  notes: '',
})

// Feedback after payment
const lastResult = ref<any>(null)

async function loadPayments() {
  loading.value = true
  try {
    const res = await api<{ payments: any[]; total: number }>('/api/payments', { query: { limit: 50 } })
    payments.value = res.payments
    total.value = res.total
  } catch { /* empty */ }
  loading.value = false
}

async function loadDebts() {
  try {
    const res = await api<{ debts: any[] }>('/api/debts', { query: { status: 'active' } })
    debts.value = res.debts
  } catch { /* empty */ }
}

async function recordPayment() {
  error.value = ''
  lastResult.value = null
  saving.value = true
  try {
    const res = await api<{ payment: any; debtUpdate: any; newMilestones: any[] }>('/api/payments', {
      method: 'POST',
      body: {
        debtId: form.debtId,
        amount: form.amount,
        paidAt: form.paidAt,
        notes: form.notes || undefined,
      },
    })
    lastResult.value = res
    showForm.value = false
    resetForm()
    await loadPayments()
    await loadDebts()
  } catch (e: any) {
    const data = e.data
    if (data?.error === 'DEBT_NOT_FOUND') error.value = 'Deuda no encontrada.'
    else if (data?.error === 'DEBT_ALREADY_PAID') error.value = 'Esta deuda ya está saldada.'
    else if (data?.error === 'PAYMENT_EXCEEDS_BALANCE') error.value = 'El monto supera el saldo restante.'
    else if (data?.error === 'INVALID_AMOUNT') error.value = 'Monto inválido.'
    else error.value = data?.message ?? e.message ?? 'Error al registrar pago'
  } finally {
    saving.value = false
  }
}

function resetForm() {
  form.debtId = ''
  form.amount = null
  form.paidAt = new Date().toISOString().slice(0, 10)
  form.notes = ''
  error.value = ''
}

function formatCLP(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$' + Math.round(Number(n)).toLocaleString('es-CL')
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  await Promise.all([loadPayments(), loadDebts()])
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pagos</h1>
        <p class="mt-1 text-sm text-gray-500">Registra pagos y revisa tu historial.</p>
      </div>
      <button
        @click="showForm = !showForm; resetForm()"
        class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        {{ showForm ? 'Cancelar' : '+ Registrar pago' }}
      </button>
    </div>

    <!-- Payment result feedback -->
    <div v-if="lastResult" class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <p class="text-sm font-medium text-green-700">
        Pago registrado: {{ formatCLP(lastResult.payment.amount) }}
      </p>
      <p class="text-xs text-green-600 mt-1">
        Saldo anterior: {{ formatCLP(lastResult.debtUpdate.previousBalance) }}
        → Nuevo saldo: {{ formatCLP(lastResult.debtUpdate.newBalance) }}
        <span v-if="lastResult.debtUpdate.isPaidOff" class="ml-1 font-semibold">¡Deuda saldada!</span>
      </p>
      <!-- New milestones -->
      <div v-if="lastResult.newMilestones?.length" class="mt-2 space-y-1">
        <div v-for="m in lastResult.newMilestones" :key="m.id" class="flex items-center gap-2 text-sm text-primary-700">
          <span class="text-lg">🎉</span>
          <span class="font-medium">{{ m.label }}</span>
          <span class="text-xs text-gray-500">{{ m.description }}</span>
        </div>
      </div>
      <button @click="lastResult = null" class="mt-2 text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
    </div>

    <!-- Payment form -->
    <div v-if="showForm" class="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Registrar pago</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Deuda</label>
          <select
            v-model="form.debtId"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="" disabled>Selecciona una deuda</option>
            <option v-for="d in debts" :key="d.id" :value="d.id">
              {{ d.label }} — {{ formatCLP(Number(d.remainingBalance)) }} restante
            </option>
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Monto</label>
            <div class="relative mt-1">
              <span class="absolute left-3 top-2 text-sm text-gray-400">$</span>
              <input
                v-model.number="form.amount"
                type="number"
                min="1"
                class="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Fecha de pago</label>
            <input
              v-model="form.paidAt"
              type="date"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Notas (opcional)</label>
          <input
            v-model="form.notes"
            type="text"
            placeholder="Pago anticipado, abono extra..."
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <p v-if="error" class="text-sm text-danger-500">{{ error }}</p>

        <button
          @click="recordPayment"
          :disabled="saving || !form.debtId || !form.amount"
          class="rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {{ saving ? 'Guardando...' : 'Registrar pago' }}
        </button>
      </div>
    </div>

    <!-- Payment history -->
    <div v-if="loading" class="mt-8 text-center text-sm text-gray-400">Cargando...</div>

    <div v-else-if="!payments.length" class="mt-8 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">No tienes pagos registrados.</p>
    </div>

    <div v-else class="mt-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Historial de pagos</h2>
      <div class="space-y-2">
        <div
          v-for="p in payments"
          :key="p.id"
          class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ p.debtLabel ?? 'Deuda' }}</p>
            <p class="text-xs text-gray-400">
              {{ formatDate(p.paidAt) }}
              <span v-if="p.notes" class="ml-1">· {{ p.notes }}</span>
            </p>
          </div>
          <p class="text-sm font-bold text-gray-900">{{ formatCLP(p.amount) }}</p>
        </div>
      </div>
      <p v-if="total > payments.length" class="mt-3 text-center text-xs text-gray-400">
        Mostrando {{ payments.length }} de {{ total }} pagos
      </p>
    </div>
  </div>
</template>
