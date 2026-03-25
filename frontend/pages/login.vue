<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const { signIn } = useAuth()
const router = useRouter()

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message ?? 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        autocomplete="email"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        autocomplete="current-password"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </div>

    <p v-if="error" class="text-sm text-danger-500">{{ error }}</p>

    <button
      type="submit"
      :disabled="loading"
      class="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
    >
      {{ loading ? 'Entrando...' : 'Iniciar sesión' }}
    </button>

    <p class="text-center text-sm text-gray-500">
      ¿No tienes cuenta?
      <NuxtLink to="/register" class="text-primary-600 hover:underline">Regístrate</NuxtLink>
    </p>
  </form>
</template>
