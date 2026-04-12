import { u as useProfileStore } from './profile-CplTGXsv.mjs';
import { computed } from 'vue';

function useProfile() {
  const profileStore = useProfileStore();
  const profile = computed(() => profileStore.profile);
  const budget = computed(() => profileStore.budget);
  const loading = computed(() => profileStore.loading);
  async function fetchProfile() {
    await profileStore.fetchProfile();
  }
  async function updateFinancial(input) {
    await profileStore.updateFinancial(input);
  }
  return { profile, budget, loading, fetchProfile, updateFinancial };
}

export { useProfile as u };
//# sourceMappingURL=useProfile-CKfpsJMw.mjs.map
