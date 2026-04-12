import { defineComponent, ref, reactive, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseEqual } from 'vue/server-renderer';
import { u as useProfile } from './useProfile-CKfpsJMw.mjs';
import './profile-CplTGXsv.mjs';
import 'pinia';
import './useApi-VHnIxUUO.mjs';
import './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

function useBudgetCalculator(input) {
  const effectiveIncome = computed(() => {
    return input.monthlyIncome.value > 0 ? input.monthlyIncome.value : input.monthlyAllocation.value;
  });
  const incomeSource = computed(() => {
    return input.monthlyIncome.value > 0 ? "salary" : "capital";
  });
  const totalFixedCosts = computed(() => {
    var _a, _b, _c, _d, _e;
    const exp = input.fixedExpenses.value;
    return ((_a = exp.rent) != null ? _a : 0) + ((_b = exp.utilities) != null ? _b : 0) + ((_c = exp.food) != null ? _c : 0) + ((_d = exp.transport) != null ? _d : 0) + ((_e = exp.other) != null ? _e : 0);
  });
  const netAfterExpenses = computed(() => {
    return effectiveIncome.value - totalFixedCosts.value;
  });
  const reserveAmount = computed(() => {
    return netAfterExpenses.value * input.reservePercentage.value / 100;
  });
  const availableBudget = computed(() => {
    const raw = netAfterExpenses.value - reserveAmount.value;
    return raw > 0 ? raw : 0;
  });
  return {
    effectiveIncome,
    incomeSource,
    totalFixedCosts,
    netAfterExpenses,
    reserveAmount,
    availableBudget
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "setup",
  __ssrInlineRender: true,
  setup(__props) {
    useProfile();
    const step = ref(1);
    const saving = ref(false);
    const error = ref("");
    const useCustomReserve = ref(false);
    const form = reactive({
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
    const totalExpenses = computed(() => {
      return form.fixedExpenses.rent + form.fixedExpenses.utilities + form.fixedExpenses.food + form.fixedExpenses.transport + form.fixedExpenses.other;
    });
    const monthlyIncomeRef = computed(() => form.monthlyIncome);
    computed(() => form.availableCapital);
    const monthlyAllocationRef = computed(() => form.monthlyAllocation);
    const fixedExpensesRef = computed(() => form.fixedExpenses);
    const reservePercentageRef = computed(() => form.reservePercentage);
    const { effectiveIncome, incomeSource, totalFixedCosts, netAfterExpenses, reserveAmount, availableBudget } = useBudgetCalculator({
      monthlyIncome: monthlyIncomeRef,
      monthlyAllocation: monthlyAllocationRef,
      fixedExpenses: fixedExpensesRef,
      reservePercentage: reservePercentageRef
    });
    function formatCLP(amount) {
      return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-xl mx-auto" }, _attrs))}><h1 class="text-2xl font-bold text-gray-900 mb-2">Configurar perfil financiero</h1><div class="flex gap-2 mb-8"><!--[-->`);
      ssrRenderList(5, (s) => {
        _push(`<div class="${ssrRenderClass([s <= unref(step) ? "bg-blue-600" : "bg-gray-200", "h-1.5 flex-1 rounded-full transition-colors"])}"></div>`);
      });
      _push(`<!--]--></div>`);
      if (unref(step) === 1) {
        _push(`<div class="space-y-4"><h2 class="text-lg font-semibold text-gray-800">Paso 1: Ingreso mensual</h2><div><label class="block text-sm font-medium text-gray-700">Ingreso mensual (CLP)</label><input${ssrRenderAttr("value", unref(form).monthlyIncome)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"><p class="mt-1 text-xs text-gray-500">Ingresa 0 si usar\xE1s capital disponible en lugar de ingresos.</p></div></div>`);
      } else if (unref(step) === 2) {
        _push(`<div class="space-y-4"><h2 class="text-lg font-semibold text-gray-800">Paso 2: Capital disponible</h2><div><label class="block text-sm font-medium text-gray-700">Capital disponible (CLP)</label><input${ssrRenderAttr("value", unref(form).availableCapital)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div>`);
        if (unref(form).monthlyIncome === 0) {
          _push(`<div><label class="block text-sm font-medium text-gray-700">Asignaci\xF3n mensual desde capital (CLP)</label><input${ssrRenderAttr("value", unref(form).monthlyAllocation)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"><p class="mt-1 text-xs text-gray-500">Monto mensual que destinar\xE1s desde tu capital para cubrir gastos y deudas.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (unref(step) === 3) {
        _push(`<div class="space-y-4"><h2 class="text-lg font-semibold text-gray-800">Paso 3: Gastos fijos mensuales</h2><div><label class="block text-sm font-medium text-gray-700">Arriendo / Hipoteca (CLP)</label><input${ssrRenderAttr("value", unref(form).fixedExpenses.rent)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label class="block text-sm font-medium text-gray-700">Servicios b\xE1sicos (CLP)</label><input${ssrRenderAttr("value", unref(form).fixedExpenses.utilities)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label class="block text-sm font-medium text-gray-700">Alimentaci\xF3n (CLP)</label><input${ssrRenderAttr("value", unref(form).fixedExpenses.food)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label class="block text-sm font-medium text-gray-700">Transporte (CLP)</label><input${ssrRenderAttr("value", unref(form).fixedExpenses.transport)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div><label class="block text-sm font-medium text-gray-700">Otros gastos fijos (CLP)</label><input${ssrRenderAttr("value", unref(form).fixedExpenses.other)} type="number" min="0" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0"></div><div class="pt-2 border-t border-gray-200"><p class="text-sm font-medium text-gray-700"> Total gastos fijos: <span class="font-bold text-gray-900">${ssrInterpolate(formatCLP(unref(totalExpenses)))}</span></p></div></div>`);
      } else if (unref(step) === 4) {
        _push(`<div class="space-y-4"><h2 class="text-lg font-semibold text-gray-800">Paso 4: Porcentaje de reserva</h2><p class="text-sm text-gray-500">Define qu\xE9 porcentaje de tu ingreso neto reservar\xE1s como fondo de emergencia.</p><div class="space-y-2"><!--[-->`);
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
      } else if (unref(step) === 5) {
        _push(`<div class="space-y-4"><h2 class="text-lg font-semibold text-gray-800">Paso 5: Resumen de tu presupuesto</h2><div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100"><div class="flex justify-between px-4 py-3 text-sm"><span class="text-gray-500">Fuente de ingresos</span><span class="font-medium text-gray-900">${ssrInterpolate(unref(incomeSource) === "salary" ? "Salario" : "Capital")}</span></div><div class="flex justify-between px-4 py-3 text-sm"><span class="text-gray-500">Ingreso efectivo</span><span class="font-medium text-gray-900">${ssrInterpolate(formatCLP(unref(effectiveIncome)))}</span></div><div class="flex justify-between px-4 py-3 text-sm"><span class="text-gray-500">Gastos fijos totales</span><span class="font-medium text-red-600">- ${ssrInterpolate(formatCLP(unref(totalFixedCosts)))}</span></div><div class="flex justify-between px-4 py-3 text-sm"><span class="text-gray-500">Neto tras gastos</span><span class="font-medium text-gray-900">${ssrInterpolate(formatCLP(unref(netAfterExpenses)))}</span></div><div class="flex justify-between px-4 py-3 text-sm"><span class="text-gray-500">Reserva (${ssrInterpolate(unref(form).reservePercentage)}%)</span><span class="font-medium text-yellow-600">- ${ssrInterpolate(formatCLP(unref(reserveAmount)))}</span></div><div class="flex justify-between px-4 py-3 text-sm bg-green-50"><span class="font-semibold text-gray-700">Presupuesto disponible</span><span class="font-bold text-green-700">${ssrInterpolate(formatCLP(unref(availableBudget)))}</span></div></div>`);
        if (unref(error)) {
          _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(error))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-8 flex justify-between">`);
      if (unref(step) > 1) {
        _push(`<button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"> Anterior </button>`);
      } else {
        _push(`<div></div>`);
      }
      if (unref(step) < 5) {
        _push(`<button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"> Siguiente </button>`);
      } else {
        _push(`<button type="button"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">${ssrInterpolate(unref(saving) ? "Guardando..." : "Guardar")}</button>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/profile/setup.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=setup-D6Othu4g.mjs.map
