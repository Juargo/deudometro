import { defineStore } from 'pinia';
import { ref } from 'vue';
import { u as useApi } from './useApi-VHnIxUUO.mjs';

const useProfileStore = defineStore("profile", () => {
  const profile = ref(null);
  const budget = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const { api } = useApi();
  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      const data = await api("/profile");
      profile.value = data.profile;
      budget.value = data.budget;
    } catch (err) {
      error.value = "Error al cargar el perfil";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function updateFinancial(input) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api("/profile/financial", {
        method: "PATCH",
        body: input
      });
      profile.value = data.profile;
    } catch (err) {
      error.value = "Error al actualizar el perfil";
      throw err;
    } finally {
      loading.value = false;
    }
  }
  return { profile, budget, loading, error, fetchProfile, updateFinancial };
});

export { useProfileStore as u };
//# sourceMappingURL=profile-CplTGXsv.mjs.map
