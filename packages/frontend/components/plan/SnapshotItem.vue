<template>
  <div class="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
    <p class="text-xs text-gray-500 mb-1">{{ label }}</p>
    <p
      class="text-sm font-semibold leading-snug"
      :class="valueClass"
    >
      {{ value }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  value: string;
  muted?: boolean;
  highlight?: 'red' | 'green';
}>();

const valueClass = computed(() => {
  if (props.muted) return 'text-gray-400 italic';
  if (props.highlight === 'red') return 'text-red-600';
  if (props.highlight === 'green') return 'text-emerald-600';
  return 'text-gray-900';
});
</script>
