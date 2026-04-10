<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/dashboard" class="text-xl font-bold text-gray-900">
            Deudometro
          </NuxtLink>
          <nav class="flex items-center gap-4">
            <NuxtLink to="/dashboard" class="text-sm text-gray-600 hover:text-gray-900" active-class="font-semibold text-gray-900">
              Dashboard
            </NuxtLink>
            <NuxtLink to="/profile/setup" class="text-sm text-gray-600 hover:text-gray-900" active-class="font-semibold text-gray-900">
              Perfil
            </NuxtLink>
            <NuxtLink to="/debts" class="text-sm text-gray-600 hover:text-gray-900" active-class="font-semibold text-gray-900">
              Deudas
            </NuxtLink>
            <button
              class="text-sm text-gray-500 hover:text-gray-700"
              @click="handleLogout"
            >
              Cerrar sesión
            </button>
          </nav>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { logout } = useAuth();

async function handleLogout() {
  await logout();
}
</script>
