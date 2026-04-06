// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // يمنع فشل Vite أثناء التطوير: Failed to resolve import "#app-manifest"
  experimental: {
    appManifest: false,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/confirm',
      exclude: ['/auth/*'],
    },
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    facebookVerifyToken: process.env.FACEBOOK_VERIFY_TOKEN,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },

  css: ['~/assets/css/main.css'],

  imports: {
    dirs: ['stores', 'composables', 'types'],
  },

  typescript: {
    strict: true,
    shim: false,
  },

  app: {
    head: {
      title: 'CRM SaaS',
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  // يوافق إصدارات Nuxt الحديثة ويقلل تعارض مسارات الـ SSR الداخلية
  compatibilityDate: '2025-04-03',
})
