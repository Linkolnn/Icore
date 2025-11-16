// ===================================
// 🔐 AUTH TYPES - Централизованные типы для аутентификации
// ===================================
// Паттерн: DRY - все типы в одном месте, переиспользуются везде
// Принцип: Single Source of Truth

/**
 * Пользователь
 */
export interface User {
  _id: string // Backend использует MongoDB _id
  name: string // Backend использует name, а не username
  email: string
  userId: string // Уникальный ID для поиска (формат: nickname@randomid)
  avatar?: string | null
  status?: string
  createdAt?: string
}

/**
 * Данные для входа
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Данные для регистрации
 */
export interface RegisterData {
  name: string // Backend ожидает 'name'
  email: string
  password: string
}

/**
 * Ответ от API при аутентификации
 */
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

/**
 * Состояние аутентификации в store
 */
export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}
