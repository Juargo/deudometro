import { c as useNuxtApp, a as __nuxt_component_0, n as navigateTo } from './server.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, withCtx, unref, createTextVNode, createVNode, openBlock, createBlock, withModifiers, withDirectives, isRef, vModelText, toDisplayString, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
  __name: "reset-password",
  __ssrInlineRender: true,
  setup(__props) {
    const { $supabase } = useNuxtApp();
    const password = ref("");
    const confirmPassword = ref("");
    const error = ref("");
    const success = ref(false);
    const loading = ref(false);
    const checkingSession = ref(true);
    const hasRecoverySession = ref(false);
    async function handleReset() {
      error.value = "";
      if (password.value !== confirmPassword.value) {
        error.value = "Las contrase\xF1as no coinciden";
        return;
      }
      if (password.value.length < 8) {
        error.value = "La contrase\xF1a debe tener al menos 8 caracteres";
        return;
      }
      loading.value = true;
      try {
        const { error: updateError } = await $supabase.auth.updateUser({ password: password.value });
        if (updateError) {
          error.value = updateError.message || "Error al actualizar la contrase\xF1a";
          return;
        }
        success.value = true;
        setTimeout(() => navigateTo("/login"), 2e3);
      } catch {
        error.value = "Error al restablecer la contrase\xF1a. Intenta de nuevo.";
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLayout = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_NuxtLayout, { name: "auth" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h2 class="text-xl font-semibold text-gray-900 mb-6"${_scopeId}>Nueva contrase\xF1a</h2>`);
            if (unref(checkingSession)) {
              _push2(`<div class="text-sm text-gray-500 text-center py-4"${_scopeId}> Verificando enlace de recuperaci\xF3n... </div>`);
            } else if (!unref(hasRecoverySession)) {
              _push2(`<div class="space-y-4"${_scopeId}><div class="rounded-lg bg-red-50 border border-red-200 p-4"${_scopeId}><p class="text-sm text-red-700"${_scopeId}> El enlace de recuperaci\xF3n no es v\xE1lido o ha expirado. Solicita un nuevo enlace. </p></div>`);
              _push2(ssrRenderComponent(_component_NuxtLink, {
                to: "/forgot-password",
                class: "block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Solicitar nuevo enlace `);
                  } else {
                    return [
                      createTextVNode(" Solicitar nuevo enlace ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label for="password" class="block text-sm font-medium text-gray-700"${_scopeId}>Nueva contrase\xF1a</label><input id="password"${ssrRenderAttr("value", unref(password))} type="password" required minlength="8" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="M\xEDnimo 8 caracteres"${_scopeId}></div><div${_scopeId}><label for="confirmPassword" class="block text-sm font-medium text-gray-700"${_scopeId}>Confirmar contrase\xF1a</label><input id="confirmPassword"${ssrRenderAttr("value", unref(confirmPassword))} type="password" required minlength="8" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Repite la contrase\xF1a"${_scopeId}></div>`);
              if (unref(error)) {
                _push2(`<p class="text-sm text-red-600"${_scopeId}>${ssrInterpolate(unref(error))}</p>`);
              } else {
                _push2(`<!---->`);
              }
              if (unref(success)) {
                _push2(`<p class="text-sm text-green-600"${_scopeId}>Contrase\xF1a actualizada. Redirigiendo al login...</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<button type="submit"${ssrIncludeBooleanAttr(unref(loading) || unref(success)) ? " disabled" : ""} class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"${_scopeId}>${ssrInterpolate(unref(loading) ? "Actualizando..." : "Actualizar contrase\xF1a")}</button></form>`);
            }
            _push2(`<div class="mt-4 text-sm text-center"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/login",
              class: "text-blue-600 hover:underline"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Volver al login`);
                } else {
                  return [
                    createTextVNode("Volver al login")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("h2", { class: "text-xl font-semibold text-gray-900 mb-6" }, "Nueva contrase\xF1a"),
              unref(checkingSession) ? (openBlock(), createBlock("div", {
                key: 0,
                class: "text-sm text-gray-500 text-center py-4"
              }, " Verificando enlace de recuperaci\xF3n... ")) : !unref(hasRecoverySession) ? (openBlock(), createBlock("div", {
                key: 1,
                class: "space-y-4"
              }, [
                createVNode("div", { class: "rounded-lg bg-red-50 border border-red-200 p-4" }, [
                  createVNode("p", { class: "text-sm text-red-700" }, " El enlace de recuperaci\xF3n no es v\xE1lido o ha expirado. Solicita un nuevo enlace. ")
                ]),
                createVNode(_component_NuxtLink, {
                  to: "/forgot-password",
                  class: "block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                }, {
                  default: withCtx(() => [
                    createTextVNode(" Solicitar nuevo enlace ")
                  ]),
                  _: 1
                })
              ])) : (openBlock(), createBlock("form", {
                key: 2,
                class: "space-y-4",
                onSubmit: withModifiers(handleReset, ["prevent"])
              }, [
                createVNode("div", null, [
                  createVNode("label", {
                    for: "password",
                    class: "block text-sm font-medium text-gray-700"
                  }, "Nueva contrase\xF1a"),
                  withDirectives(createVNode("input", {
                    id: "password",
                    "onUpdate:modelValue": ($event) => isRef(password) ? password.value = $event : null,
                    type: "password",
                    required: "",
                    minlength: "8",
                    class: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                    placeholder: "M\xEDnimo 8 caracteres"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(password)]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", {
                    for: "confirmPassword",
                    class: "block text-sm font-medium text-gray-700"
                  }, "Confirmar contrase\xF1a"),
                  withDirectives(createVNode("input", {
                    id: "confirmPassword",
                    "onUpdate:modelValue": ($event) => isRef(confirmPassword) ? confirmPassword.value = $event : null,
                    type: "password",
                    required: "",
                    minlength: "8",
                    class: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                    placeholder: "Repite la contrase\xF1a"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(confirmPassword)]
                  ])
                ]),
                unref(error) ? (openBlock(), createBlock("p", {
                  key: 0,
                  class: "text-sm text-red-600"
                }, toDisplayString(unref(error)), 1)) : createCommentVNode("", true),
                unref(success) ? (openBlock(), createBlock("p", {
                  key: 1,
                  class: "text-sm text-green-600"
                }, "Contrase\xF1a actualizada. Redirigiendo al login...")) : createCommentVNode("", true),
                createVNode("button", {
                  type: "submit",
                  disabled: unref(loading) || unref(success),
                  class: "w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                }, toDisplayString(unref(loading) ? "Actualizando..." : "Actualizar contrase\xF1a"), 9, ["disabled"])
              ], 32)),
              createVNode("div", { class: "mt-4 text-sm text-center" }, [
                createVNode(_component_NuxtLink, {
                  to: "/login",
                  class: "text-blue-600 hover:underline"
                }, {
                  default: withCtx(() => [
                    createTextVNode("Volver al login")
                  ]),
                  _: 1
                })
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/reset-password.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=reset-password-B5dECy60.mjs.map
