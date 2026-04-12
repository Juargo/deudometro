import { _ as __nuxt_component_0 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, reactive, computed, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseEqual } from 'vue/server-renderer';
import { u as useProfile } from './useProfile-CKfpsJMw.mjs';
import { u as useCurrency } from './useCurrency-BsHzhGz3.mjs';
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
import './profile-CplTGXsv.mjs';
import './useApi-VHnIxUUO.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "edit",
  __ssrInlineRender: true,
  setup(__props) {
    useProfile();
    const { formatCLP } = useCurrency();
    const loadingProfile = ref(true);
    const fetchError = ref("");
    const saving = ref(false);
    const saveError = ref("");
    const useCustomReserve = ref(false);
    const form = reactive({
      displayName: "",
      monthlyIncome: 0,
      availableCapital: 0,
      monthlyAllocation: 0,
      fixedExpenses: {
        rent: 0,
        utilities: 0,
        food: 0,
        transport: 0,
        other: 0
      },
      reservePercentage: 10
    });
    const totalExpenses = computed(
      () => form.fixedExpenses.rent + form.fixedExpenses.utilities + form.fixedExpenses.food + form.fixedExpenses.transport + form.fixedExpenses.other
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-xl mx-auto space-y-6" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-bold text-gray-900">Editar perfil</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/dashboard",
        class: "px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
      _push(`</div>`);
      if (unref(loadingProfile)) {
        _push(`<div class="text-sm text-gray-400">Cargando perfil...</div>`);
      } else if (unref(fetchError)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(fetchError))}</p>`);
      } else {
        _push(`<form class="space-y-6"><div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4"><h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informaci\xF3n personal</h2><div><label for="displayName" class="block text-sm font-medium text-gray-700">Nombre</label><input id="displayName"${ssrRenderAttr("value", unref(form).displayName)} type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Tu nombre"></div></div><div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4"><h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ingresos y capital</h2><div><label for="monthlyIncome" class="block text-sm font-medium text-gray-700">Ingreso mensual (CLP)</label><input id="monthlyIncome"${ssrRenderAttr("value", unref(form).monthlyIncome)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"><p class="mt-1 text-xs text-gray-500">Ingresa 0 si usar\xE1s capital disponible en lugar de ingresos.</p></div><div><label for="availableCapital" class="block text-sm font-medium text-gray-700">Capital disponible (CLP)</label><input id="availableCapital"${ssrRenderAttr("value", unref(form).availableCapital)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div>`);
        if (unref(form).monthlyIncome === 0) {
          _push(`<div><label for="monthlyAllocation" class="block text-sm font-medium text-gray-700">Asignaci\xF3n mensual desde capital (CLP)</label><input id="monthlyAllocation"${ssrRenderAttr("value", unref(form).monthlyAllocation)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"><p class="mt-1 text-xs text-gray-500">Monto mensual que destinar\xE1s desde tu capital.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4"><h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Gastos fijos mensuales</h2><div><label for="rent" class="block text-sm font-medium text-gray-700">Arriendo / Hipoteca (CLP)</label><input id="rent"${ssrRenderAttr("value", unref(form).fixedExpenses.rent)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label for="food" class="block text-sm font-medium text-gray-700">Alimentaci\xF3n (CLP)</label><input id="food"${ssrRenderAttr("value", unref(form).fixedExpenses.food)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label for="transport" class="block text-sm font-medium text-gray-700">Transporte (CLP)</label><input id="transport"${ssrRenderAttr("value", unref(form).fixedExpenses.transport)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label for="utilities" class="block text-sm font-medium text-gray-700">Servicios b\xE1sicos (CLP)</label><input id="utilities"${ssrRenderAttr("value", unref(form).fixedExpenses.utilities)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label for="other" class="block text-sm font-medium text-gray-700">Otros gastos fijos (CLP)</label><input id="other"${ssrRenderAttr("value", unref(form).fixedExpenses.other)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div class="pt-2 border-t border-gray-100"><p class="text-sm text-gray-600"> Total gastos fijos: <span class="font-bold text-gray-900">${ssrInterpolate(unref(formatCLP)(unref(totalExpenses)))}</span></p></div></div><div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4"><h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Porcentaje de reserva</h2><p class="text-sm text-gray-500">Porcentaje de tu ingreso neto que reservar\xE1s como fondo de emergencia.</p><div class="space-y-2"><!--[-->`);
        ssrRenderList([10, 20, 30], (option) => {
          _push(`<label class="${ssrRenderClass([unref(form).reservePercentage === option && !unref(useCustomReserve) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300", "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"])}"><input${ssrIncludeBooleanAttr(ssrLooseEqual(unref(form).reservePercentage, option)) ? " checked" : ""} type="radio"${ssrRenderAttr("value", option)} class="text-blue-600"><span class="text-sm font-medium text-gray-700">${ssrInterpolate(option)}%</span></label>`);
        });
        _push(`<!--]--><label class="${ssrRenderClass([unref(useCustomReserve) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300", "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"])}"><input${ssrIncludeBooleanAttr(ssrLooseEqual(unref(useCustomReserve), true)) ? " checked" : ""} type="radio"${ssrRenderAttr("value", true)} class="text-blue-600"><span class="text-sm font-medium text-gray-700">Personalizado</span></label></div>`);
        if (unref(useCustomReserve)) {
          _push(`<div><label class="block text-sm font-medium text-gray-700">Porcentaje de reserva (0\u201350%)</label><input${ssrRenderAttr("value", unref(form).reservePercentage)} type="number" min="0" max="50" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(saveError)) {
          _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(saveError))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-3"><button type="submit"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">${ssrInterpolate(unref(saving) ? "Guardando..." : "Guardar cambios")}</button>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/dashboard",
          class: "flex-1 px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
        _push(`</div></form>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/profile/edit.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=edit-BYP-Ihlv.mjs.map
