import { defineComponent, computed, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useStrategies } from './useStrategies-Cs1_uA0C.mjs';
import { u as useDebtStore } from './debt-DEiAVWjq.mjs';
import { u as usePlanStore } from './plan-BO2V3g5d.mjs';
import { u as useProfileStore } from './profile-CplTGXsv.mjs';
import { u as useCurrency } from './useCurrency-BsHzhGz3.mjs';
import 'pinia';
import './useApi-VHnIxUUO.mjs';
import './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "strategy",
  __ssrInlineRender: true,
  setup(__props) {
    const strategies = useStrategies();
    const debtStore = useDebtStore();
    const planStore = usePlanStore();
    const profileStore = useProfileStore();
    const { formatCLP } = useCurrency();
    const hasCriticalDebts = computed(() => debtStore.criticalDebts.length > 0);
    const selectedStrategy = ref(null);
    const isGenerating = computed(() => planStore.isGenerating);
    const error = ref("");
    const budget = computed(() => profileStore.budget);
    const budgetLoading = computed(() => profileStore.loading);
    const activeDebtsCount = computed(() => debtStore.debts.filter((d) => d.status === "active").length);
    const colorSelected = {
      blue: "border-blue-500 bg-blue-50",
      green: "border-green-500 bg-green-50",
      purple: "border-purple-500 bg-purple-50",
      red: "border-red-500 bg-red-50",
      orange: "border-orange-500 bg-orange-50"
    };
    const colorBar = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
      orange: "bg-orange-500"
    };
    const colorDot = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
      orange: "bg-orange-500"
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-3xl mx-auto space-y-6" }, _attrs))}><div><h1 class="text-2xl font-bold text-gray-900">Elige tu estrategia de pago</h1><p class="mt-1 text-sm text-gray-500">Selecciona c\xF3mo quieres atacar tus deudas.</p></div>`);
      if (unref(budgetLoading)) {
        _push(`<div class="text-sm text-gray-500">Cargando presupuesto...</div>`);
      } else if (unref(budget)) {
        _push(`<div class="rounded-lg border border-gray-200 bg-white p-5 space-y-3"><h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Resumen de presupuesto</h2><div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm"><div><span class="text-gray-500">Ingreso efectivo</span><p class="font-semibold text-gray-900">${ssrInterpolate(unref(formatCLP)(unref(budget).effectiveIncome))}</p></div><div><span class="text-gray-500">Gastos fijos</span><p class="font-semibold text-gray-900">${ssrInterpolate(unref(formatCLP)(unref(budget).totalFixedCosts))}</p></div><div><span class="text-gray-500">Reserva</span><p class="font-semibold text-gray-900">${ssrInterpolate(unref(formatCLP)(unref(budget).reserveAmount))}</p></div><div><span class="text-gray-500">Cuotas minimas</span><p class="font-semibold text-gray-900">${ssrInterpolate(unref(budget).minimumPaymentsTotal != null ? unref(formatCLP)(unref(budget).minimumPaymentsTotal) : "-")}</p></div><div><span class="text-gray-500">Deudas activas</span><p class="font-semibold text-gray-900">${ssrInterpolate(unref(activeDebtsCount))}</p></div><div><span class="text-gray-500">Disponible para deudas</span><p class="${ssrRenderClass([unref(budget).availableBudget > 0 ? "text-green-600" : "text-red-600", "font-semibold"])}">${ssrInterpolate(unref(formatCLP)(unref(budget).availableBudget))}</p></div></div>`);
        if (unref(budget).budgetWarning) {
          _push(`<div class="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"><svg class="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path></svg> El presupuesto disponible es menor a la suma de cuotas minimas. Revisa tu perfil financiero. </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><!--[-->`);
      ssrRenderList(unref(strategies), (strategy) => {
        _push(`<button type="button" class="${ssrRenderClass([[
          unref(selectedStrategy) === strategy.id ? colorSelected[strategy.color] : "border-gray-200 bg-white hover:border-gray-300"
        ], "relative text-left p-5 rounded-lg border-2 transition-all focus:outline-none"])}">`);
        if (strategy.id === "crisis_first" && unref(hasCriticalDebts)) {
          _push(`<span class="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700"> \xA1Recomendado! </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="${ssrRenderClass([colorBar[strategy.color], "w-8 h-1 rounded-full mb-3"])}"></div><h3 class="text-base font-semibold text-gray-900">${ssrInterpolate(strategy.name)}</h3><p class="mt-1 text-sm text-gray-500">${ssrInterpolate(strategy.description)}</p>`);
        if (unref(selectedStrategy) === strategy.id) {
          _push(`<div class="${ssrRenderClass([colorDot[strategy.color], "absolute top-3 left-3 w-3 h-3 rounded-full"])}"></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(error)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex justify-end pt-2"><button type="button"${ssrIncludeBooleanAttr(!unref(selectedStrategy) || unref(isGenerating)) ? " disabled" : ""} class="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">${ssrInterpolate(unref(isGenerating) ? "Generando..." : "Generar Plan")}</button></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/plan/strategy.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=strategy-B788vU7a.mjs.map
