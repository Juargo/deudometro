<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink to="/dashboard" class="text-xl font-bold text-gray-900">
            Deudometro
          </NuxtLink>

          <!-- Desktop nav -->
          <nav class="hidden md:flex items-center gap-4">
            <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" class="text-sm text-gray-600 hover:text-gray-900" active-class="font-semibold text-gray-900">
              {{ link.label }}
            </NuxtLink>
            <button class="text-sm text-gray-500 hover:text-gray-700" @click="handleLogout">
              Cerrar sesion
            </button>
          </nav>

          <!-- Mobile hamburger -->
          <button class="md:hidden p-2 text-gray-600 hover:text-gray-900" @click="mobileOpen = !mobileOpen">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mobile menu -->
        <nav v-if="mobileOpen" class="md:hidden pb-4 space-y-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            active-class="font-semibold text-gray-900 bg-gray-50"
            @click="mobileOpen = false"
          >
            {{ link.label }}
          </NuxtLink>
          <button
            class="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            @click="handleLogout"
          >
            Cerrar sesion
          </button>
        </nav>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { logout } = useAuth();
const mobileOpen = ref(false);

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile/edit', label: 'Perfil' },
  { to: '/debts', label: 'Deudas' },
  { to: '/plan', label: 'Plan' },
  { to: '/payments', label: 'Pagos' },
  { to: '/milestones', label: 'Logros' },
  { to: '/space', label: 'Espacio' },
];

async function handleLogout() {
  await logout();
}
</script>
