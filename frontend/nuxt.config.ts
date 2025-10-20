// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  devtools: { enabled: true },
  
  modules: ['@pinia/nuxt'],
  
  css: ['~/app/assets/styles/main.scss'],
  
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/app/assets/styles/variables.scss" as *;'
        }
      }
    }
  },
  
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      wsBase: process.env.NUXT_PUBLIC_WS_BASE || 'ws://localhost:3001'
    }
  }
})
