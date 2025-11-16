// ===================================
// 👤 GUEST MIDDLEWARE - Для неавторизованных пользователей
// ===================================
// Паттерн: Guard Pattern
// Редирект на главную, если пользователь уже авторизован

import { useAuthStore } from "~/stores/auth"

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Если пользователь уже авторизован, редирект на главную
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
