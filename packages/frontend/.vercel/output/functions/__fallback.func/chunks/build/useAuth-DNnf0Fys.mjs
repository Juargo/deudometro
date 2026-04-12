import { u as useAuthStore, c as useNuxtApp, n as navigateTo } from './server.mjs';
import { u as useApi } from './useApi-VHnIxUUO.mjs';

function useAuth() {
  const authStore = useAuthStore();
  const { api } = useApi();
  const { $supabase } = useNuxtApp();
  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    await $supabase.auth.setSession({ access_token: data.token, refresh_token: "" });
    authStore.setSession(data.token, data.profile, data.financialSpace, data.role);
  }
  async function register(email, password, displayName) {
    await api(
      "/auth/register",
      { method: "POST", body: { email, password, displayName } }
    );
    await login(email, password);
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      await $supabase.auth.signOut();
    } finally {
      authStore.clearSession();
      navigateTo("/login");
    }
  }
  async function forgotPassword(email) {
    await api("/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  }
  return { login, register, logout, forgotPassword };
}

export { useAuth as u };
//# sourceMappingURL=useAuth-DNnf0Fys.mjs.map
