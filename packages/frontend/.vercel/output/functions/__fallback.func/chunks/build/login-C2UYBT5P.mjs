import { a as __nuxt_component_0, n as navigateTo } from './server.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, reactive, ref, withCtx, unref, createTextVNode, createVNode, withModifiers, withDirectives, vModelText, openBlock, createBlock, toDisplayString, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useAuth } from './useAuth-DNnf0Fys.mjs';
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
import './useApi-VHnIxUUO.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const { login } = useAuth();
    const form = reactive({ email: "", password: "" });
    const error = ref("");
    const loading = ref(false);
    async function handleLogin() {
      error.value = "";
      loading.value = true;
      try {
        await login(form.email, form.password);
        const pendingToken = sessionStorage.getItem("pendingInviteToken");
        if (pendingToken) {
          sessionStorage.removeItem("pendingInviteToken");
          navigateTo(`/invite/${pendingToken}`);
        } else {
          navigateTo("/dashboard");
        }
      } catch (err) {
        if (err && typeof err === "object" && "data" in err) {
          const data = err.data;
          error.value = data.error === "INVALID_CREDENTIALS" ? "Email o contrase\xF1a incorrectos" : "Error al iniciar sesi\xF3n";
        } else {
          error.value = "Error al iniciar sesi\xF3n";
        }
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
            _push2(`<h2 class="text-xl font-semibold text-gray-900 mb-6"${_scopeId}>Iniciar sesi\xF3n</h2><form class="space-y-4"${_scopeId}><div${_scopeId}><label for="email" class="block text-sm font-medium text-gray-700"${_scopeId}>Email</label><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"${_scopeId}></div><div${_scopeId}><label for="password" class="block text-sm font-medium text-gray-700"${_scopeId}>Contrase\xF1a</label><input id="password"${ssrRenderAttr("value", unref(form).password)} type="password" required minlength="8" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"${_scopeId}></div>`);
            if (unref(error)) {
              _push2(`<p class="text-sm text-red-600"${_scopeId}>${ssrInterpolate(unref(error))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"${_scopeId}>${ssrInterpolate(unref(loading) ? "Ingresando..." : "Ingresar")}</button></form><div class="mt-4 flex justify-between text-sm"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/register",
              class: "text-blue-600 hover:underline"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Crear cuenta`);
                } else {
                  return [
                    createTextVNode("Crear cuenta")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/forgot-password",
              class: "text-blue-600 hover:underline"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Olvid\xE9 mi contrase\xF1a`);
                } else {
                  return [
                    createTextVNode("Olvid\xE9 mi contrase\xF1a")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              createVNode("h2", { class: "text-xl font-semibold text-gray-900 mb-6" }, "Iniciar sesi\xF3n"),
              createVNode("form", {
                class: "space-y-4",
                onSubmit: withModifiers(handleLogin, ["prevent"])
              }, [
                createVNode("div", null, [
                  createVNode("label", {
                    for: "email",
                    class: "block text-sm font-medium text-gray-700"
                  }, "Email"),
                  withDirectives(createVNode("input", {
                    id: "email",
                    "onUpdate:modelValue": ($event) => unref(form).email = $event,
                    type: "email",
                    required: "",
                    class: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).email]
                  ])
                ]),
                createVNode("div", null, [
                  createVNode("label", {
                    for: "password",
                    class: "block text-sm font-medium text-gray-700"
                  }, "Contrase\xF1a"),
                  withDirectives(createVNode("input", {
                    id: "password",
                    "onUpdate:modelValue": ($event) => unref(form).password = $event,
                    type: "password",
                    required: "",
                    minlength: "8",
                    class: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(form).password]
                  ])
                ]),
                unref(error) ? (openBlock(), createBlock("p", {
                  key: 0,
                  class: "text-sm text-red-600"
                }, toDisplayString(unref(error)), 1)) : createCommentVNode("", true),
                createVNode("button", {
                  type: "submit",
                  disabled: unref(loading),
                  class: "w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                }, toDisplayString(unref(loading) ? "Ingresando..." : "Ingresar"), 9, ["disabled"])
              ], 32),
              createVNode("div", { class: "mt-4 flex justify-between text-sm" }, [
                createVNode(_component_NuxtLink, {
                  to: "/register",
                  class: "text-blue-600 hover:underline"
                }, {
                  default: withCtx(() => [
                    createTextVNode("Crear cuenta")
                  ]),
                  _: 1
                }),
                createVNode(_component_NuxtLink, {
                  to: "/forgot-password",
                  class: "text-blue-600 hover:underline"
                }, {
                  default: withCtx(() => [
                    createTextVNode("Olvid\xE9 mi contrase\xF1a")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-C2UYBT5P.mjs.map
