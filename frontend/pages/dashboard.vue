<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
const { api } = useApi()
const router = useRouter()
const loading = ref(true)
const profile = ref<any>(null)
const debts = ref<any>(null)

onMounted(async () => {
  try {
    const res = await api<{ profile: any }>('/api/profile')
    profile.value = res.profile
  } catch (e: any) {
    if (e.status === 404) {
      router.push('/onboarding')
      return
    }
  }

  try {
    const res = await api<{ debts: any[]; summary: any }>('/api/debts')
    debts.value = res
  } catch {
    // No debts yet — fine
  }

  loading.value = false
})

function formatCLP(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$' + Math.round(n).toLocaleString('es-CL')
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-20">
    <p class="text-sm text-gray-400">Cargando...</p>
  </div>

  <div v-else>
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p class="mt-1 text-sm text-gray-500">
      Bienvenido, {{ profile?.displayName ?? user?.email }}
    </p>

    <!-- Summary cards -->
    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <p class="text-sm text-gray-500">Deuda total</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">
          {{ formatCLP(debts?.summary?.totalRemainingBalance) }}
        </p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <p class="text-sm text-gray-500">Intereses mensuales</p>
        <p class="mt-1 text-2xl font-bold text-danger-500">
          {{ formatCLP(debts?.summary?.totalMonthlyInterestCost) }}
        </p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <p class="text-sm text-gray-500">Pagos mínimos</p>
        <p class="mt-1 text-2xl font-bold text-primary-600">
          {{ formatCLP(debts?.summary?.totalMinimumPayments) }}
        </p>
      </div>
    </div>

    <!-- Debt list preview -->
    <div class="mt-8">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Mis deudas</h2>
        <NuxtLink to="/debts" class="text-sm text-primary-600 hover:underline">Ver todas</NuxtLink>
      </div>

      <div v-if="!debts?.debts?.length" class="mt-4 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-500">Aún no tienes deudas registradas.</p>
        <NuxtLink
          to="/debts"
          class="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Registrar primera deuda
        </NuxtLink>
      </div>

      <div v-else class="mt-4 space-y-3">
        <div
          v-for="debt in debts.debts.slice(0, 5)"
          :key="debt.id"
          :class="[
            'flex items-center justify-between rounded-lg border bg-white p-4',
            debt.isCritical ? 'border-danger-500 bg-danger-50' : 'border-gray-200'
          ]"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ debt.label }}
              <span v-if="debt.isCritical" class="ml-1 text-xs text-danger-500 font-normal">critica</span>
            </p>
            <p class="text-xs text-gray-500">{{ formatCLP(Number(debt.remainingBalance)) }} restante</p>
          </div>
          <p class="text-sm font-medium text-gray-700">{{ formatCLP(Number(debt.minimumPayment)) }}/mes</p>
        </div>
      </div>
    </div>
  </div>
</template>
