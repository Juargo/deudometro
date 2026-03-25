<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { api } = useApi()
const loading = ref(true)
const milestones = ref<any[]>([])
const pendingCount = ref(0)
const filter = ref<'all' | 'pending' | 'acknowledged'>('all')

async function loadMilestones() {
  loading.value = true
  try {
    const res = await api<{ milestones: any[]; pendingCount: number }>('/api/milestones', {
      query: { filter: filter.value },
    })
    milestones.value = res.milestones
    pendingCount.value = res.pendingCount
  } catch { /* empty */ }
  loading.value = false
}

async function acknowledge(id: string) {
  try {
    await api(`/api/milestones/${id}/acknowledge`, { method: 'PATCH' })
    await loadMilestones()
  } catch { /* empty */ }
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

watch(filter, loadMilestones)
onMounted(loadMilestones)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Logros</h1>
    <p class="mt-1 text-sm text-gray-500">Tus hitos y logros en el camino a la libertad financiera.</p>

    <!-- Filter tabs -->
    <div class="mt-4 flex gap-2">
      <button
        v-for="f in [
          { value: 'all', label: 'Todos' },
          { value: 'pending', label: 'Pendientes' },
          { value: 'acknowledged', label: 'Vistos' },
        ] as const"
        :key="f.value"
        @click="filter = f.value"
        :class="[
          'rounded-full px-3 py-1 text-sm font-medium transition-colors',
          filter === f.value
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        {{ f.label }}
        <span v-if="f.value === 'pending' && pendingCount > 0" class="ml-1 rounded-full bg-white px-1.5 text-xs text-primary-600">
          {{ pendingCount }}
        </span>
      </button>
    </div>

    <div v-if="loading" class="mt-8 text-center text-sm text-gray-400">Cargando...</div>

    <div v-else-if="!milestones.length" class="mt-8 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">
        {{ filter === 'pending' ? 'No tienes logros pendientes.' : 'Aún no tienes logros. ¡Registra pagos para desbloquearlos!' }}
      </p>
    </div>

    <div v-else class="mt-6 space-y-3">
      <div
        v-for="m in milestones"
        :key="m.id"
        :class="[
          'rounded-lg border p-4',
          m.acknowledgedAt ? 'border-gray-200 bg-white' : 'border-primary-300 bg-primary-50'
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-900">
              {{ m.label }}
            </p>
            <p class="text-sm text-gray-600 mt-0.5">{{ m.description }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(m.createdAt) }}</p>
          </div>
          <button
            v-if="!m.acknowledgedAt"
            @click="acknowledge(m.id)"
            class="shrink-0 rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
          >
            ¡Visto!
          </button>
          <span v-else class="text-xs text-gray-400">Visto</span>
        </div>
      </div>
    </div>
  </div>
</template>
