// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@unocss/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'OpenXart',
      titleTemplate: '%s · OpenXart',
      meta: [
        {
          name: 'description',
          content:
            'Anime showcase and watch client built on top of the OpenAnix API.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Sora:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    anix: {
      baseUrl: process.env.NUXT_ANIX_API_BASE || 'https://api-s.anixsekai.com',
    },
    public: {
      siteName: 'OpenXart',
    },
  },
  tailwindcss: {
    viewer: false,
    cssPath: false,
  },
})
