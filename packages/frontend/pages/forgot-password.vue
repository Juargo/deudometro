<template>
  <div>
    <NuxtLayout name="auth">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Recuperar contraseña</h2>
      <form v-if="!sent" class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Enviando...' : 'Enviar instrucciones' }}
        </button>
      </form>
      <div v-else class="text-center space-y-4">
        <p class="text-sm text-gray-600">
          Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
        </p>
      </div>
      <div class="mt-4 text-sm text-center">
        <NuxtLink to="/login" class="text-blue-600 hover:underline">Volver al login</NuxtLink>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { forgotPassword } = useAuth();
const email = ref('');
const sent = ref(false);
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await forgotPassword(email.value);
  } finally {
    // Always show success to prevent email enumeration
    sent.value = true;
    loading.value = false;
  }
}
</script>
