import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, computed, ref, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
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
    const debtStore = useDebtStore();
    const debts = computed(() => debtStore.debts);
    const loading = computed(() => debtStore.loading);
    const error = computed(() => debtStore.error);
    const tabs = [
      { label: "Activas", value: "active" },
      { label: "Pagadas", value: "paid_off" },
      { label: "Archivadas", value: "frozen" }
    ];
    const activeTab = ref("active");
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-bold text-gray-900">Mis Deudas</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/debts/new",
        class: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Nueva Deuda `);
          } else {
            return [
              createTextVNode(" Nueva Deuda ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex gap-1 border-b border-gray-200"><!--[-->`);
      ssrRenderList(tabs, (tab) => {
        _push(`<button class="${ssrRenderClass([
          unref(activeTab) === tab.value ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700",
          "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        ])}">${ssrInterpolate(tab.label)}</button>`);
      });
      _push(`<!--]--></div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(3, (i) => {
          _push(`<div class="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"><div class="flex justify-between"><div class="space-y-2"><div class="h-4 w-40 bg-gray-200 rounded"></div><div class="h-3 w-28 bg-gray-100 rounded"></div></div><div class="text-right space-y-2"><div class="h-4 w-24 bg-gray-200 rounded ml-auto"></div><div class="h-3 w-16 bg-gray-100 rounded ml-auto"></div></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(error)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(error))}</p>`);
      } else if (unref(debts).length === 0) {
        _push(`<div class="text-center py-16 text-gray-400"><p class="text-base">${ssrInterpolate(unref(activeTab) === "active" ? "No tienes deudas activas" : unref(activeTab) === "paid_off" ? "No tienes deudas pagadas" : "No tienes deudas archivadas")}</p>`);
        if (unref(activeTab) === "active") {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/debts/new",
            class: "mt-4 inline-block text-sm text-blue-600 hover:text-blue-700"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Registrar tu primera deuda `);
              } else {
                return [
                  createTextVNode(" Registrar tu primera deuda ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(debts), (debt) => {
          _push(`<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer hover:border-gray-300 transition-colors"><div class="flex items-start justify-between"><div><div class="flex items-center gap-2"><h3 class="text-base font-semibold text-gray-900">${ssrInterpolate(debt.label)}</h3>`);
          if (debt.isCritical) {
            _push(`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"> Cr\xEDtica </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><p class="text-sm text-gray-500 mt-0.5">${ssrInterpolate(debt.lenderName)} \xB7 ${ssrInterpolate(debtTypeLabel(debt.debtType))}</p></div><div class="text-right"><p class="text-base font-bold text-gray-900">${ssrInterpolate(formatCLP(debt.remainingBalance))}</p><p class="text-xs text-gray-400 mt-0.5">saldo restante</p></div></div><div class="mt-3 flex gap-6 text-xs text-gray-500"><span>Tasa: ${ssrInterpolate(debt.monthlyInterestRate)}% mensual</span><span>Cuota m\xEDnima: ${ssrInterpolate(formatCLP(debt.minimumPayment))}</span></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/debts/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BZ2djMi8.mjs.map
