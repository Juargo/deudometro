<template>
  <div>
    <NuxtLayout name="auth">
      <div class="text-center space-y-4">
        <div v-if="loading">
          <p class="text-gray-600">Aceptando invitación...</p>
        </div>
        <div v-else-if="success">
          <p class="text-green-600 font-medium">Te has unido al espacio financiero</p>
          <p class="text-sm text-gray-500 mt-2">Redirigiendo al dashboard...</p>
        </div>
        <div v-else>
          <p class="text-red-600 font-medium">{{ errorMessage }}</p>
          <NuxtLink to="/dashboard" class="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Ir al dashboard
          </NuxtLink>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store';

definePageMeta({ layout: false });

const route = useRoute();
const authStore = useAuthStore();
const { api } = useApi();

const loading = ref(true);
const success = ref(false);
const errorMessage = ref('');

const errorMessages: Record<string, string> = {
  INVITATION_NOT_FOUND: 'Invitación no encontrada',
  INVITATION_EXPIRED: 'La invitación ha expirado',
  INVITATION_USED: 'Esta invitación ya fue utilizada',
  MEMBER_ALREADY_EXISTS: 'Ya eres miembro de este espacio',
};

onMounted(async () => {
  const token = route.params.token as string;

  if (!authStore.isAuthenticated) {
    sessionStorage.setItem('pendingInviteToken', token);
    navigateTo('/login');
    return;
  }

  try {
    await api(`/invitations/${token}/accept`, { method: 'POST' });
    success.value = true;
    setTimeout(() => navigateTo('/dashboard'), 2000);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data: { error: string } }).data;
      errorMessage.value = errorMessages[data.error] || 'Error al aceptar la invitación';
    } else {
      errorMessage.value = 'Error al aceptar la invitación';
    }
  } finally {
    loading.value = false;
  }
});
</script>
