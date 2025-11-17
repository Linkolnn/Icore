/**
 * Плагин для регистрации кастомных директив
 */
import { defineNuxtPlugin } from '#app'
import { vMeasure } from '~/directives/vMeasure'

export default defineNuxtPlugin((nuxtApp) => {
  // Регистрируем директиву v-measure
  nuxtApp.vueApp.directive('measure', vMeasure)
})
