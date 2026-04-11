<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center">
    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Progreso</h3>
    <div
      class="relative w-44 h-44 rounded-full"
      :style="gaugeStyle"
      :aria-label="`${safeProgress}% de deuda pagada`"
      role="progressbar"
      :aria-valuenow="safeProgress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="absolute inset-3 bg-white rounded-full flex items-center justify-center">
        <span class="text-3xl font-bold" :class="textColor">{{ safeProgress }}%</span>
      </div>
    </div>
    <p class="mt-3 text-sm text-gray-500">Deuda pagada</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ progress: number }>();

const safeProgress = computed(() => {
  const p = props.progress;
  if (!p || isNaN(p)) return 0;
  return Math.max(0, Math.min(100, p));
});

const gaugeColor = computed(() => {
  if (safeProgress.value >= 67) return '#22c55e';
  if (safeProgress.value >= 34) return '#f59e0b';
  return '#ef4444';
});

const textColor = computed(() => {
  if (safeProgress.value >= 67) return 'text-green-600';
  if (safeProgress.value >= 34) return 'text-amber-600';
  return 'text-red-600';
});

const gaugeStyle = computed(() => {
  const deg = (safeProgress.value / 100) * 360;
  return {
    background: `conic-gradient(${gaugeColor.value} ${deg}deg, #e5e7eb ${deg}deg)`,
  };
});
</script>
