import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { u as usePlanStore } from './plan-BO2V3g5d.mjs';
import { u as useStrategies } from './useStrategies-Cs1_uA0C.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'pinia';
import './useApi-VHnIxUUO.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "history",
  __ssrInlineRender: true,
  setup(__props) {
    const planStore = usePlanStore();
    const strategies = useStrategies();
    const plans = computed(() => planStore.planHistory);
    const loading = ref(true);
    const error = ref(null);
    function strategyName(strategy) {
      var _a, _b;
      return (_b = (_a = strategies.find((s) => s.id === strategy)) == null ? void 0 : _a.name) != null ? _b : strategy;
    }
    function statusLabel(status) {
      var _a;
      const labels = {
        active: "Activo",
        completed: "Completado",
        superseded: "Reemplazado"
      };
      return (_a = labels[status]) != null ? _a : status;
    }
    function statusClass(status) {
      var _a;
      const classes = {
        active: "bg-green-100 text-green-700",
        completed: "bg-blue-100 text-blue-700",
        superseded: "bg-gray-100 text-gray-600"
      };
      return (_a = classes[status]) != null ? _a : "bg-gray-100 text-gray-600";
    }
    function aiStatusLabel(status) {
      var _a;
      const labels = {
        success: "Completado",
        timeout: "Tiempo agotado",
        circuit_open: "No disponible"
      };
      return (_a = labels[status]) != null ? _a : status;
    }
    function aiStatusClass(status) {
      var _a;
      const classes = {
        success: "bg-blue-100 text-blue-700",
        timeout: "bg-yellow-100 text-yellow-700",
        circuit_open: "bg-red-100 text-red-700"
      };
      return (_a = classes[status]) != null ? _a : "bg-gray-100 text-gray-600";
    }
    function formatDate(isoDate) {
      return new Date(isoDate).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-bold text-gray-900">Historial de Planes</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/plan/strategy",
        class: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Nuevo Plan `);
          } else {
            return [
              createTextVNode(" Nuevo Plan ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(2, (i) => {
          _push(`<div class="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"><div class="space-y-2"><div class="h-4 w-36 bg-gray-200 rounded"></div><div class="h-3 w-24 bg-gray-100 rounded"></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(error)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(error))}</p>`);
      } else if (unref(plans).length === 0) {
        _push(`<div class="text-center py-16 text-gray-400"><p class="text-base">No tienes planes generados a\xFAn.</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/plan/strategy",
          class: "mt-4 inline-block text-sm text-blue-600 hover:text-blue-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Generar tu primer plan `);
            } else {
              return [
                createTextVNode(" Generar tu primer plan ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(plans), (plan) => {
          _push(`<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-3"><div class="flex items-start justify-between gap-3"><div class="space-y-1"><div class="flex items-center gap-2 flex-wrap"><h3 class="text-base font-semibold text-gray-900">${ssrInterpolate(strategyName(plan.strategy))}</h3><span class="${ssrRenderClass([statusClass(plan.status), "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"])}">${ssrInterpolate(statusLabel(plan.status))}</span></div><p class="text-xs text-gray-400"> Generado el ${ssrInterpolate(formatDate(plan.createdAt))}</p></div><div class="text-right text-sm text-gray-500 shrink-0">`);
          if (plan.totalMonths) {
            _push(`<!--[-->${ssrInterpolate(plan.totalMonths)} meses <!--]-->`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="flex items-center gap-2"><span class="${ssrRenderClass([aiStatusClass(plan.aiStatus), "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"])}"> IA: ${ssrInterpolate(aiStatusLabel(plan.aiStatus))}</span>`);
          if (plan.financialFreedomDate) {
            _push(`<span class="text-xs text-green-700 font-medium"> Libertad financiera: ${ssrInterpolate(formatDate(plan.financialFreedomDate))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/plan/history.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=history-KS32aDqM.mjs.map
