import type { SearchUsersParams, SearchUsersResponse } from '~/types/user.types'

/**
 * User API Service
 * 
 * Применяем Service Layer Pattern:
 * - Все API запросы в отдельных функциях (НЕ классы!)
 * - Используем $fetch из Nuxt (НЕ axios!)
 * - Переиспользуем типы из user.types.ts
 * 
 * ВАЖНО: Функции, а не классы! (Nuxt 4 best practice)
 */

/**
 * Поиск пользователей
 * 
 * GET /users/search?query=john&limit=10&skip=0
 * 
 * @param params - параметры поиска
 * @returns список пользователей с pagination
 */
export async function searchUsers(
  params: SearchUsersParams
): Promise<SearchUsersResponse> {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  return await $fetch<SearchUsersResponse>('/users/search', {
    baseURL: config.public.apiBase,
    method: 'GET',
    query: params,
    headers: {
      Authorization: `Bearer ${authStore.accessToken}`,
    },
  })
}
