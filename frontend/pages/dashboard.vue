<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p class="mt-1 text-sm text-gray-500">Bienvenido, {{ user?.user_metadata?.display_name ?? user?.email }}</p>

    <!-- TODO: onboarding check, debt summary, plan summary -->
    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <p class="text-sm text-gray-500">Deuda total</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">—</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <p class="text-sm text-gray-500">Intereses mensuales</p>
        <p class="mt-1 text-2xl font-bold text-danger-500">—</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <p class="text-sm text-gray-500">Fecha libre de deuda</p>
        <p class="mt-1 text-2xl font-bold text-primary-600">—</p>
      </div>
    </div>
  </div>
</template>
