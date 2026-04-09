import { defineStore } from 'pinia';
import type { UserProfileDTO, FinancialSpaceDTO, MemberRole } from '@deudometro/shared';

interface AuthState {
  accessToken: string | null;
  user: UserProfileDTO | null;
  financialSpace: FinancialSpaceDTO | null;
  role: MemberRole | null;
  isLoading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: null,
    user: null,
    financialSpace: null,
    role: null,
    isLoading: true,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    setSession(token: string, user: UserProfileDTO, financialSpace: FinancialSpaceDTO, role: MemberRole) {
      this.accessToken = token;
      this.user = user;
      this.financialSpace = financialSpace;
      this.role = role;
    },

    clearSession() {
      this.accessToken = null;
      this.user = null;
      this.financialSpace = null;
      this.role = null;
    },

    async initialize() {
      const { $supabase } = useNuxtApp();
      try {
        const { data } = await $supabase.auth.getSession();
        if (data.session) {
          this.accessToken = data.session.access_token;
          const config = useRuntimeConfig();
          const me = await $fetch<{ profile: UserProfileDTO; financialSpace: FinancialSpaceDTO; role: MemberRole }>(
            `${config.public.apiUrl}/me`,
            { headers: { Authorization: `Bearer ${data.session.access_token}` } }
          );
          this.setSession(data.session.access_token, me.profile, me.financialSpace, me.role);
        }
      } catch {
        this.clearSession();
      } finally {
        this.isLoading = false;
      }
    },
  },
});
