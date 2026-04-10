import type { FetchOptions } from 'ofetch';
import { useAuthStore } from '~/stores/auth.store';

export function useApi() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  async function api<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };

    if (authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    try {
      return await $fetch<T>(`${config.public.apiUrl}${path}`, {
        ...options,
        headers,
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        authStore.clearSession();
        navigateTo('/login');
      }
      throw err;
    }
  }

  return { api };
}
