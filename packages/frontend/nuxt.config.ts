export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devServer: { port: 3000 },
  ssr: false,
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseAnonKey: '',
      apiUrl: 'http://localhost:3001/api/v1',
    },
  },
  css: ['~/assets/css/tailwind.css'],
});