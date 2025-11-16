// ===================================
// 🔐 AUTH SERVICE - API запросы для аутентификации
// ===================================
// Паттерн: Service Layer
// Принцип: Single Responsibility - только API запросы
// Использует: Централизованные типы из auth.types.ts

import type { LoginCredentials, RegisterData, AuthResponse, User } from '~/types/auth.types'

/**
 * Получить базовый URL API
 */
function getApiBase(): string {
  const config = useRuntimeConfig()
  return config.public.apiBase as string
}

/**
 * Регистрация нового пользователя
 * @param data - Данные для регистрации
 * @returns Promise с данными пользователя и токеном
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const apiBase = getApiBase()
    const response = await $fetch<any>(`${apiBase}/auth/register`, {
      method: 'POST',
      body: data
    })
    // Backend возвращает access_token, маппим на accessToken
    return {
      user: response.user,
      accessToken: response.access_token
    }
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка регистрации')
  }
}

/**
 * Вход пользователя
 * @param credentials - Email и пароль
 * @returns Promise с данными пользователя и токеном
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const apiBase = getApiBase()
    const response = await $fetch<any>(`${apiBase}/auth/login`, {
      method: 'POST',
      body: credentials
    })
    // Backend возвращает access_token, маппим на accessToken
    return {
      user: response.user,
      accessToken: response.access_token
    }
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка входа')
  }
}

/**
 * Получение профиля текущего пользователя
 * @param token - JWT токен
 * @returns Promise с данными пользователя
 */
export async function getProfile(token: string): Promise<User> {
  try {
    const apiBase = getApiBase()
    const response = await $fetch<User>(`${apiBase}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка получения профиля')
  }
}
