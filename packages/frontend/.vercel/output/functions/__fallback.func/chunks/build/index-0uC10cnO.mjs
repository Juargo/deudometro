import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as usePaymentStore } from './payment-BzRX-Lks.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const paymentStore = usePaymentStore();
    const acknowledging = ref(null);
    const milestoneTypeMap = {
      first_payment: { label: "Primer pago", classes: "bg-blue-100 text-blue-800" },
      debt_paid_off: { label: "Deuda pagada", classes: "bg-green-100 text-green-800" },
      total_reduced_25pct: { label: "25% reducido", classes: "bg-amber-100 text-amber-800" },
      total_reduced_50pct: { label: "50% reducido", classes: "bg-orange-100 text-orange-800" },
      total_reduced_75pct: { label: "75% reducido", classes: "bg-emerald-100 text-emerald-800" },
      plan_on_track: { label: "Plan al d\xEDa", classes: "bg-purple-100 text-purple-800" }
    };
    function typeLabel(type) {
      var _a, _b;
      return (_b = (_a = milestoneTypeMap[type]) == null ? void 0 : _a.label) != null ? _b : type;
    }
    function badgeClass(type) {
      var _a, _b;
      return (_b = (_a = milestoneTypeMap[type]) == null ? void 0 : _a.classes) != null ? _b : "bg-gray-100 text-gray-800";
    }
    function formatDate(dateStr) {
      return new Intl.DateTimeFormat("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(dateStr));
    }
    const sortedMilestones = computed(
      () => [...paymentStore.milestones].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><h1 class="text-2xl font-bold text-gray-900">Mis Logros</h1>`);
      if (unref(paymentStore).loading) {
        _push(`<div class="text-sm text-gray-400">Cargando logros...</div>`);
      } else if (unref(paymentStore).error) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(paymentStore).error)}</p>`);
      } else {
        _push(`<!--[-->`);
        if (unref(sortedMilestones).length === 0) {
          _push(`<div class="text-center py-16 bg-white rounded-lg border border-gray-200"><p class="text-gray-500 text-sm">No tienes logros a\xFAn. \xA1Registra tu primer pago!</p>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/debts",
            class: "mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Ver deudas `);
              } else {
                return [
                  createTextVNode(" Ver deudas ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else {
          _push(`<div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100"><!--[-->`);
          ssrRenderList(unref(sortedMilestones), (milestone) => {
            _push(`<div class="${ssrRenderClass([!milestone.acknowledgedAt ? "bg-blue-50" : "", "flex items-start gap-4 px-5 py-4"])}"><span class="${ssrRenderClass([badgeClass(milestone.milestoneType), "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap mt-0.5 flex-shrink-0"])}">${ssrInterpolate(typeLabel(milestone.milestoneType))}</span><div class="flex-1 min-w-0"><p class="text-sm text-gray-800">${ssrInterpolate(milestone.message)}</p><p class="text-xs text-gray-400 mt-0.5">${ssrInterpolate(formatDate(milestone.createdAt))}</p></div><div class="flex-shrink-0">`);
            if (!milestone.acknowledgedAt) {
              _push(`<button type="button"${ssrIncludeBooleanAttr(unref(acknowledging) === milestone.id) ? " disabled" : ""} class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50">${ssrInterpolate(unref(acknowledging) === milestone.id ? "..." : "Aceptar")}</button>`);
            } else {
              _push(`<span class="text-xs text-gray-400">Visto</span>`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`<!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/milestones/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-0uC10cnO.mjs.map
