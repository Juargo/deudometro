<template>
  <div class="space-y-6">
    <!-- Warning banner: missing profile data -->
    <div
      v-if="showProfileWarning"
      class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm"
    >
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      <span>
        Completa tu situación laboral y nivel de inversiones en tu perfil para un diagnóstico más preciso.
      </span>
    </div>

    <!-- Panel 1: Financial Snapshot -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">Resumen Financiero</h2>
        <p class="text-sm text-gray-500 mt-0.5">Panorama actual de tu situación financiera</p>
      </div>

      <div class="p-6">
        <!-- Grid: Personal & Income -->
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Perfil Personal</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SnapshotItem
              label="Situación laboral"
              :value="employmentStatusLabel"
              :muted="!profileStore.profile?.employmentStatus"
            />
            <SnapshotItem
              label="Nivel de inversiones"
              :value="investmentKnowledgeLabel"
              :muted="!profileStore.profile?.investmentKnowledge"
            />
            <SnapshotItem
              label="Ingreso mensual"
              :value="formatCLP(profileStore.profile?.monthlyIncome ?? 0)"
            />
          </div>
        </div>

        <!-- Grid: Capital & Budget -->
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Presupuesto</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SnapshotItem
              label="Capital disponible"
              :value="formatCLP(profileStore.profile?.availableCapital ?? 0)"
            />
            <SnapshotItem
              label="Gastos fijos mensuales"
              :value="formatCLP(totalFixedExpenses)"
            />
            <SnapshotItem
              label="Disponible para deudas"
              :value="formatCLP(profileStore.budget?.availableBudget ?? 0)"
            />
            <SnapshotItem
              label="Autonomía financiera"
              :value="financialAutonomy"
            />
          </div>
        </div>

        <!-- Grid: Debts -->
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Deudas</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SnapshotItem
              label="Deuda total activa"
              :value="formatCLP(totalActiveDebt)"
              highlight="red"
            />
            <SnapshotItem
              label="Deudas críticas"
              :value="String(debtStore.criticalDebts.length)"
              :highlight="debtStore.criticalDebts.length > 0 ? 'red' : undefined"
            />
            <SnapshotItem
              label="Intereses mensuales"
              :value="formatCLP(debtStore.totalMonthlyInterestCost)"
              highlight="red"
            />
            <SnapshotItem
              label="Tasa más alta"
              :value="highestRateFormatted"
              highlight="red"
            />
          </div>
        </div>

        <!-- Grid: Plan -->
        <div>
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Plan de Pago</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SnapshotItem
              label="Estrategia activa"
              :value="strategyLabel"
              :muted="!planStore.activePlan"
            />
            <SnapshotItem
              label="Libertad financiera"
              :value="freedomDateLabel"
              :muted="!planStore.activePlan?.financialFreedomDate"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Intention textarea + submit -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">Tu intención financiera</h2>
        <p class="text-sm text-gray-500 mt-0.5">Cuéntanos qué tienes pensado hacer para personalizar el diagnóstico</p>
      </div>

      <div class="p-6 space-y-4">
        <textarea
          v-model="intention"
          rows="4"
          class="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition"
          placeholder="Describe qué tienes pensado hacer con tus finanzas..."
        />

        <!-- Error message (inline, before submit button) -->
        <p v-if="diagnosis.error.value && !diagnosis.canRetry.value" class="text-sm text-red-600">
          {{ diagnosis.error.value }}
        </p>

        <div class="flex items-center justify-between gap-4">
          <p class="text-xs text-gray-400">{{ intention.length }}/5000 caracteres</p>
          <button
            :disabled="isSubmitDisabled"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            @click="handleSubmit"
          >
            <svg
              v-if="diagnosis.isLoading.value"
              class="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            {{ diagnosis.isLoading.value ? 'Enviando...' : 'Enviar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Panel 2: Loading state -->
    <div
      v-if="diagnosis.isLoading.value"
      class="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-4 text-gray-500"
    >
      <svg class="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
      <p class="text-sm font-medium">Generando diagnóstico...</p>
    </div>

    <!-- Panel 2: Error state with retry -->
    <div
      v-else-if="diagnosis.error.value && diagnosis.canRetry.value"
      class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4"
    >
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-red-700 font-medium">{{ diagnosis.error.value }}</p>
      </div>
      <button
        class="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
        @click="diagnosis.retry()"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 0 4.582 9H4"/>
        </svg>
        Reintentar
      </button>
    </div>

    <!-- Panel 2: Diagnosis result -->
    <div
      v-else-if="diagnosis.diagnosisResult.value"
      class="bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span class="text-lg">🔍</span>
        <h2 class="text-base font-semibold text-gray-900">Diagnóstico</h2>
      </div>

      <div class="p-6 space-y-6">
        <!-- Diagnosis text -->
        <p class="text-sm text-gray-700 leading-relaxed">
          {{ diagnosis.diagnosisResult.value.diagnosis }}
        </p>

        <!-- Approaches section -->
        <div v-if="diagnosis.diagnosisResult.value.approaches?.length">
          <!-- Divider with label -->
          <div class="flex items-center gap-3 mb-5">
            <div class="flex-1 h-px bg-gray-200" />
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Enfoques de Acción</span>
            <div class="flex-1 h-px bg-gray-200" />
          </div>

          <!-- Approach cards grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(approach, index) in diagnosis.diagnosisResult.value.approaches"
              :key="index"
              class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 flex flex-col"
            >
              <!-- Title -->
              <h3 class="text-sm font-semibold text-gray-900">{{ approach.title }}</h3>

              <!-- Rationale -->
              <p class="text-xs italic text-gray-500 leading-snug">{{ approach.rationale }}</p>

              <!-- Description -->
              <p class="text-xs text-gray-700 leading-relaxed">{{ approach.description }}</p>

              <!-- First steps -->
              <ul
                v-if="approach.first_steps?.length"
                class="mt-1 space-y-1 pt-2 border-t border-gray-200"
              >
                <li
                  v-for="(step, si) in approach.first_steps"
                  :key="si"
                  class="flex items-start gap-1.5 text-xs text-gray-600"
                >
                  <span class="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                  {{ step }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useProfileStore } from '~/stores/profile';
import { useDebtStore } from '~/stores/debt';
import { usePlanStore } from '~/stores/plan';
import { useCurrency } from '~/composables/useCurrency';
import { useDiagnosis } from '~/composables/useDiagnosis';

// ── Stores & composables ──────────────────────────────────────────────────────
const profileStore = useProfileStore();
const debtStore    = useDebtStore();
const planStore    = usePlanStore();
const { formatCLP } = useCurrency();
const diagnosis = useDiagnosis();

// ── Intention textarea ────────────────────────────────────────────────────────
const intention = ref(profileStore.profile?.financialIntention ?? '');

// ── Warning banner ────────────────────────────────────────────────────────────
const showProfileWarning = computed(
  () => !profileStore.profile?.employmentStatus || !profileStore.profile?.investmentKnowledge
);

// ── Employment status label ───────────────────────────────────────────────────
const employmentStatusMap: Record<string, string> = {
  employed:    'Empleado',
  independent: 'Independiente',
  unemployed:  'Desempleado',
};

const employmentStatusLabel = computed(() => {
  const val = profileStore.profile?.employmentStatus;
  return val ? (employmentStatusMap[val] ?? val) : 'No especificado';
});

// ── Investment knowledge label ────────────────────────────────────────────────
const investmentKnowledgeMap: Record<string, string> = {
  high:   'Alto',
  medium: 'Medio',
  low:    'Bajo',
};

const investmentKnowledgeLabel = computed(() => {
  const val = profileStore.profile?.investmentKnowledge;
  return val ? (investmentKnowledgeMap[val] ?? val) : 'No especificado';
});

// ── Total fixed expenses ──────────────────────────────────────────────────────
const totalFixedExpenses = computed(() => {
  const fe = profileStore.profile?.fixedExpenses;
  if (!fe) return 0;
  return (fe.rent ?? 0) + (fe.utilities ?? 0) + (fe.food ?? 0) + (fe.transport ?? 0) + (fe.other ?? 0);
});

// ── Total active debt ─────────────────────────────────────────────────────────
const totalActiveDebt = computed(() =>
  debtStore.debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.remainingBalance, 0)
);

// ── Highest monthly interest rate ────────────────────────────────────────────
const highestRateFormatted = computed(() => {
  const activeDebts = debtStore.debts.filter((d) => d.status === 'active');
  if (activeDebts.length === 0) return '—';
  const max = Math.max(...activeDebts.map((d) => d.monthlyInterestRate));
  return `${max.toFixed(2)}%`;
});

// ── Financial autonomy ────────────────────────────────────────────────────────
const financialAutonomy = computed(() => {
  const income    = profileStore.profile?.monthlyIncome ?? 0;
  const capital   = profileStore.profile?.availableCapital ?? 0;
  const fixedExp  = totalFixedExpenses.value;
  const minPayments = debtStore.debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.minimumPayment, 0);

  const totalMonthlyNeeds = fixedExp + minPayments;

  if (income >= totalMonthlyNeeds) {
    return 'Ingresos cubren gastos';
  }

  const deficit  = totalMonthlyNeeds - income;
  const months   = capital / Math.max(1, deficit);
  const rounded  = Math.floor(months);
  return `${rounded} ${rounded === 1 ? 'mes' : 'meses'}`;
});

// ── Strategy label ────────────────────────────────────────────────────────────
const strategyLabelMap: Record<string, string> = {
  avalanche:              'Avalanche (mayor tasa)',
  snowball:               'Snowball (menor saldo)',
  hybrid:                 'Híbrida',
  crisis_first:           'Crisis primero',
  guided_consolidation:   'Consolidación guiada',
};

const strategyLabel = computed(() => {
  const strategy = planStore.activePlan?.strategy;
  return strategy ? (strategyLabelMap[strategy] ?? strategy) : 'Sin plan activo';
});

// ── Freedom date label ────────────────────────────────────────────────────────
const freedomDateLabel = computed(() => {
  const date = planStore.activePlan?.financialFreedomDate;
  if (!date) return 'Sin fecha proyectada';
  return new Intl.DateTimeFormat('es-CL', { year: 'numeric', month: 'long' }).format(new Date(date));
});

// ── Submit ────────────────────────────────────────────────────────────────────
const isSubmitDisabled = computed(
  () => !intention.value.trim() || diagnosis.isLoading.value
);

async function handleSubmit() {
  await diagnosis.submit(intention.value);
}
</script>
