import { usePlanStore } from '~/stores/plan';

export function usePlanGeneration() {
  const planStore = usePlanStore();
  const isGenerating = computed(() => planStore.isGenerating);
  const error = computed(() => planStore.error);

  const showDelayWarning = ref(false);
  let delayTimer: ReturnType<typeof setTimeout> | null = null;

  function startDelayTimer() {
    showDelayWarning.value = false;
    delayTimer = setTimeout(() => {
      showDelayWarning.value = true;
    }, 45_000);
  }

  function clearDelayTimer() {
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    showDelayWarning.value = false;
  }

  watch(isGenerating, (generating) => {
    if (generating) {
      startDelayTimer();
    } else {
      clearDelayTimer();
      if (!planStore.error) {
        const aiStatus = planStore.generationAiStatus;
        if (aiStatus === 'timeout' || aiStatus === 'pending') {
          navigateTo('/plan?aiPending=true');
        } else {
          navigateTo('/plan');
        }
      }
    }
  });

  onUnmounted(() => {
    clearDelayTimer();
  });

  return {
    isGenerating,
    error,
    showDelayWarning,
  };
}
