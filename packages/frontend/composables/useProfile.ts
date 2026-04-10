import { useProfileStore } from '~/stores/profile';
import type { UpdateFinancialInput } from '~/stores/profile';

export function useProfile() {
  const profileStore = useProfileStore();

  const profile = computed(() => profileStore.profile);
  const budget = computed(() => profileStore.budget);
  const loading = computed(() => profileStore.loading);

  async function fetchProfile() {
    await profileStore.fetchProfile();
  }

  async function updateFinancial(input: UpdateFinancialInput) {
    await profileStore.updateFinancial(input);
  }

  return { profile, budget, loading, fetchProfile, updateFinancial };
}
