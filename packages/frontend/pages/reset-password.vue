<template>
  <div>
    <NuxtLayout name="auth">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Nueva contraseña</h2>

      <!-- Loading while checking session -->
      <div v-if="checkingSession" class="text-sm text-gray-500 text-center py-4">
        Verificando enlace de recuperación...
      </div>

      <!-- No valid recovery session -->
      <div v-else-if="!hasRecoverySession" class="space-y-4">
        <div class="rounded-lg bg-red-50 border border-red-200 p-4">
          <p class="text-sm text-red-700">
            El enlace de recuperación no es válido o ha expirado. Solicita un nuevo enlace.
          </p>
        </div>
        <NuxtLink
          to="/forgot-password"
          class="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Solicitar nuevo enlace
        </NuxtLink>
      </div>

      <!-- Password reset form -->
      <form v-else class="space-y-4" @submit.prevent="handleReset">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Nueva contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Repite la contraseña"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="text-sm text-green-600">Contraseña actualizada. Redirigiendo al login...</p>
        <button
          type="submit"
          :disabled="loading || success"
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
        </button>
      </form>

      <div class="mt-4 text-sm text-center">
        <NuxtLink to="/login" class="text-blue-600 hover:underline">Volver al login</NuxtLink>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { $supabase } = useNuxtApp();
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref(false);
const loading = ref(false);
const checkingSession = ref(true);
const hasRecoverySession = ref(false);

onMounted(() => {
  // Listen for PASSWORD_RECOVERY event from Supabase
  const { data: { subscription } } = $supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      hasRecoverySession.value = true;
    }
    checkingSession.value = false;
  });

  // Also check current session in case the event already fired
  $supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      hasRecoverySession.value = true;
    }
    // If no event came in 1.5s, stop showing the loading state
    setTimeout(() => {
      checkingSession.value = false;
      subscription.unsubscribe();
    }, 1500);
  });
});

async function handleReset() {
  error.value = '';

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }

  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres';
    return;
  }

  loading.value = true;
  try {
    const { error: updateError } = await $supabase.auth.updateUser({ password: password.value });
    if (updateError) {
      error.value = updateError.message || 'Error al actualizar la contraseña';
      return;
    }
    success.value = true;
    setTimeout(() => navigateTo('/login'), 2000);
  } catch {
    error.value = 'Error al restablecer la contraseña. Intenta de nuevo.';
  } finally {
    loading.value = false;
  }
}
</script>
