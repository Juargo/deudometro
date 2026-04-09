<template>
  <div>
    <NuxtLayout name="auth">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Crear cuenta</h2>
      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            required
            maxlength="100"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="8"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>
      <div class="mt-4 text-sm text-center">
        <NuxtLink to="/login" class="text-blue-600 hover:underline">Ya tengo cuenta</NuxtLink>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { register } = useAuth();
const form = reactive({ displayName: '', email: '', password: '' });
const error = ref('');
const loading = ref(false);

async function handleRegister() {
  error.value = '';
  loading.value = true;
  try {
    await register(form.email, form.password, form.displayName);
    navigateTo('/dashboard');
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data: { error: string } }).data;
      error.value = data.error === 'EMAIL_ALREADY_REGISTERED' ? 'Este email ya está registrado' : 'Error al crear la cuenta';
    } else {
      error.value = 'Error al crear la cuenta';
    }
  } finally {
    loading.value = false;
  }
}
</script>
