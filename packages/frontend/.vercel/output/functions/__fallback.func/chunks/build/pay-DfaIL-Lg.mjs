import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderTeleport, ssrRenderList } from 'vue/server-renderer';
import { u as usePaymentStore } from './payment-BzRX-Lks.mjs';
import { u as useDebt } from './useDebt-BqwciZML.mjs';
import { b as useRoute$1, n as navigateTo } from './server.mjs';
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
import './debt-DEiAVWjq.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "MilestoneCelebration",
  __ssrInlineRender: true,
  props: {
    milestones: {},
    visible: { type: Boolean }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    usePaymentStore();
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.visible) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 text-center"><div class="text-5xl mb-4">\u{1F389}</div><h2 class="text-2xl font-bold text-gray-900 mb-2">\xA1Felicidades!</h2><p class="text-sm text-gray-500 mb-6">Alcanzaste un nuevo hito en tu camino libre de deudas.</p><ul class="space-y-3 mb-8"><!--[-->`);
          ssrRenderList(__props.milestones, (milestone) => {
            _push2(`<li class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 font-medium">${ssrInterpolate(milestone.message)}</li>`);
          });
          _push2(`<!--]--></ul><button type="button" class="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"> \xA1Seguir adelante! </button></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/MilestoneCelebration.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "pay",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute$1();
    const debtId = route.params.id;
    useDebt();
    const paymentStore = usePaymentStore();
    const debt = ref(null);
    const amount = ref(null);
    const paidAt = ref("");
    const submitting = ref(false);
    const submitError = ref("");
    const showMilestones = ref(false);
    function formatCLP(value) {
      return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(value));
    }
    crypto.randomUUID();
    async function handleMilestoneClose() {
      showMilestones.value = false;
      await navigateTo(`/debts/${debtId}`);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_MilestoneCelebration = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6 max-w-lg mx-auto" }, _attrs))}><div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: `/debts/${unref(debtId)}`,
        class: "text-gray-400 hover:text-gray-600"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` \u2190 Volver `);
          } else {
            return [
              createTextVNode(" \u2190 Volver ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 class="text-2xl font-bold text-gray-900">Registrar Pago</h1></div>`);
      if (unref(debt)) {
        _push(`<div class="bg-white rounded-lg border border-gray-200 px-5 py-4 space-y-1"><p class="text-sm font-medium text-gray-700">${ssrInterpolate(unref(debt).label)}</p><p class="text-xs text-gray-400"> Saldo restante: <span class="font-semibold text-gray-800">${ssrInterpolate(formatCLP(unref(debt).remainingBalance))}</span></p><p class="text-xs text-gray-400"> Cuota m\xEDnima: <span class="font-semibold text-gray-800">${ssrInterpolate(formatCLP(unref(debt).minimumPayment))}</span></p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(submitError)) {
        _push(`<div class="rounded-lg bg-red-50 border border-red-200 p-4"><p class="text-sm text-red-700">${ssrInterpolate(unref(submitError))}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="bg-white rounded-lg border border-gray-200 p-6 space-y-5"><div><label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Monto</label><div class="relative"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><input id="amount"${ssrRenderAttr("value", unref(amount))} type="number" min="1" step="1" required placeholder="0" class="block w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div></div><div><label for="paidAt" class="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label><input id="paidAt"${ssrRenderAttr("value", unref(paidAt))} type="date" required class="block w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><button type="submit"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} class="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">${ssrInterpolate(unref(submitting) ? "Registrando..." : "Registrar Pago")}</button></form>`);
      _push(ssrRenderComponent(_component_MilestoneCelebration, {
        milestones: unref(paymentStore).lastMilestones,
        visible: unref(showMilestones),
        onClose: handleMilestoneClose
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/debts/[id]/pay.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=pay-DfaIL-Lg.mjs.map
