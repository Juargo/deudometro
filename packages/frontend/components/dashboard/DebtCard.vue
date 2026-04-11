<template>
  <NuxtLink
    :to="`/debts/${debt.id}`"
    class="block bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
    :class="debt.isCritical ? 'border-red-300' : 'border-gray-200'"
  >
    <div class="flex items-center justify-between mb-2">
      <h4 class="font-medium text-gray-900 truncate">{{ debt.label }}</h4>
      <div class="flex items-center gap-1.5">
        <span
          v-if="debt.isCritical"
          class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium"
        >
          Cr&iacute;tica
        </span>
        <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="typeClass">
          {{ typeLabel }}
        </span>
      </div>
    </div>
    <p class="text-xs text-gray-500 mb-3">{{ debt.lenderName }}</p>
    <div class="flex items-baseline justify-between">
      <p class="text-lg font-bold text-gray-900">{{ formatCLP(debt.remainingBalance) }}</p>
      <p class="text-xs text-gray-400">
        Cuota m&iacute;n. {{ formatCLP(debt.minimumPayment) }} &middot; D&iacute;a {{ debt.paymentDueDay }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DebtDTO } from '~/stores/debt';
import { useCurrency } from '~/composables/useCurrency';

const props = defineProps<{ debt: DebtDTO }>();
const { formatCLP } = useCurrency();

const typeMap: Record<string, { label: string; class: string }> = {
  credit_card: { label: 'Tarjeta', class: 'bg-blue-100 text-blue-700' },
  consumer_loan: { label: 'Consumo', class: 'bg-purple-100 text-purple-700' },
  mortgage: { label: 'Hipotecario', class: 'bg-green-100 text-green-700' },
  informal_lender: { label: 'Informal', class: 'bg-amber-100 text-amber-700' },
};

const typeLabel = computed(() => typeMap[props.debt.debtType]?.label ?? props.debt.debtType);
const typeClass = computed(() => typeMap[props.debt.debtType]?.class ?? 'bg-gray-100 text-gray-700');
</script>
