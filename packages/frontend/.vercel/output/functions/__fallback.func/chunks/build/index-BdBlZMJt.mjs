import { defineComponent, computed, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useAuthStore } from './server.mjs';
import { u as useApi } from './useApi-VHnIxUUO.mjs';
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
import 'pinia';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const authStore = useAuthStore();
    useApi();
    const isOwner = computed(() => authStore.role === "owner");
    const statusLabels = {
      pending: "Pendiente",
      accepted: "Aceptada",
      revoked: "Revocada",
      expired: "Expirada"
    };
    const space = ref(null);
    const members = ref([]);
    const invitations = ref([]);
    const loadingSpace = ref(true);
    const loadingInvitations = ref(true);
    const inviteEmail = ref("");
    const inviting = ref(false);
    const inviteError = ref("");
    const inviteSuccess = ref("");
    const revoking = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-2xl mx-auto space-y-6" }, _attrs))}><h1 class="text-2xl font-bold text-gray-900">Espacio Financiero</h1>`);
      if (unref(space)) {
        _push(`<div class="bg-white rounded-lg border border-gray-200 p-5"><p class="text-sm text-gray-500">Espacio</p><p class="text-lg font-semibold text-gray-900">${ssrInterpolate(unref(space).name)}</p><p class="text-sm text-gray-500 mt-1">Moneda: ${ssrInterpolate(unref(space).currency)}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4"><h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Miembros</h2>`);
      if (unref(loadingSpace)) {
        _push(`<div class="text-sm text-gray-500">Cargando...</div>`);
      } else if (unref(members).length) {
        _push(`<ul class="divide-y divide-gray-100"><!--[-->`);
        ssrRenderList(unref(members), (member) => {
          _push(`<li class="flex items-center justify-between py-3"><div><p class="text-sm font-medium text-gray-900">${ssrInterpolate(member.displayName)}</p><p class="text-xs text-gray-500">${ssrInterpolate(member.email)}</p></div><span class="${ssrRenderClass([member.role === "owner" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700", "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"])}">${ssrInterpolate(member.role === "owner" ? "Propietario" : "Editor")}</span></li>`);
        });
        _push(`<!--]--></ul>`);
      } else {
        _push(`<p class="text-sm text-gray-500">No hay miembros.</p>`);
      }
      _push(`</div>`);
      if (unref(isOwner)) {
        _push(`<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4"><h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Invitaciones</h2><form class="flex gap-2"><input${ssrRenderAttr("value", unref(inviteEmail))} type="email" required placeholder="email@ejemplo.com" class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><button type="submit"${ssrIncludeBooleanAttr(unref(inviting)) ? " disabled" : ""} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">${ssrInterpolate(unref(inviting) ? "Enviando..." : "Invitar")}</button></form>`);
        if (unref(inviteError)) {
          _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(inviteError))}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(inviteSuccess)) {
          _push(`<p class="text-sm text-green-600">${ssrInterpolate(unref(inviteSuccess))}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(loadingInvitations)) {
          _push(`<div class="text-sm text-gray-500">Cargando invitaciones...</div>`);
        } else if (unref(invitations).length) {
          _push(`<ul class="divide-y divide-gray-100"><!--[-->`);
          ssrRenderList(unref(invitations), (inv) => {
            _push(`<li class="flex items-center justify-between py-3"><div><p class="text-sm font-medium text-gray-900">${ssrInterpolate(inv.email)}</p><p class="text-xs text-gray-500"> Estado: <span class="${ssrRenderClass([{
              "text-amber-600": inv.status === "pending",
              "text-green-600": inv.status === "accepted",
              "text-red-600": inv.status === "revoked" || inv.status === "expired"
            }, "font-medium"])}">${ssrInterpolate(statusLabels[inv.status] || inv.status)}</span></p></div>`);
            if (inv.status === "pending") {
              _push(`<button class="text-sm text-red-600 hover:text-red-800"${ssrIncludeBooleanAttr(unref(revoking) === inv.id) ? " disabled" : ""}>${ssrInterpolate(unref(revoking) === inv.id ? "Revocando..." : "Revocar")}</button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</li>`);
          });
          _push(`<!--]--></ul>`);
        } else {
          _push(`<p class="text-sm text-gray-500">No hay invitaciones pendientes.</p>`);
        }
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/space/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BdBlZMJt.mjs.map
