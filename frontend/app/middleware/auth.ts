// ===================================
// 🔐 AUTH MIDDLEWARE - Защита маршрутов
// ===================================
// Паттерн: Guard Pattern
// Проверяет аутентификацию перед доступом к странице

import { useAuthStore } from "~/stores/auth"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // Если сессия еще не восстановлена и есть токен в cookie
  if (!authStore.isAuthenticated) {
    const tokenCookie = useCookie('auth_token')
    if (tokenCookie.value) {
      // Пытаемся восстановить сессию из зашифрованной cookie
      await authStore.restoreSession()
    }
  }

  // Если пользователь не авторизован, редирект на login
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
