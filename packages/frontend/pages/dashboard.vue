<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        Hola, {{ authStore.user?.displayName }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        {{ authStore.financialSpace?.name }} &middot;
        <span class="capitalize">{{ authStore.role }}</span>
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Miembros</h2>
        <div v-if="loadingSpace" class="mt-4 text-sm text-gray-400">Cargando...</div>
        <ul v-else class="mt-4 space-y-2">
          <li v-for="member in spaceData?.members" :key="member.id" class="flex items-center justify-between text-sm">
            <span class="text-gray-900">{{ member.userId }}</span>
            <span class="text-xs px-2 py-1 rounded-full" :class="member.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
              {{ member.role }}
            </span>
          </li>
        </ul>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Resumen</h2>
        <div class="mt-4 space-y-3 text-sm text-gray-600">
          <p>Ingreso mensual: <span class="font-medium text-gray-900">${{ authStore.user?.monthlyIncome ?? 0 }}</span></p>
          <p>Capital disponible: <span class="font-medium text-gray-900">${{ authStore.user?.availableCapital ?? 0 }}</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store';

const authStore = useAuthStore();
const { api } = useApi();

const spaceData = ref<{ space: unknown; members: { id: string; userId: string; role: string }[] } | null>(null);
const loadingSpace = ref(true);

onMounted(async () => {
  try {
    spaceData.value = await api('/financial-space');
  } finally {
    loadingSpace.value = false;
  }
});
</script>
