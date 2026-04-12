<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Espacio Financiero</h1>

    <!-- Space info -->
    <div v-if="space" class="bg-white rounded-lg border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Espacio</p>
      <p class="text-lg font-semibold text-gray-900">{{ space.name }}</p>
      <p class="text-sm text-gray-500 mt-1">Moneda: {{ space.currency }}</p>
    </div>

    <!-- Members -->
    <div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Miembros</h2>
      <div v-if="loadingSpace" class="text-sm text-gray-500">Cargando...</div>
      <ul v-else-if="members.length" class="divide-y divide-gray-100">
        <li v-for="member in members" :key="member.id" class="flex items-center justify-between py-3">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ member.displayName }}</p>
            <p class="text-xs text-gray-500">{{ member.email }}</p>
          </div>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="member.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
          >
            {{ member.role === 'owner' ? 'Propietario' : 'Editor' }}
          </span>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-500">No hay miembros.</p>
    </div>

    <!-- Invitations (owner only) -->
    <div v-if="isOwner" class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Invitaciones</h2>

      <!-- Invite form -->
      <form class="flex gap-2" @submit.prevent="handleInvite">
        <input
          v-model="inviteEmail"
          type="email"
          required
          placeholder="email@ejemplo.com"
          class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          :disabled="inviting"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ inviting ? 'Enviando...' : 'Invitar' }}
        </button>
      </form>

      <p v-if="inviteError" class="text-sm text-red-600">{{ inviteError }}</p>
      <p v-if="inviteSuccess" class="text-sm text-green-600">{{ inviteSuccess }}</p>

      <!-- Pending invitations -->
      <div v-if="loadingInvitations" class="text-sm text-gray-500">Cargando invitaciones...</div>
      <ul v-else-if="invitations.length" class="divide-y divide-gray-100">
        <li v-for="inv in invitations" :key="inv.id" class="flex items-center justify-between py-3">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ inv.email }}</p>
            <p class="text-xs text-gray-500">
              Estado:
              <span
                class="font-medium"
                :class="{
                  'text-amber-600': inv.status === 'pending',
                  'text-green-600': inv.status === 'accepted',
                  'text-red-600': inv.status === 'revoked' || inv.status === 'expired',
                }"
              >
                {{ statusLabels[inv.status] || inv.status }}
              </span>
            </p>
          </div>
          <button
            v-if="inv.status === 'pending'"
            class="text-sm text-red-600 hover:text-red-800"
            :disabled="revoking === inv.id"
            @click="handleRevoke(inv.id)"
          >
            {{ revoking === inv.id ? 'Revocando...' : 'Revocar' }}
          </button>
        </li>
      </ul>
      <p v-else class="text-sm text-gray-500">No hay invitaciones pendientes.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.store';

const authStore = useAuthStore();
const { api } = useApi();

const isOwner = computed(() => authStore.role === 'owner');

interface Member {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: 'owner' | 'editor';
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  token: string;
  createdAt: string;
}

interface SpaceInfo {
  name: string;
  currency: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  revoked: 'Revocada',
  expired: 'Expirada',
};

const space = ref<SpaceInfo | null>(null);
const members = ref<Member[]>([]);
const invitations = ref<Invitation[]>([]);
const loadingSpace = ref(true);
const loadingInvitations = ref(true);
const inviteEmail = ref('');
const inviting = ref(false);
const inviteError = ref('');
const inviteSuccess = ref('');
const revoking = ref<string | null>(null);

async function fetchSpace() {
  loadingSpace.value = true;
  try {
    const data = await api<{ space: SpaceInfo; members: Member[] }>('/financial-space');
    space.value = data.space;
    members.value = data.members;
  } catch {
    // silent
  } finally {
    loadingSpace.value = false;
  }
}

async function fetchInvitations() {
  loadingInvitations.value = true;
  try {
    const data = await api<{ invitations: Invitation[] }>('/invitations');
    invitations.value = data.invitations;
  } catch {
    // silent
  } finally {
    loadingInvitations.value = false;
  }
}

async function handleInvite() {
  inviting.value = true;
  inviteError.value = '';
  inviteSuccess.value = '';
  try {
    await api('/invitations', { method: 'POST', body: { email: inviteEmail.value } });
    inviteSuccess.value = `Invitacion enviada a ${inviteEmail.value}`;
    inviteEmail.value = '';
    await fetchInvitations();
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data: { error?: string; message?: string } }).data;
      const messages: Record<string, string> = {
        ALREADY_MEMBER: 'Este usuario ya es miembro del espacio.',
        INVITATION_ALREADY_EXISTS: 'Ya existe una invitacion pendiente para este email.',
      };
      inviteError.value = messages[data.error || ''] || data.message || 'Error al enviar la invitacion.';
    } else {
      inviteError.value = 'Error al enviar la invitacion.';
    }
  } finally {
    inviting.value = false;
  }
}

async function handleRevoke(id: string) {
  revoking.value = id;
  try {
    await api(`/invitations/${id}`, { method: 'DELETE' });
    await fetchInvitations();
  } catch {
    // silent
  } finally {
    revoking.value = null;
  }
}

onMounted(() => {
  fetchSpace();
  if (isOwner.value) {
    fetchInvitations();
  }
});
</script>
