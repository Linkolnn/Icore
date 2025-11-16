import { defineStore } from 'pinia'
import type { User, SearchUsersParams } from '~/types/user.types'
import { searchUsers as searchUsersApi } from '~/services/api/user.service'

/**
 * Users Store
 * 
 * Применяем Store Pattern (Pinia):
 * - Централизованное состояние для пользователей
 * - Composition API style (setup function)
 * - Реактивность через ref/computed
 * 
 * ВАЖНО: НЕТ системы друзей! Только поиск пользователей.
 */
export const useUsersStore = defineStore('users', () => {
  // ===== STATE =====
  
  /**
   * Результаты поиска пользователей
   */
  const searchResults = ref<User[]>([])
  
  /**
   * Загрузка поиска
   */
  const searchLoading = ref(false)
  
  /**
   * Ошибка поиска
   */
  const searchError = ref<string | null>(null)
  
  /**
   * Pagination info
   */
  const searchTotal = ref(0)
  const searchHasMore = ref(false)
  
  // ===== ACTIONS =====
  
  /**
   * Поиск пользователей
   * 
   * Применяем Service Layer:
   * - Вызываем API через service
   * - Обрабатываем ошибки
   * - Обновляем state
   * 
   * @param params - параметры поиска
   */
  async function searchUsers(params: SearchUsersParams) {
    // Валидация: минимум 2 символа
    if (params.query.length < 2) {
      searchResults.value = []
      searchTotal.value = 0
      searchHasMore.value = false
      return
    }
    
    searchLoading.value = true
    searchError.value = null
    
    try {
      const response = await searchUsersApi(params)
      
      searchResults.value = response.users
      searchTotal.value = response.total
      searchHasMore.value = response.hasMore
    } catch (error: any) {
      console.error('Search users error:', error)
      searchError.value = error.message || 'Failed to search users'
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }
  
  /**
   * Очистить результаты поиска
   */
  function clearSearch() {
    searchResults.value = []
    searchTotal.value = 0
    searchHasMore.value = false
    searchError.value = null
  }
  
  // ===== RETURN =====
  
  return {
    // State
    searchResults,
    searchLoading,
    searchError,
    searchTotal,
    searchHasMore,
    
    // Actions
    searchUsers,
    clearSearch,
  }
})
