import { ref } from 'vue';
import { useApi } from '~/composables/useApi';
import type { DiagnosisRequest, DiagnosisResponse } from '@deudometro/shared';

export function useDiagnosis() {
  const { api } = useApi();

  const diagnosisResult = ref<DiagnosisResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const canRetry = ref(false);
  const lastIntention = ref('');

  async function submit(intention: string): Promise<void> {
    if (!intention.trim()) {
      error.value = 'Por favor ingresa tu intención financiera antes de continuar.';
      return;
    }

    isLoading.value = true;
    error.value = null;
    canRetry.value = false;
    lastIntention.value = intention;

    try {
      const payload: DiagnosisRequest = { financialIntention: intention };
      const result = await api<DiagnosisResponse>('/diagnosis', {
        method: 'POST',
        body: payload,
      });
      diagnosisResult.value = result;
    } catch (err: unknown) {
      diagnosisResult.value = null;
      canRetry.value = true;

      if (err && typeof err === 'object') {
        if ('status' in err) {
          const status = (err as { status: number }).status;
          if (status === 408 || status === 504) {
            error.value = 'La solicitud tardó demasiado. Por favor, intenta nuevamente.';
          } else if (status >= 500) {
            error.value = 'Ocurrió un error en el servidor. Por favor, intenta más tarde.';
          } else if (status === 422 || status === 400) {
            error.value = 'La información ingresada no es válida. Revisa tu texto e intenta nuevamente.';
          } else {
            error.value = 'No se pudo obtener el diagnóstico. Por favor, intenta nuevamente.';
          }
        } else if ('message' in err) {
          const message = (err as { message: string }).message;
          if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
            error.value = 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.';
          } else {
            error.value = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
          }
        } else {
          error.value = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
        }
      } else {
        error.value = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function retry(): Promise<void> {
    if (lastIntention.value) {
      await submit(lastIntention.value);
    }
  }

  function reset(): void {
    diagnosisResult.value = null;
    error.value = null;
    isLoading.value = false;
    canRetry.value = false;
  }

  return {
    diagnosisResult,
    isLoading,
    error,
    canRetry,
    lastIntention,
    submit,
    retry,
    reset,
  };
}
