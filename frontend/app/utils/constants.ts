/**
 * Application constants
 * 
 * DRY принцип - избегаем дублирования конфигурации
 */

/**
 * Cookie configuration
 * Единая конфигурация для всех cookie
 */
export const AUTH_COOKIE_CONFIG = {
  name: 'auth_token',
  options: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: true, // HTTPS only in production
    sameSite: 'strict' as const, // CSRF protection
    httpOnly: false // Nuxt cookies are encrypted but not httpOnly on client
  }
}

/**
 * WebSocket configuration
 */
export const WS_CONFIG = {
  transports: ['websocket'], // Use only WebSocket (no polling fallback)
  reconnection: true, // Auto-reconnect
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
}

/**
 * API configuration
 */
export const API_CONFIG = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000,
}

/**
 * Pagination defaults
 */
export const PAGINATION = {
  defaultLimit: 10,
  messagesLimit: 50,
  usersLimit: 10,
}

/**
 * Validation rules
 */
export const VALIDATION = {
  minPasswordLength: 6,
  maxPasswordLength: 100,
  minNameLength: 2,
  maxNameLength: 50,
  minSearchLength: 2,
}

/**
 * UI delays
 */
export const UI_DELAYS = {
  loadingDebounce: 300, // Show loading after 300ms
  typingDebounce: 1000, // Stop typing after 1s
  searchDebounce: 500, // Search after 500ms
}
