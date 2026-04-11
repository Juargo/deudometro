<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="handleClose"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 text-center">
        <div class="text-5xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">¡Felicidades!</h2>
        <p class="text-sm text-gray-500 mb-6">Alcanzaste un nuevo hito en tu camino libre de deudas.</p>

        <ul class="space-y-3 mb-8">
          <li
            v-for="milestone in milestones"
            :key="milestone.id"
            class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 font-medium"
          >
            {{ milestone.message }}
          </li>
        </ul>

        <button
          type="button"
          class="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          @click="handleClose"
        >
          ¡Seguir adelante!
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { MilestoneResponse } from '~/stores/payment';
import { usePaymentStore } from '~/stores/payment';

const props = defineProps<{
  milestones: MilestoneResponse[];
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const paymentStore = usePaymentStore();

async function handleClose() {
  // Acknowledge all unacknowledged milestones
  const unacknowledged = props.milestones.filter((m) => m.acknowledgedAt === null);
  await Promise.allSettled(unacknowledged.map((m) => paymentStore.acknowledgeMilestone(m.id)));
  emit('close');
}
</script>
