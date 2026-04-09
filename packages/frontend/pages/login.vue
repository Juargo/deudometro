<template>
  <div>
    <NuxtLayout name="auth">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Iniciar sesión</h2>
      <form class="space-y-4" @submit.prevent="handleLogin">
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
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
      <div class="mt-4 flex justify-between text-sm">
        <NuxtLink to="/register" class="text-blue-600 hover:underline">Crear cuenta</NuxtLink>
        <NuxtLink to="/forgot-password" class="text-blue-600 hover:underline">Olvidé mi contraseña</NuxtLink>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { login } = useAuth();
const form = reactive({ email: '', password: '' });
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await login(form.email, form.password);

    // Check for pending invite token
    const pendingToken = sessionStorage.getItem('pendingInviteToken');
    if (pendingToken) {
      sessionStorage.removeItem('pendingInviteToken');
      navigateTo(`/invite/${pendingToken}`);
    } else {
      navigateTo('/dashboard');
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data: { error: string } }).data;
      error.value = data.error === 'INVALID_CREDENTIALS' ? 'Email o contraseña incorrectos' : 'Error al iniciar sesión';
    } else {
      error.value = 'Error al iniciar sesión';
    }
  } finally {
    loading.value = false;
  }
}
</script>
