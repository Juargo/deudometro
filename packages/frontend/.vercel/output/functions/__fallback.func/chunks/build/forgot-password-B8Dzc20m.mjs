import { a as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, withCtx, unref, createTextVNode, createVNode, openBlock, createBlock, withModifiers, withDirectives, isRef, vModelText, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate } from 'vue/server-renderer';
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
  __name: "forgot-password",
  __ssrInlineRender: true,
  setup(__props) {
    const { forgotPassword } = useAuth();
    const email = ref("");
    const sent = ref(false);
    const loading = ref(false);
    async function handleSubmit() {
      loading.value = true;
      try {
        await forgotPassword(email.value);
      } finally {
        sent.value = true;
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
            _push2(`<h2 class="text-xl font-semibold text-gray-900 mb-6"${_scopeId}>Recuperar contrase\xF1a</h2>`);
            if (!unref(sent)) {
              _push2(`<form class="space-y-4"${_scopeId}><div${_scopeId}><label for="email" class="block text-sm font-medium text-gray-700"${_scopeId}>Email</label><input id="email"${ssrRenderAttr("value", unref(email))} type="email" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"${_scopeId}></div><button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"${_scopeId}>${ssrInterpolate(unref(loading) ? "Enviando..." : "Enviar instrucciones")}</button></form>`);
            } else {
              _push2(`<div class="text-center space-y-4"${_scopeId}><p class="text-sm text-gray-600"${_scopeId}> Si el email est\xE1 registrado, recibir\xE1s instrucciones para restablecer tu contrase\xF1a. </p></div>`);
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
              createVNode("h2", { class: "text-xl font-semibold text-gray-900 mb-6" }, "Recuperar contrase\xF1a"),
              !unref(sent) ? (openBlock(), createBlock("form", {
                key: 0,
                class: "space-y-4",
                onSubmit: withModifiers(handleSubmit, ["prevent"])
              }, [
                createVNode("div", null, [
                  createVNode("label", {
                    for: "email",
                    class: "block text-sm font-medium text-gray-700"
                  }, "Email"),
                  withDirectives(createVNode("input", {
                    id: "email",
                    "onUpdate:modelValue": ($event) => isRef(email) ? email.value = $event : null,
                    type: "email",
                    required: "",
                    class: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  }, null, 8, ["onUpdate:modelValue"]), [
                    [vModelText, unref(email)]
                  ])
                ]),
                createVNode("button", {
                  type: "submit",
                  disabled: unref(loading),
                  class: "w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                }, toDisplayString(unref(loading) ? "Enviando..." : "Enviar instrucciones"), 9, ["disabled"])
              ], 32)) : (openBlock(), createBlock("div", {
                key: 1,
                class: "text-center space-y-4"
              }, [
                createVNode("p", { class: "text-sm text-gray-600" }, " Si el email est\xE1 registrado, recibir\xE1s instrucciones para restablecer tu contrase\xF1a. ")
              ])),
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/forgot-password.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=forgot-password-B8Dzc20m.mjs.map
