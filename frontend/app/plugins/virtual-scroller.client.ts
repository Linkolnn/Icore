/**
 * Virtual Scroller Plugin
 * Регистрирует компоненты виртуального скроллинга для оптимизации производительности
 * при отображении больших списков сообщений
 */

import { defineNuxtPlugin } from '#app'
// Временно отключено из-за проблем совместимости с Nuxt 4
// TODO: Использовать @tanstack/vue-virtual или другую альтернативу
// import { RecycleScroller, DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
// import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default defineNuxtPlugin((nuxtApp) => {
  // Временно используем заглушки для компонентов
  const DynamicScroller = {
    name: 'DynamicScroller',
    render() {
      return this.$slots.default?.({ item: null, index: 0, active: true })
    }
  }
  
  const DynamicScrollerItem = {
    name: 'DynamicScrollerItem',
    render() {
      return this.$slots.default?.()
    }
  }
  
  // nuxtApp.vueApp.component('RecycleScroller', RecycleScroller)
  // nuxtApp.vueApp.component('DynamicScroller', DynamicScroller)
  // nuxtApp.vueApp.component('DynamicScrollerItem', DynamicScrollerItem)
})
