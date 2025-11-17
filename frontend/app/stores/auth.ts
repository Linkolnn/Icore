// ===================================
// 🔐 AUTH STORE - Централизованное состояние аутентификации
// ===================================
// Паттерн: Store Pattern (Pinia)
// Принцип: Single Source of Truth - единственный источник данных
// Использует: Централизованные типы из auth.types.ts

import { defineStore } from 'pinia'
import type { AuthState, LoginCredentials, RegisterData } from '~/types/auth.types'
import * as authService from '~/services/api/auth.service'
import { AUTH_COOKIE_CONFIG } from '~/utils/constants'

export const useAuthStore = defineStore('auth', () => {
  // ===================================
  // STATE
  // ===================================
  const user = ref<AuthState['user']>(null)
  const accessToken = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ===================================
  // GETTERS
  // ===================================
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)

  // ===================================
  // ACTIONS
  // ===================================

  /**
   * Регистрация нового пользователя
   */
  async function register(data: RegisterData): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await authService.register(data)
      user.value = response.user
      accessToken.value = response.accessToken

      // Сохраняем токен в зашифрованной cookie
      const tokenCookie = useCookie(AUTH_COOKIE_CONFIG.name, AUTH_COOKIE_CONFIG.options)
      tokenCookie.value = response.accessToken
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Вход пользователя
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      user.value = response.user
      accessToken.value = response.accessToken

      // Сохраняем токен в зашифрованной cookie
      const tokenCookie = useCookie(AUTH_COOKIE_CONFIG.name, AUTH_COOKIE_CONFIG.options)
      tokenCookie.value = response.accessToken
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Выход пользователя
   */
  function logout(): void {
    user.value = null
    accessToken.value = null
    error.value = null

    // Удаляем токен из cookie
    const tokenCookie = useCookie(AUTH_COOKIE_CONFIG.name)
    tokenCookie.value = null
  }

  /**
   * Восстановление сессии из зашифрованной cookie
   * Вызывается при загрузке приложения
   */
  async function restoreSession(): Promise<void> {
    // Получаем токен из зашифрованной cookie
    const tokenCookie = useCookie(AUTH_COOKIE_CONFIG.name)
    const token = tokenCookie.value
    if (!token) return

    loading.value = true
    try {
      const userData = await authService.getProfile(token)
      user.value = userData
      accessToken.value = token
    } catch (err) {
      // Токен невалидный, очищаем
      logout()
    } finally {
      loading.value = false
    }
  }

  /**
   * Очистка ошибки
   */
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    user,
    accessToken,
    loading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    register,
    login,
    logout,
    restoreSession,
    clearError
  }
})
