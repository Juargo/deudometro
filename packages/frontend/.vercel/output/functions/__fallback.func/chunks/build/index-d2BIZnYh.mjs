import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, computed, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrIncludeBooleanAttr, ssrRenderList } from 'vue/server-renderer';
import { u as usePlanStore } from './plan-BO2V3g5d.mjs';
import { u as useStrategies } from './useStrategies-Cs1_uA0C.mjs';
import { b as useRoute$1 } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'pinia';
import './useApi-VHnIxUUO.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

function usePlanView() {
  const planStore = usePlanStore();
  const actions = computed(() => planStore.activePlanActions);
  const actionsByMonth = computed(() => {
    const grouped = {};
    for (const action of actions.value) {
      if (!grouped[action.month]) {
        grouped[action.month] = [];
      }
      grouped[action.month].push(action);
    }
    return grouped;
  });
  const attackOrder = computed(() => {
    var _a;
    const month1Actions = (_a = actionsByMonth.value[1]) != null ? _a : [];
    const seen = /* @__PURE__ */ new Set();
    const ordered = [];
    let orderNum = 1;
    for (const action of month1Actions) {
      if (!seen.has(action.debtId)) {
        seen.add(action.debtId);
        ordered.push({ debtId: action.debtId, debtLabel: action.debtLabel, order: orderNum++ });
      }
    }
    return ordered;
  });
  function formatCLP(amount) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(amount));
  }
  function formatMonth(month) {
    var _a;
    if (!((_a = planStore.activePlan) == null ? void 0 : _a.createdAt)) return `Mes ${month}`;
    const base = new Date(planStore.activePlan.createdAt);
    const target = new Date(base.getFullYear(), base.getMonth() + month - 1, 1);
    return target.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  }
  function formatFreedomDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  }
  return {
    actionsByMonth,
    attackOrder,
    formatCLP,
    formatMonth,
    formatFreedomDate
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const planStore = usePlanStore();
    const { actionsByMonth, attackOrder, formatCLP, formatMonth, formatFreedomDate } = usePlanView();
    const route = useRoute$1();
    const aiPending = computed(() => route.query.aiPending === "true");
    const plan = computed(() => planStore.activePlan);
    const loading = ref(true);
    const fetchError = ref(null);
    const retrying = ref(false);
    const strategies = useStrategies();
    const strategyName = computed(() => {
      var _a, _b;
      if (!plan.value) return "";
      return (_b = (_a = strategies.find((s) => s.id === plan.value.strategy)) == null ? void 0 : _a.name) != null ? _b : plan.value.strategy;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-8" }, _attrs))}>`);
      if (unref(aiPending)) {
        _push(`<div class="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"><svg class="w-5 h-5 mt-0.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>El an\xE1lisis de IA est\xE1 pendiente. Puede tomar unos minutos adicionales. Puedes reintentar m\xE1s tarde.</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-start justify-between"><div><h1 class="text-2xl font-bold text-gray-900">Plan de Pagos</h1>`);
      if (unref(plan)) {
        _push(`<p class="mt-1 text-sm text-gray-500"> Estrategia: <span class="font-medium">${ssrInterpolate(unref(strategyName))}</span> \xB7 ${ssrInterpolate(unref(plan).totalMonths)} meses </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/plan/history",
        class: "text-sm text-blue-600 hover:text-blue-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Ver historial `);
          } else {
            return [
              createTextVNode(" Ver historial ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="text-sm text-gray-400">Cargando plan...</div>`);
      } else if (unref(fetchError)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(fetchError))}</p>`);
      } else if (unref(plan)) {
        _push(`<!--[--><section class="bg-white rounded-lg border border-gray-200 p-5 space-y-3"><h2 class="text-base font-semibold text-gray-900">Resumen de IA</h2>`);
        if ((_a = unref(plan).aiAnalysis) == null ? void 0 : _a.summary) {
          _push(`<!--[--><p class="text-sm text-gray-700">${ssrInterpolate(unref(plan).aiAnalysis.summary)}</p>`);
          if (unref(plan).aiAnalysis.strategy_rationale) {
            _push(`<p class="text-sm text-gray-500 italic">${ssrInterpolate(unref(plan).aiAnalysis.strategy_rationale)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        } else {
          _push(`<!--[--><p class="text-sm text-gray-400">Resumen de IA pendiente...</p><button type="button"${ssrIncludeBooleanAttr(unref(retrying)) ? " disabled" : ""} class="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50">${ssrInterpolate(unref(retrying) ? "Reintentando..." : "Reintentar")}</button><!--]-->`);
        }
        _push(`</section><section class="bg-white rounded-lg border border-gray-200 p-5 space-y-2"><h2 class="text-base font-semibold text-gray-900">Enfoque mensual</h2>`);
        if ((_b = unref(plan).aiAnalysis) == null ? void 0 : _b.monthly_focus) {
          _push(`<p class="text-sm text-gray-700">${ssrInterpolate(unref(plan).aiAnalysis.monthly_focus)}</p>`);
        } else {
          _push(`<p class="text-sm text-gray-400">Informaci\xF3n pendiente...</p>`);
        }
        _push(`</section>`);
        if ((_d = (_c = unref(plan).aiAnalysis) == null ? void 0 : _c.critical_alerts) == null ? void 0 : _d.length) {
          _push(`<section class="space-y-2"><h2 class="text-base font-semibold text-gray-900">Alertas cr\xEDticas</h2><!--[-->`);
          ssrRenderList(unref(plan).aiAnalysis.critical_alerts, (alert, idx) => {
            _push(`<div class="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"><svg class="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path></svg> ${ssrInterpolate(alert)}</div>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="bg-white rounded-lg border border-gray-200 p-5 space-y-3"><h2 class="text-base font-semibold text-gray-900">Orden de ataque</h2><p class="text-xs text-gray-400">Deudas priorizadas seg\xFAn la estrategia seleccionada.</p><ol class="space-y-2"><!--[-->`);
        ssrRenderList(unref(attackOrder), (item) => {
          _push(`<li class="flex items-center gap-3"><span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">${ssrInterpolate(item.order)}</span><span class="text-sm text-gray-800">${ssrInterpolate(item.debtLabel)}</span></li>`);
        });
        _push(`<!--]--></ol>`);
        if (unref(attackOrder).length === 0) {
          _push(`<p class="text-sm text-gray-400">Sin datos de acciones a\xFAn.</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section>`);
        if (unref(plan).financialFreedomDate) {
          _push(`<section class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center space-y-1"><p class="text-sm font-medium text-green-700">Libre de deudas en</p><p class="text-3xl font-bold text-green-800">${ssrInterpolate(unref(formatFreedomDate)(unref(plan).financialFreedomDate))}</p></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_f = (_e = unref(plan).aiAnalysis) == null ? void 0 : _e.key_milestones) == null ? void 0 : _f.length) {
          _push(`<section class="space-y-3"><h2 class="text-base font-semibold text-gray-900">Hitos clave</h2><div class="space-y-2"><!--[-->`);
          ssrRenderList(unref(plan).aiAnalysis.key_milestones, (milestone, idx) => {
            _push(`<div class="flex items-start gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg"><span class="flex-shrink-0 text-xs font-semibold text-gray-400 pt-0.5 w-14">Mes ${ssrInterpolate(milestone.month)}</span><div><p class="text-sm font-medium text-gray-900">${ssrInterpolate(milestone.event)}</p><p class="text-xs text-gray-500">${ssrInterpolate(milestone.message)}</p></div></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="space-y-3"><h2 class="text-base font-semibold text-gray-900">Timeline mensual</h2><div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(actionsByMonth), (monthActions, month) => {
          _push(`<details class="bg-white border border-gray-200 rounded-lg"><summary class="px-5 py-3 cursor-pointer text-sm font-medium text-gray-800 flex items-center justify-between list-none"><span>${ssrInterpolate(unref(formatMonth)(Number(month)))}</span><span class="text-xs text-gray-400">${ssrInterpolate(monthActions.length)} pago(s)</span></summary><div class="border-t border-gray-100 divide-y divide-gray-50"><!--[-->`);
          ssrRenderList(monthActions, (action) => {
            _push(`<div class="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600"><div><p class="text-gray-400">Deuda</p><p class="font-medium text-gray-800">${ssrInterpolate(action.debtLabel)}</p></div><div><p class="text-gray-400">Pago</p><p class="font-medium">${ssrInterpolate(unref(formatCLP)(action.paymentAmount))}</p></div><div><p class="text-gray-400">Capital / Inter\xE9s</p><p class="font-medium">${ssrInterpolate(unref(formatCLP)(action.principalAmount))} / ${ssrInterpolate(unref(formatCLP)(action.interestAmount))}</p></div><div><p class="text-gray-400">Saldo restante</p><p class="font-medium">${ssrInterpolate(unref(formatCLP)(action.remainingBalance))}</p></div></div>`);
          });
          _push(`<!--]--></div></details>`);
        });
        _push(`<!--]--></div>`);
        if (Object.keys(unref(actionsByMonth)).length === 0) {
          _push(`<p class="text-sm text-gray-400">Sin acciones generadas a\xFAn.</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/plan/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-d2BIZnYh.mjs.map
