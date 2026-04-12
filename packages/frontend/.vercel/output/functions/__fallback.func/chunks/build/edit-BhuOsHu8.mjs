import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, reactive, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderComponent, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useDebt } from './useDebt-BqwciZML.mjs';
import { b as useRoute$1 } from './server.mjs';
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
  __name: "edit",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute$1();
    const debtId = route.params.id;
    useDebt();
    const debt = ref(null);
    const fetchLoading = ref(true);
    const fetchError = ref("");
    const saving = ref(false);
    const error = ref("");
    const form = reactive({
      label: "",
      lenderName: "",
      remainingBalance: 0,
      monthlyInterestRate: 0,
      minimumPayment: 0,
      paymentDueDay: 1,
      cutoffDay: void 0
    });
    function formatCLP(amount) {
      return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(amount));
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-xl mx-auto space-y-6" }, _attrs))}><h1 class="text-2xl font-bold text-gray-900">Editar Deuda</h1>`);
      if (unref(fetchLoading)) {
        _push(`<div class="text-sm text-gray-400">Cargando deuda...</div>`);
      } else if (unref(fetchError)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(fetchError))}</p>`);
      } else {
        _push(`<form class="space-y-5"><div><label class="block text-sm font-medium text-gray-700">Monto original (CLP)</label><input${ssrRenderAttr("value", formatCLP((_b = (_a = unref(debt)) == null ? void 0 : _a.originalBalance) != null ? _b : 0))} type="text" disabled class="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 cursor-not-allowed"></div><div><label class="block text-sm font-medium text-gray-700">Nombre / etiqueta</label><input${ssrRenderAttr("value", unref(form).label)} type="text" maxlength="100" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div><div><label class="block text-sm font-medium text-gray-700">Acreedor / entidad</label><input${ssrRenderAttr("value", unref(form).lenderName)} type="text" maxlength="100" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div><div><label class="block text-sm font-medium text-gray-700">Saldo restante (CLP)</label><input${ssrRenderAttr("value", unref(form).remainingBalance)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div><div><label class="block text-sm font-medium text-gray-700">Tasa de inter\xE9s mensual (%)</label><input${ssrRenderAttr("value", unref(form).monthlyInterestRate)} type="number" min="0" max="99.9999" step="0.01" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div><div><label class="block text-sm font-medium text-gray-700">Cuota m\xEDnima (CLP)</label><input${ssrRenderAttr("value", unref(form).minimumPayment)} type="number" min="1" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div><div><label class="block text-sm font-medium text-gray-700">D\xEDa de vencimiento del pago</label><input${ssrRenderAttr("value", unref(form).paymentDueDay)} type="number" min="1" max="31" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>`);
        if (((_c = unref(debt)) == null ? void 0 : _c.debtType) === "credit_card") {
          _push(`<div><label class="block text-sm font-medium text-gray-700">D\xEDa de corte</label><input${ssrRenderAttr("value", unref(form).cutoffDay)} type="number" min="1" max="31" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(error)) {
          _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(error))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-3 pt-2">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/debts/${unref(debtId)}`,
          class: "flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-center"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Cancelar `);
            } else {
              return [
                createTextVNode(" Cancelar ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<button type="submit"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">${ssrInterpolate(unref(saving) ? "Guardando..." : "Guardar cambios")}</button></div></form>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/debts/[id]/edit.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=edit-BhuOsHu8.mjs.map
