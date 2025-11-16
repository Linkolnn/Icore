// ===================================
// 🔐 USE AUTH - Composable для удобного доступа к auth store
// ===================================
// Паттерн: Facade Pattern
// Принцип: DRY - переиспользуемая логика с редиректами
// Использует: Централизованные типы из auth.types.ts

import { useAuthStore } from '~/stores/auth'
import type { LoginCredentials, RegisterData } from '~/types/auth.types'

export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()

  /**
   * Регистрация с автоматическим редиректом на главную
   */
  const register = async (data: RegisterData): Promise<void> => {
    try {
      await authStore.register(data)
      await router.push('/')
    } catch (error) {
      // Ошибка уже в store.error
      throw error
    }
  }

  /**
   * Вход с автоматическим редиректом на главную
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      await authStore.login(credentials)
      await router.push('/')
    } catch (error) {
      // Ошибка уже в store.error
      throw error
    }
  }

  /**
   * Выход с автоматическим редиректом на страницу входа
   */
  const logout = async (): Promise<void> => {
    authStore.logout()
    await router.push('/login')
  }

  return {
    // State (computed для реактивности)
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error),
    // Actions
    register,
    login,
    logout,
    clearError: authStore.clearError
  }
}
