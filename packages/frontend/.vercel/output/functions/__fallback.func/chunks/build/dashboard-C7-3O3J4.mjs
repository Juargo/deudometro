import { defineComponent, ref, resolveComponent, mergeProps, unref, computed, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList } from 'vue/server-renderer';
import { u as usePaymentStore } from './payment-BzRX-Lks.mjs';
import { u as useAuthStore } from './server.mjs';
import { u as useDebtStore } from './debt-DEiAVWjq.mjs';
import { u as usePlanStore } from './plan-BO2V3g5d.mjs';
import 'pinia';
import './useApi-VHnIxUUO.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "UpcomingAlerts",
  __ssrInlineRender: true,
  setup(__props) {
    const paymentStore = usePaymentStore();
    const alerts = computed(() => paymentStore.alerts);
    function formatCLP(value) {
      return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(value));
    }
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(alerts).length > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-3" }, _attrs))}><h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide">Alertas de pago pr\xF3ximo</h2><ul class="space-y-2"><!--[-->`);
        ssrRenderList(unref(alerts), (alert) => {
          _push(`<li class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between"><div><p class="text-sm font-semibold text-amber-900">${ssrInterpolate(alert.label)}</p><p class="text-xs text-amber-700 mt-0.5"> Vence en ${ssrInterpolate(alert.daysUntilDue === 0 ? "hoy" : `${alert.daysUntilDue} d\xEDa${alert.daysUntilDue === 1 ? "" : "s"}`)}</p></div><div class="text-right"><p class="text-sm font-bold text-amber-900">${ssrInterpolate(formatCLP(alert.minimumPayment))}</p><p class="text-xs text-amber-600">cuota m\xEDnima</p></div></li>`);
        });
        _push(`<!--]--></ul></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/UpcomingAlerts.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const authStore = useAuthStore();
    const debtStore = useDebtStore();
    usePlanStore();
    const loading = ref(true);
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_UpcomingAlerts = _sfc_main$1;
      const _component_FinancialSummaryMetrics = resolveComponent("FinancialSummaryMetrics");
      const _component_DeudometroGauge = resolveComponent("DeudometroGauge");
      const _component_FreedomDateCard = resolveComponent("FreedomDateCard");
      const _component_DebtCardList = resolveComponent("DebtCardList");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div><h1 class="text-2xl font-bold text-gray-900"> Hola, ${ssrInterpolate((_a = unref(authStore).user) == null ? void 0 : _a.displayName)}</h1><p class="text-sm text-gray-500 mt-1">${ssrInterpolate((_b = unref(authStore).financialSpace) == null ? void 0 : _b.name)} \xB7 <span class="capitalize">${ssrInterpolate(unref(authStore).role)}</span></p></div>`);
      _push(ssrRenderComponent(_component_UpcomingAlerts, null, null, _parent));
      if (unref(loading)) {
        _push(`<div class="space-y-4"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="h-28 bg-gray-100 rounded-lg animate-pulse"></div><div class="h-28 bg-gray-100 rounded-lg animate-pulse"></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="h-64 bg-gray-100 rounded-lg animate-pulse"></div><div class="h-64 bg-gray-100 rounded-lg animate-pulse"></div></div></div>`);
      } else {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_FinancialSummaryMetrics, null, null, _parent));
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`);
        _push(ssrRenderComponent(_component_DeudometroGauge, {
          progress: unref(debtStore).payoffProgress
        }, null, _parent));
        _push(ssrRenderComponent(_component_FreedomDateCard, null, null, _parent));
        _push(`</div>`);
        _push(ssrRenderComponent(_component_DebtCardList, null, null, _parent));
        _push(`<!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-C7-3O3J4.mjs.map
