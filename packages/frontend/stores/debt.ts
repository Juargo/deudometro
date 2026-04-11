import { defineStore } from 'pinia';

export type DebtType = 'credit_card' | 'consumer_loan' | 'mortgage' | 'informal_lender';
export type DebtStatus = 'active' | 'frozen' | 'paid_off';
export type DebtUrgency = 'low' | 'medium' | 'high';

export interface DebtMetadata {
  hasInterest?: boolean;
  urgency?: DebtUrgency;
}

export interface DebtDTO {
  id: string;
  financialSpaceId: string;
  createdByUserId: string;
  label: string;
  debtType: DebtType;
  lenderName: string;
  originalBalance: number;
  remainingBalance: number;
  monthlyInterestRate: number;
  minimumPayment: number;
  paymentDueDay: number;
  cutoffDay: number | null;
  isShared: boolean;
  isCritical: boolean;
  status: DebtStatus;
  metadata: DebtMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtInput {
  label: string;
  debtType: DebtType;
  lenderName: string;
  balance: number;
  monthlyInterestRate: number;
  minimumPayment: number;
  paymentDueDay: number;
  cutoffDay?: number;
  isShared?: boolean;
  metadata?: DebtMetadata;
}

export interface UpdateDebtInput {
  label?: string;
  lenderName?: string;
  remainingBalance?: number;
  monthlyInterestRate?: number;
  minimumPayment?: number;
  paymentDueDay?: number;
  cutoffDay?: number | null;
  metadata?: DebtMetadata;
}

export const useDebtStore = defineStore('debt', () => {
  const debts = ref<DebtDTO[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const criticalDebts = computed(() => debts.value.filter((d) => d.isCritical));

  const totalRemainingBalance = computed(() =>
    debts.value.reduce((sum, d) => sum + d.remainingBalance, 0)
  );
  const totalOriginalBalance = computed(() =>
    debts.value.reduce((sum, d) => sum + d.originalBalance, 0)
  );
  const totalMonthlyInterestCost = computed(() =>
    debts.value
      .filter((d) => d.status === 'active')
      .reduce((sum, d) => sum + (d.remainingBalance * d.monthlyInterestRate) / 100, 0)
  );
  const payoffProgress = computed(() => {
    const original = totalOriginalBalance.value;
    if (original === 0) return 0;
    return Math.round(((original - totalRemainingBalance.value) / original) * 100);
  });
  const sortedDebtsForDashboard = computed(() =>
    [...debts.value].sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.remainingBalance - a.remainingBalance;
    })
  );

  const { api } = useApi();

  async function fetchDebts(status?: DebtStatus) {
    loading.value = true;
    error.value = null;
    try {
      const query = status ? `?status=${status}` : '';
      const data = await api<{ debts: DebtDTO[] }>(`/debts${query}`);
      debts.value = data.debts;
    } catch (err: unknown) {
      error.value = 'Error al cargar las deudas';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createDebt(input: CreateDebtInput): Promise<DebtDTO> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api<{ debt: DebtDTO }>('/debts', {
        method: 'POST',
        body: input,
      });
      debts.value.push(data.debt);
      return data.debt;
    } catch (err: unknown) {
      error.value = 'Error al crear la deuda';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDebt(id: string, input: UpdateDebtInput): Promise<DebtDTO> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api<{ debt: DebtDTO }>(`/debts/${id}`, {
        method: 'PATCH',
        body: input,
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value[idx] = data.debt;
      return data.debt;
    } catch (err: unknown) {
      error.value = 'Error al actualizar la deuda';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function archiveDebt(id: string): Promise<DebtDTO> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api<{ debt: DebtDTO }>(`/debts/${id}/archive`, {
        method: 'POST',
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value.splice(idx, 1);
      return data.debt;
    } catch (err: unknown) {
      error.value = 'Error al archivar la deuda';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleShared(id: string, isShared: boolean): Promise<DebtDTO> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api<{ debt: DebtDTO }>(`/debts/${id}/shared`, {
        method: 'PATCH',
        body: { isShared },
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value[idx] = data.debt;
      return data.debt;
    } catch (err: unknown) {
      error.value = 'Error al actualizar la visibilidad de la deuda';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function markDebtPaid(id: string): Promise<DebtDTO> {
    loading.value = true;
    error.value = null;
    try {
      const data = await api<{ debt: DebtDTO }>(`/debts/${id}/mark-paid`, {
        method: 'POST',
      });
      const idx = debts.value.findIndex((d) => d.id === id);
      if (idx !== -1) debts.value[idx] = data.debt;
      return data.debt;
    } catch (err: unknown) {
      error.value = 'Error al marcar la deuda como pagada';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { debts, loading, error, criticalDebts, totalRemainingBalance, totalOriginalBalance, totalMonthlyInterestCost, payoffProgress, sortedDebtsForDashboard, fetchDebts, createDebt, updateDebt, archiveDebt, toggleShared, markDebtPaid };
});
