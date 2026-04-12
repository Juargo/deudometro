import { u as useAuthStore, n as navigateTo, d as useRuntimeConfig } from './server.mjs';

function useApi() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  async function api(path, options = {}) {
    const headers = { ...options.headers || {} };
    if (authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    try {
      return await $fetch(`${config.public.apiUrl}${path}`, {
        ...options,
        headers
      });
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && err.status === 401) {
        authStore.clearSession();
        navigateTo("/login");
      }
      throw err;
    }
  }
  return { api };
}

export { useApi as u };
//# sourceMappingURL=useApi-VHnIxUUO.mjs.map
