import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, computed, ref, reactive, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderComponent } from 'vue/server-renderer';
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
  __name: "new",
  __ssrInlineRender: true,
  setup(__props) {
    const debtStore = useDebtStore();
    const loading = computed(() => debtStore.loading);
    const error = ref("");
    const clpFormatter = new Intl.NumberFormat("es-CL");
    function formatInputCLP(value) {
      if (!value) return "";
      return clpFormatter.format(value);
    }
    const debtTypeInfoMap = {
      credit_card: {
        title: "Tarjeta de Credito",
        items: [
          "Monto de la deuda: saldo utilizado actual de la tarjeta",
          "Tasa de interes: tasa mensual que cobra tu banco (rotativa)",
          "Cuota minima: pago minimo que aparece en tu estado de cuenta",
          "Dia de corte: dia del mes en que se cierra tu periodo de facturacion"
        ]
      },
      consumer_loan: {
        title: "Credito de Consumo",
        items: [
          "Monto de la deuda: saldo pendiente del credito (no el monto original)",
          "Tasa de interes: tasa mensual del credito (revisa tu contrato o cartola)",
          "Cuota minima: valor de la cuota fija mensual"
        ]
      },
      mortgage: {
        title: "Credito Hipotecario",
        items: [
          "Monto de la deuda: saldo insoluto (capital pendiente)",
          "Tasa de interes: tasa mensual (la tasa anual dividida por 12)",
          "Cuota minima: dividendo mensual que pagas"
        ]
      }
    };
    const debtTypeInfo = computed(() => {
      if (!form.debtType || !(form.debtType in debtTypeInfoMap)) return null;
      return debtTypeInfoMap[form.debtType];
    });
    const form = reactive({
      debtType: "",
      label: "",
      lenderName: "",
      balance: 0,
      monthlyInterestRate: 0,
      minimumPayment: 0,
      paymentDueDay: 1,
      cutoffDay: void 0,
      isShared: false,
      hasInterest: false,
      urgency: ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-xl mx-auto space-y-6" }, _attrs))}><h1 class="text-2xl font-bold text-gray-900">Nueva Deuda</h1><form class="space-y-5"><div><label class="block text-sm font-medium text-gray-700">Tipo de deuda</label><select required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><option value="" disabled${ssrIncludeBooleanAttr(Array.isArray(unref(form).debtType) ? ssrLooseContain(unref(form).debtType, "") : ssrLooseEqual(unref(form).debtType, "")) ? " selected" : ""}>Selecciona un tipo</option><option value="credit_card"${ssrIncludeBooleanAttr(Array.isArray(unref(form).debtType) ? ssrLooseContain(unref(form).debtType, "credit_card") : ssrLooseEqual(unref(form).debtType, "credit_card")) ? " selected" : ""}>Tarjeta de Cr\xE9dito</option><option value="consumer_loan"${ssrIncludeBooleanAttr(Array.isArray(unref(form).debtType) ? ssrLooseContain(unref(form).debtType, "consumer_loan") : ssrLooseEqual(unref(form).debtType, "consumer_loan")) ? " selected" : ""}>Cr\xE9dito de Consumo</option><option value="mortgage"${ssrIncludeBooleanAttr(Array.isArray(unref(form).debtType) ? ssrLooseContain(unref(form).debtType, "mortgage") : ssrLooseEqual(unref(form).debtType, "mortgage")) ? " selected" : ""}>Hipotecario</option><option value="informal_lender"${ssrIncludeBooleanAttr(Array.isArray(unref(form).debtType) ? ssrLooseContain(unref(form).debtType, "informal_lender") : ssrLooseEqual(unref(form).debtType, "informal_lender")) ? " selected" : ""}>Deuda Informal</option></select>`);
      if (unref(debtTypeInfo)) {
        _push(`<div class="mt-2 flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800"><svg class="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path></svg><div><p class="font-medium">${ssrInterpolate(unref(debtTypeInfo).title)}</p><ul class="mt-1 list-disc list-inside space-y-0.5 text-blue-700"><!--[-->`);
        ssrRenderList(unref(debtTypeInfo).items, (item) => {
          _push(`<li>${ssrInterpolate(item)}</li>`);
        });
        _push(`<!--]--></ul></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm font-medium text-gray-700">Nombre / etiqueta</label><input${ssrRenderAttr("value", unref(form).label)} type="text" required maxlength="100" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ej: Tarjeta Banco Chile"></div><div><label class="block text-sm font-medium text-gray-700">Acreedor / entidad</label><input${ssrRenderAttr("value", unref(form).lenderName)} type="text" required maxlength="100" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ej: Banco Chile"></div><div><label class="block text-sm font-medium text-gray-700">Monto de la deuda (CLP)</label><div class="relative mt-1"><span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">$</span><input${ssrRenderAttr("value", formatInputCLP(unref(form).balance))} type="text" inputmode="numeric" required class="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div></div><div><label class="block text-sm font-medium text-gray-700">Tasa de inter\xE9s mensual (%)</label><input${ssrRenderAttr("value", unref(form).monthlyInterestRate)} type="number" required min="0" max="99.9999" step="0.01" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&amp;::-webkit-outer-spin-button]:appearance-none [&amp;::-webkit-inner-spin-button]:appearance-none" placeholder="0.00"></div><div><label class="block text-sm font-medium text-gray-700">Cuota m\xEDnima (CLP)</label><div class="relative mt-1"><span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">$</span><input${ssrRenderAttr("value", formatInputCLP(unref(form).minimumPayment))} type="text" inputmode="numeric" required class="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div></div><div><label class="block text-sm font-medium text-gray-700">D\xEDa de vencimiento del pago</label><input${ssrRenderAttr("value", unref(form).paymentDueDay)} type="number" required min="1" max="31" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="1\u201331"></div>`);
      if (unref(form).debtType === "credit_card") {
        _push(`<div><label class="block text-sm font-medium text-gray-700">D\xEDa de corte</label><input${ssrRenderAttr("value", unref(form).cutoffDay)} type="number" min="1" max="31" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="1\u201331"></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(form).debtType === "informal_lender") {
        _push(`<div class="space-y-4"><div class="flex items-center gap-3"><input id="hasInterest"${ssrIncludeBooleanAttr(Array.isArray(unref(form).hasInterest) ? ssrLooseContain(unref(form).hasInterest, null) : unref(form).hasInterest) ? " checked" : ""} type="checkbox" class="rounded border-gray-300 text-blue-600"><label for="hasInterest" class="text-sm font-medium text-gray-700">\xBFCobra intereses?</label></div><div><label class="block text-sm font-medium text-gray-700">Urgencia</label><select class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(form).urgency) ? ssrLooseContain(unref(form).urgency, "") : ssrLooseEqual(unref(form).urgency, "")) ? " selected" : ""}>Sin especificar</option><option value="low"${ssrIncludeBooleanAttr(Array.isArray(unref(form).urgency) ? ssrLooseContain(unref(form).urgency, "low") : ssrLooseEqual(unref(form).urgency, "low")) ? " selected" : ""}>Baja</option><option value="medium"${ssrIncludeBooleanAttr(Array.isArray(unref(form).urgency) ? ssrLooseContain(unref(form).urgency, "medium") : ssrLooseEqual(unref(form).urgency, "medium")) ? " selected" : ""}>Media</option><option value="high"${ssrIncludeBooleanAttr(Array.isArray(unref(form).urgency) ? ssrLooseContain(unref(form).urgency, "high") : ssrLooseEqual(unref(form).urgency, "high")) ? " selected" : ""}>Alta</option></select></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-center gap-3"><input id="isShared"${ssrIncludeBooleanAttr(Array.isArray(unref(form).isShared) ? ssrLooseContain(unref(form).isShared, null) : unref(form).isShared) ? " checked" : ""} type="checkbox" class="rounded border-gray-300 text-blue-600"><label for="isShared" class="text-sm font-medium text-gray-700">Deuda compartida (visible para todos los miembros)</label></div>`);
      if (unref(error)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex gap-3 pt-2">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/debts",
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
      _push(`<button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">${ssrInterpolate(unref(loading) ? "Guardando..." : "Crear deuda")}</button></div></form></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/debts/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=new-CZXG7OGu.mjs.map
