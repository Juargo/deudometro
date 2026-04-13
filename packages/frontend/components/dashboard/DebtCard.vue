<template>
  <NuxtLink
    :to="`/debts/${debt.id}`"
    class="block bg-white rounded-[20px] px-[1.4rem] pt-5 pb-[1.1rem] shadow-[0_2px_12px_rgba(0,0,0,.07)] hover:shadow-[0_8px_28px_rgba(0,0,0,.13)] hover:-translate-y-0.5 transition-all duration-200"
    :class="debt.isCritical ? 'border-[1.5px] border-red-300 shadow-[0_2px_16px_rgba(248,113,113,.18)] hover:shadow-[0_8px_28px_rgba(248,113,113,.28)]' : 'border border-transparent'"
  >
    <!-- Row 1: network badge + interest rate -->
    <div class="flex items-start justify-between mb-[1.1rem]">
      <div class="flex flex-col items-start gap-1.5">
        <!-- VISA badge for credit cards, text badge for others -->
        <div v-if="debt.debtType === 'credit_card'" class="bg-[#1a1f71] rounded-md px-2.5 pt-1 pb-0 flex flex-col items-center w-[62px] overflow-hidden">
          <span class="text-white font-black italic text-lg leading-tight tracking-tighter">VISA</span>
          <div class="w-full h-[5px] bg-gradient-to-r from-[#f0a500] to-[#f5c842] mt-0.5"></div>
        </div>
        <div v-else class="rounded-[6px] px-[10px] py-[5px] text-[.72rem] font-bold tracking-[.3px]" :class="typeBadgeClass">
          {{ typeLabel }}
        </div>

        <span
          v-if="debt.isCritical"
          class="inline-flex items-center gap-1 text-[.7rem] font-bold text-[#dc2626] bg-[#fee2e2] rounded-full px-[8px] py-[2px] mt-1"
        >
          <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
          </svg>
          Crítica
        </span>
      </div>

      <span
        class="text-[1.05rem] font-extrabold px-[18px] py-[6px] rounded-full text-white"
        :class="debt.monthlyInterestRate > 3 ? 'bg-red-500 shadow-[0_3px_10px_rgba(239,68,68,.35)]' : 'bg-[#f43f75] shadow-[0_3px_10px_rgba(244,63,117,.35)]'"
      >
        {{ debt.monthlyInterestRate.toFixed(1) }}&thinsp;%
      </span>
    </div>

    <!-- Row 2: avatar + name -->
    <div class="flex items-center gap-4 mb-4">
      <div
        class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0"
        :style="{ background: avatarColor }"
      >
        {{ lenderInitial }}
      </div>
      <div class="min-w-0">
        <p class="font-extrabold text-[#1e293b] text-[1.05rem] leading-tight truncate">{{ debt.label }}</p>
        <p class="text-[.78rem] text-[#94a3b8] mt-0.5 truncate">{{ debt.lenderName }}</p>
      </div>
    </div>

    <!-- Row 3: amounts -->
    <div class="flex flex-col gap-[.45rem] mb-4">
      <div class="flex items-baseline justify-between">
        <span class="text-[.82rem] text-slate-500">Total Adeudado:</span>
        <span class="text-[.95rem] font-bold text-[#1e293b] tabular-nums">
          {{ formatCLP(debt.remainingBalance) }}<span class="text-[.72rem] text-[#94a3b8] font-medium ml-[3px]">CLP</span>
        </span>
      </div>
      <div class="flex items-baseline justify-between">
        <span class="text-[.82rem] text-slate-500">Cuota mínima:</span>
        <span class="text-[.95rem] font-bold text-[#1e293b] tabular-nums">
          {{ formatCLP(debt.minimumPayment) }}<span class="text-[.72rem] text-[#94a3b8] font-medium ml-[3px]">CLP</span>
        </span>
      </div>
    </div>

    <!-- Row 4: dates -->
    <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-500">
      <div class="flex items-center gap-1.5 text-[.8rem]">
        <svg class="w-4 h-4 text-[#f43f75] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Corte: <strong class="text-slate-700 ml-0.5">{{ debt.cutoffDay ?? '—' }}</strong>
      </div>
      <div class="flex items-center gap-1.5 text-[.8rem]">
        <svg class="w-4 h-4 text-[#f43f75] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Pagar Hasta los <strong class="text-slate-700 ml-0.5">{{ debt.paymentDueDay }}</strong>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DebtDTO } from '~/stores/debt';
import { useCurrency } from '~/composables/useCurrency';

const props = defineProps<{ debt: DebtDTO }>();
const { formatCLP } = useCurrency();

// Type badge (non credit_card)
const typeBadgeMap: Record<string, { label: string; class: string }> = {
  consumer_loan:   { label: 'Consumo',     class: 'bg-[#ede9fe] text-[#6d28d9]' },
  mortgage:        { label: 'Hipotecario', class: 'bg-[#d1fae5] text-[#065f46]' },
  informal_lender: { label: 'Informal',    class: 'bg-[#fef3c7] text-[#92400e]' },
};
const typeLabel     = computed(() => typeBadgeMap[props.debt.debtType]?.label ?? props.debt.debtType);
const typeBadgeClass = computed(() => typeBadgeMap[props.debt.debtType]?.class ?? 'bg-gray-100 text-gray-600');

// Avatar
const lenderInitial = computed(() =>
  (props.debt.lenderName || props.debt.label).charAt(0).toUpperCase()
);

const palette = [
  '#c4b5f4',                                      // lavender (matches mockup)
  'linear-gradient(135deg,#60a5fa,#6366f1)',
  'linear-gradient(135deg,#2dd4bf,#0ea5e9)',
  'linear-gradient(135deg,#fbbf24,#f97316)',
  'linear-gradient(135deg,#fb7185,#e11d48)',
  'linear-gradient(135deg,#34d399,#059669)',
];

const avatarColor = computed(() => {
  const n = props.debt.lenderName.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return palette[n % palette.length];
});
</script>
