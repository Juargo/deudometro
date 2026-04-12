import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { u as usePaymentStore } from './payment-BzRX-Lks.mjs';
import { u as useDebtStore } from './debt-DEiAVWjq.mjs';
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
    const debtStore = useDebtStore();
    const selectedDebtId = ref("");
    function formatCLP(value) {
      return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(value));
    }
    function formatDate(iso) {
      return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-bold text-gray-900">Historial de Pagos</h1></div><div class="flex items-center gap-3"><label for="debtFilter" class="text-sm font-medium text-gray-700">Filtrar por deuda:</label><select id="debtFilter" class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(selectedDebtId)) ? ssrLooseContain(unref(selectedDebtId), "") : ssrLooseEqual(unref(selectedDebtId), "")) ? " selected" : ""}>Todas las deudas</option><!--[-->`);
      ssrRenderList(unref(debtStore).debts, (debt) => {
        _push(`<option${ssrRenderAttr("value", debt.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedDebtId)) ? ssrLooseContain(unref(selectedDebtId), debt.id) : ssrLooseEqual(unref(selectedDebtId), debt.id)) ? " selected" : ""}>${ssrInterpolate(debt.label)}</option>`);
      });
      _push(`<!--]--></select></div>`);
      if (unref(paymentStore).loading) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-10 bg-gray-100 rounded animate-pulse"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(paymentStore).error) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(paymentStore).error)}</p>`);
      } else if (unref(paymentStore).payments.length === 0) {
        _push(`<div class="text-center py-12 text-gray-400"><p class="text-base">No hay pagos registrados aun.</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/debts",
          class: "mt-4 inline-block text-sm text-blue-600 hover:text-blue-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Ir a mis deudas para registrar un pago `);
            } else {
              return [
                createTextVNode(" Ir a mis deudas para registrar un pago ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="bg-white rounded-lg border border-gray-200 overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Deuda</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Monto</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Capital</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Inter\xE9s</th></tr></thead><tbody class="divide-y divide-gray-100"><!--[-->`);
        ssrRenderList(unref(paymentStore).payments, (payment) => {
          var _a;
          _push(`<tr class="hover:bg-gray-50"><td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">${ssrInterpolate(formatDate(payment.paidAt))}</td><td class="px-4 py-3 text-sm text-gray-700">${ssrInterpolate((_a = payment.debtLabel) != null ? _a : payment.debtId)}</td><td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">${ssrInterpolate(formatCLP(payment.amount))}</td><td class="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">${ssrInterpolate(formatCLP(payment.principalAmount))}</td><td class="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">${ssrInterpolate(formatCLP(payment.interestAmount))}</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/payments/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DiTdAiV4.mjs.map
