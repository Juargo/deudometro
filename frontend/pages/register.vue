<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const displayName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)
const { signUp } = useAuth()

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await signUp(email.value, password.value, displayName.value)
    success.value = true
  } catch (e: any) {
    error.value = e.message ?? 'Error al registrarse'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="success" class="text-center space-y-4">
    <p class="text-sm text-gray-700">Revisa tu email para confirmar tu cuenta.</p>
    <NuxtLink to="/login" class="text-sm text-primary-600 hover:underline">Ir a login</NuxtLink>
  </div>

  <form v-else @submit.prevent="handleRegister" class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">Nombre</label>
      <input
        id="name"
        v-model="displayName"
        type="text"
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </div>

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
        minlength="6"
        autocomplete="new-password"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </div>

    <p v-if="error" class="text-sm text-danger-500">{{ error }}</p>

    <button
      type="submit"
      :disabled="loading"
      class="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
    >
      {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
    </button>

    <p class="text-center text-sm text-gray-500">
      ¿Ya tienes cuenta?
      <NuxtLink to="/login" class="text-primary-600 hover:underline">Inicia sesión</NuxtLink>
    </p>
  </form>
</template>
