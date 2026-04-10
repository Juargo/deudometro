import { usePlanStore } from '~/stores/plan';
import type { PlanAction } from '~/stores/plan';

export function usePlanView() {
  const planStore = usePlanStore();
  const actions = computed(() => planStore.activePlanActions);

  const actionsByMonth = computed(() => {
    const grouped: Record<number, PlanAction[]> = {};
    for (const action of actions.value) {
      if (!grouped[action.month]) {
        grouped[action.month] = [];
      }
      grouped[action.month].push(action);
    }
    return grouped;
  });

  const attackOrder = computed(() => {
    const month1Actions = actionsByMonth.value[1] ?? [];
    const seen = new Set<string>();
    const ordered: Array<{ debtId: string; debtLabel: string; order: number }> = [];
    let orderNum = 1;
    for (const action of month1Actions) {
      if (!seen.has(action.debtId)) {
        seen.add(action.debtId);
        ordered.push({ debtId: action.debtId, debtLabel: action.debtLabel, order: orderNum++ });
      }
    }
    return ordered;
  });

  function formatCLP(amount: number | string): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount));
  }

  function formatMonth(month: number): string {
    if (!planStore.activePlan?.createdAt) return `Mes ${month}`;
    const base = new Date(planStore.activePlan.createdAt);
    const target = new Date(base.getFullYear(), base.getMonth() + month - 1, 1);
    return target.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

  function formatFreedomDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

  return {
    actionsByMonth,
    attackOrder,
    formatCLP,
    formatMonth,
    formatFreedomDate,
  };
}
