import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useDebt } from './useDebt-BqwciZML.mjs';
import { b as useRoute$1, u as useAuthStore } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import './debt-DEiAVWjq.mjs';
import 'pinia';
import './useApi-VHnIxUUO.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute$1();
    route.params.id;
    useDebt();
    const authStore = useAuthStore();
    const debt = ref(null);
    const loading = ref(true);
    const fetchError = ref("");
    const archiving = ref(false);
    const togglingShared = ref(false);
    const markingPaid = ref(false);
    const actionError = ref("");
    function formatCLP(amount) {
      return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(amount));
    }
    function debtTypeLabel(type) {
      const labels = {
        credit_card: "Tarjeta de Cr\xE9dito",
        consumer_loan: "Cr\xE9dito de Consumo",
        mortgage: "Hipotecario",
        informal_lender: "Deuda Informal"
      };
      return labels[type];
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}>`);
      if (unref(loading)) {
        _push(`<div class="text-sm text-gray-400">Cargando deuda...</div>`);
      } else if (unref(fetchError)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(fetchError))}</p>`);
      } else if (unref(debt)) {
        _push(`<!--[--><div class="flex items-start justify-between"><div><div class="flex items-center gap-2"><h1 class="text-2xl font-bold text-gray-900">${ssrInterpolate(unref(debt).label)}</h1><span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">${ssrInterpolate(debtTypeLabel(unref(debt).debtType))}</span></div><p class="text-sm text-gray-500 mt-1">${ssrInterpolate(unref(debt).lenderName)}</p></div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/debts/${unref(debt).id}/edit`,
          class: "px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Editar `);
            } else {
              return [
                createTextVNode(" Editar ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
        if (unref(debt).isCritical) {
          _push(`<div class="rounded-lg bg-red-50 border border-red-200 p-4"><p class="text-sm font-medium text-red-700"> Esta deuda est\xE1 marcada como cr\xEDtica. El presupuesto disponible puede ser insuficiente para cubrir los pagos m\xEDnimos. </p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100"><div class="grid grid-cols-2 gap-x-4 px-5 py-4"><div><p class="text-xs text-gray-400 uppercase tracking-wide">Monto original</p><p class="mt-1 text-sm font-semibold text-gray-900">${ssrInterpolate(formatCLP(unref(debt).originalBalance))}</p></div><div><p class="text-xs text-gray-400 uppercase tracking-wide">Saldo restante</p><p class="mt-1 text-sm font-semibold text-gray-900">${ssrInterpolate(formatCLP(unref(debt).remainingBalance))}</p></div></div><div class="grid grid-cols-2 gap-x-4 px-5 py-4"><div><p class="text-xs text-gray-400 uppercase tracking-wide">Tasa mensual</p><p class="mt-1 text-sm font-semibold text-gray-900">${ssrInterpolate(unref(debt).monthlyInterestRate)}%</p></div><div><p class="text-xs text-gray-400 uppercase tracking-wide">Cuota m\xEDnima</p><p class="mt-1 text-sm font-semibold text-gray-900">${ssrInterpolate(formatCLP(unref(debt).minimumPayment))}</p></div></div><div class="grid grid-cols-2 gap-x-4 px-5 py-4"><div><p class="text-xs text-gray-400 uppercase tracking-wide">D\xEDa de vencimiento</p><p class="mt-1 text-sm font-semibold text-gray-900">D\xEDa ${ssrInterpolate(unref(debt).paymentDueDay)}</p></div>`);
        if (unref(debt).cutoffDay) {
          _push(`<div><p class="text-xs text-gray-400 uppercase tracking-wide">D\xEDa de corte</p><p class="mt-1 text-sm font-semibold text-gray-900">D\xEDa ${ssrInterpolate(unref(debt).cutoffDay)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="px-5 py-4"><p class="text-xs text-gray-400 uppercase tracking-wide">Estado</p><p class="mt-1 text-sm font-semibold text-gray-900 capitalize">${ssrInterpolate(unref(debt).status)}</p></div></div><div class="space-y-3">`);
        if (unref(authStore).role === "owner") {
          _push(`<div class="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-5 py-4"><div><p class="text-sm font-medium text-gray-700">Deuda compartida</p><p class="text-xs text-gray-400">Visible para todos los miembros del espacio</p></div><button type="button" class="${ssrRenderClass([unref(debt).isShared ? "bg-blue-600" : "bg-gray-200", "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"])}"${ssrIncludeBooleanAttr(unref(togglingShared)) ? " disabled" : ""}><span class="${ssrRenderClass([unref(debt).isShared ? "translate-x-5" : "translate-x-0", "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200"])}"></span></button></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(debt).status === "active") {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/debts/${unref(debt).id}/pay`,
            class: "block w-full px-4 py-2.5 text-center text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Registrar Pago `);
              } else {
                return [
                  createTextVNode(" Registrar Pago ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(debt).status === "active") {
          _push(`<button type="button"${ssrIncludeBooleanAttr(unref(markingPaid)) ? " disabled" : ""} class="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">${ssrInterpolate(unref(markingPaid) ? "Marcando..." : "Marcar como pagada")}</button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(debt).status === "active") {
          _push(`<button type="button"${ssrIncludeBooleanAttr(unref(archiving)) ? " disabled" : ""} class="w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50">${ssrInterpolate(unref(archiving) ? "Archivando..." : "Archivar deuda")}</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(actionError)) {
          _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(actionError))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/debts/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-BY-cpMLb.mjs.map
