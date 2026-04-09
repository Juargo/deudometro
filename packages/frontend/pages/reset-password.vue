<template>
  <div>
    <NuxtLayout name="auth">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Nueva contraseña</h2>
      <form class="space-y-4" @submit.prevent="handleReset">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Nueva contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="text-sm text-green-600">Contraseña actualizada. Redirigiendo...</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
        </button>
      </form>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const { api } = useApi();
const password = ref('');
const error = ref('');
const success = ref(false);
const loading = ref(false);

async function handleReset() {
  error.value = '';
  loading.value = true;
  try {
    const token = route.query.token as string;
    if (!token) {
      error.value = 'Token de recuperación no encontrado';
      return;
    }
    await api('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: password.value },
    });
    success.value = true;
    setTimeout(() => navigateTo('/login'), 2000);
  } catch {
    error.value = 'Error al restablecer la contraseña';
  } finally {
    loading.value = false;
  }
}
</script>
