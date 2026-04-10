import { defineStore } from 'pinia';

export interface FixedExpenses {
  rent: number;
  utilities: number;
  food: number;
  transport: number;
  other: number;
}

export interface ProfileData {
  id: string;
  displayName: string;
  email: string;
  monthlyIncome: number;
  availableCapital: number;
  monthlyAllocation: number;
  fixedExpenses: FixedExpenses | null;
  reservePercentage: number;
  createdAt: string;
}

export interface BudgetBreakdown {
  effectiveIncome: number;
  incomeSource: 'salary' | 'capital';
  totalFixedCosts: number;
  netAfterExpenses: number;
  reserveAmount: number;
  availableBudget: number;
  minimumPaymentsTotal: number | null;
  budgetWarning: boolean;
}

export interface UpdateFinancialInput {
  monthlyIncome?: number;
  availableCapital?: number;
  monthlyAllocation?: number;
  fixedExpenses?: FixedExpenses;
  reservePercentage?: number;
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<ProfileData | null>(null);
  const budget = ref<BudgetBreakdown | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const { api } = useApi();

  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      const data = await api<{ profile: ProfileData; budget: BudgetBreakdown }>('/profile');
      profile.value = data.profile;
      budget.value = data.budget;
    } catch (err: unknown) {
      error.value = 'Error al cargar el perfil';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateFinancial(input: UpdateFinancialInput) {
    loading.value = true;
    error.value = null;
    try {
      const data = await api<{ profile: ProfileData }>('/profile/financial', {
        method: 'PATCH',
        body: input,
      });
      profile.value = data.profile;
    } catch (err: unknown) {
      error.value = 'Error al actualizar el perfil';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { profile, budget, loading, error, fetchProfile, updateFinancial };
});
