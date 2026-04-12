import { b as useRoute$1, u as useAuthStore, a as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-BATwXca9.mjs';
import { defineComponent, ref, withCtx, unref, createTextVNode, createVNode, openBlock, createBlock, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
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
  __name: "[token]",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute$1();
    useAuthStore();
    useApi();
    const loading = ref(true);
    const success = ref(false);
    const errorMessage = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLayout = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_NuxtLayout, { name: "auth" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="text-center space-y-4"${_scopeId}>`);
            if (unref(loading)) {
              _push2(`<div${_scopeId}><p class="text-gray-600"${_scopeId}>Aceptando invitaci\xF3n...</p></div>`);
            } else if (unref(success)) {
              _push2(`<div${_scopeId}><p class="text-green-600 font-medium"${_scopeId}>Te has unido al espacio financiero</p><p class="text-sm text-gray-500 mt-2"${_scopeId}>Redirigiendo al dashboard...</p></div>`);
            } else {
              _push2(`<div${_scopeId}><p class="text-red-600 font-medium"${_scopeId}>${ssrInterpolate(unref(errorMessage))}</p>`);
              _push2(ssrRenderComponent(_component_NuxtLink, {
                to: "/dashboard",
                class: "mt-4 inline-block text-sm text-blue-600 hover:underline"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Ir al dashboard `);
                  } else {
                    return [
                      createTextVNode(" Ir al dashboard ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "text-center space-y-4" }, [
                unref(loading) ? (openBlock(), createBlock("div", { key: 0 }, [
                  createVNode("p", { class: "text-gray-600" }, "Aceptando invitaci\xF3n...")
                ])) : unref(success) ? (openBlock(), createBlock("div", { key: 1 }, [
                  createVNode("p", { class: "text-green-600 font-medium" }, "Te has unido al espacio financiero"),
                  createVNode("p", { class: "text-sm text-gray-500 mt-2" }, "Redirigiendo al dashboard...")
                ])) : (openBlock(), createBlock("div", { key: 2 }, [
                  createVNode("p", { class: "text-red-600 font-medium" }, toDisplayString(unref(errorMessage)), 1),
                  createVNode(_component_NuxtLink, {
                    to: "/dashboard",
                    class: "mt-4 inline-block text-sm text-blue-600 hover:underline"
                  }, {
                    default: withCtx(() => [
                      createTextVNode(" Ir al dashboard ")
                    ]),
                    _: 1
                  })
                ]))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/invite/[token].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_token_-0xsc6QmE.mjs.map
