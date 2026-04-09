import { useAuthStore } from '~/stores/auth.store';
import type { UserProfileDTO, FinancialSpaceDTO, MemberRole } from '@deudometro/shared';

export function useAuth() {
  const authStore = useAuthStore();
  const { api } = useApi();
  const { $supabase } = useNuxtApp();

  async function login(email: string, password: string) {
    const data = await api<{
      token: string;
      profile: UserProfileDTO;
      financialSpace: FinancialSpaceDTO;
      role: MemberRole;
    }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    // Also sign in with Supabase client for session persistence
    await $supabase.auth.signInWithPassword({ email, password });

    authStore.setSession(data.token, data.profile, data.financialSpace, data.role);
  }

  async function register(email: string, password: string, displayName: string) {
    await api<{ profile: UserProfileDTO; financialSpace: FinancialSpaceDTO }>(
      '/auth/register',
      { method: 'POST', body: { email, password, displayName } }
    );

    // Auto-login after registration
    await login(email, password);
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
      await $supabase.auth.signOut();
    } finally {
      authStore.clearSession();
      navigateTo('/login');
    }
  }

  async function forgotPassword(email: string) {
    await api('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  return { login, register, logout, forgotPassword };
}
