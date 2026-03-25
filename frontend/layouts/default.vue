<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top nav -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/dashboard" class="text-lg font-bold text-gray-900">
          Deudómetro
        </NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink to="/debts" class="text-sm text-gray-600 hover:text-gray-900">Deudas</NuxtLink>
          <NuxtLink to="/plan" class="text-sm text-gray-600 hover:text-gray-900">Plan</NuxtLink>
          <NuxtLink to="/payments" class="text-sm text-gray-600 hover:text-gray-900">Pagos</NuxtLink>
          <NuxtLink to="/milestones" class="text-sm text-gray-600 hover:text-gray-900">Logros</NuxtLink>
          <button
            @click="handleLogout"
            class="text-sm text-gray-400 hover:text-gray-600"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>

    <!-- Page content -->
    <main class="max-w-5xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { signOut } = useAuth()
const router = useRouter()

async function handleLogout() {
  await signOut()
  router.push('/login')
}
</script>
