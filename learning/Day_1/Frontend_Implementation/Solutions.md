# 🎨 Frontend Auth - Готовые решения

> **Внимание**: Смотри сюда только если застрял! Сначала пытайся сам по Practice.md

---

## ✅ Задание 1: Auth Store

**Файл**: `frontend/app/stores/auth.ts`

```typescript
import { defineStore } from 'pinia'
import { registerUser, loginUser, getProfile } from '~/services/api/auth.service'

/**
 * Интерфейс пользователя
 * Совпадает с Backend User модель
 */
interface User {
  _id: string
  name: string
  email: string
  avatar: string | null
  status: string
}

/**
 * Интерфейс состояния Auth Store
 */
interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

/**
 * Auth Store - управление авторизацией
 * 
 * ПАТТЕРН: Store Pattern (Pinia)
 * ЗАЧЕМ: Централизованное состояние авторизации
 */
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  actions: {
    /**
     * Регистрация нового пользователя
     */
    async register(name: string, email: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const response = await registerUser({ name, email, password })
        
        this.token = response.access_token
        this.user = response.user
        this.isAuthenticated = true

        // Сохранить токен в localStorage
        localStorage.setItem('token', this.token)
      } catch (err: any) {
        this.error = err.message || 'Ошибка регистрации'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Вход пользователя
     */
    async login(email: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const response = await loginUser({ email, password })
        
        this.token = response.access_token
        this.user = response.user
        this.isAuthenticated = true

        localStorage.setItem('token', this.token)
      } catch (err: any) {
        this.error = err.message || 'Ошибка входа'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Получить профиль пользователя
     */
    async fetchProfile() {
      const token = this.token || localStorage.getItem('token')
      
      if (!token) {
        throw new Error('Нет токена')
      }

      this.loading = true
      this.error = null

      try {
        const user = await getProfile(token)
        
        this.user = user
        this.token = token
        this.isAuthenticated = true
      } catch (err: any) {
        this.error = err.message || 'Ошибка загрузки профиля'
        this.logout() // Токен невалиден
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Выход пользователя
     */
    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      this.error = null
      
      localStorage.removeItem('token')
    },

    /**
     * Инициализация (проверка токена при загрузке)
     */
    async initAuth() {
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          await this.fetchProfile()
        } catch {
          // Токен невалиден, уже сделан logout в fetchProfile
        }
      }
    },
  },
})
```

---

## ✅ Задание 2: API Service

**Файл**: `frontend/app/services/api/auth.service.ts`

```typescript
/**
 * Типы для Auth API
 */
interface RegisterData {
  name: string
  email: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

interface User {
  _id: string
  name: string
  email: string
  avatar: string | null
  status: string
}

interface AuthResponse {
  access_token: string
  user: User
}

/**
 * API конфигурация
 */
const API_BASE_URL = 'http://localhost:3001'

/**
 * Обработчик API запросов с ошибками
 */
async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Ошибка сети',
    }))
    throw new Error(error.message || `HTTP Error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Регистрация нового пользователя
 * 
 * @param data - { name, email, password }
 * @returns { access_token, user }
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

/**
 * Вход пользователя
 * 
 * @param data - { email, password }
 * @returns { access_token, user }
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

/**
 * Получить профиль пользователя
 * 
 * @param token - JWT токен
 * @returns User данные
 */
export async function getProfile(token: string): Promise<User> {
  return apiRequest<User>(`${API_BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
}
```

---

## ✅ Задание 3: useAuth Composable

**Файл**: `frontend/app/composables/useAuth.ts`

```typescript
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

/**
 * useAuth Composable
 * 
 * ПАТТЕРН: Composable Pattern
 * ЗАЧЕМ: Удобный доступ к Auth Store из компонентов
 */
export const useAuth = () => {
  const authStore = useAuthStore()

  // Computed properties для реактивности
  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)

  // Методы
  const register = async (name: string, email: string, password: string) => {
    await authStore.register(name, email, password)
  }

  const login = async (email: string, password: string) => {
    await authStore.login(email, password)
  }

  const logout = () => {
    authStore.logout()
  }

  const fetchProfile = async () => {
    await authStore.fetchProfile()
  }

  const initAuth = async () => {
    await authStore.initAuth()
  }

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    
    // Actions
    register,
    login,
    logout,
    fetchProfile,
    initAuth,
  }
}
```

---

## ✅ Задание 4: Login страница

**Файл**: `frontend/app/pages/login.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { login, error, loading } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const localError = ref('')

const handleSubmit = async () => {
  localError.value = ''
  
  if (!email.value || !password.value) {
    localError.value = 'Заполните все поля'
    return
  }

  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (err: any) {
    localError.value = err.message || 'Ошибка входа'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">Вход</h1>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          class="input"
          :disabled="loading"
        />
        
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          required
          class="input"
          :disabled="loading"
        />
        
        <button type="submit" :disabled="loading" class="button">
          {{ loading ? 'Загрузка...' : 'Войти' }}
        </button>
        
        <p v-if="localError || error" class="error">
          {{ localError || error }}
        </p>
      </form>
      
      <p class="register-link">
        Нет аккаунта? <NuxtLink to="/register">Зарегистрироваться</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.login-title {
  font-family: '5mal6Lampen', monospace;
  font-size: 2.5rem;
  color: #ffffff;
  margin-bottom: 2rem;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input {
  padding: 1rem 1.5rem;
  background-color: #2d2d2d;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  transition: background-color 0.2s;
}

.input:focus {
  background-color: #353535;
}

.input::placeholder {
  color: #808080;
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button {
  padding: 1rem;
  background-color: #4a9eff;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.button:hover:not(:disabled) {
  background-color: #3a8eef;
  transform: translateY(-1px);
}

.button:active:not(:disabled) {
  transform: translateY(0);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff4444;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.register-link {
  color: #808080;
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

.register-link a {
  color: #4a9eff;
  text-decoration: none;
  transition: color 0.2s;
}

.register-link a:hover {
  color: #3a8eef;
}
</style>
```

---

## ✅ Задание 5: Register страница

**Файл**: `frontend/app/pages/register.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { register, error, loading } = useAuth()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const localError = ref('')

const handleSubmit = async () => {
  localError.value = ''
  
  if (!name.value || !email.value || !password.value) {
    localError.value = 'Заполните все поля'
    return
  }

  if (password.value.length < 6) {
    localError.value = 'Пароль должен быть минимум 6 символов'
    return
  }

  try {
    await register(name.value, email.value, password.value)
    router.push('/')
  } catch (err: any) {
    localError.value = err.message || 'Ошибка регистрации'
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <h1 class="register-title">Регистрация</h1>
      
      <form @submit.prevent="handleSubmit" class="register-form">
        <input
          v-model="name"
          type="text"
          placeholder="Имя"
          required
          class="input"
          :disabled="loading"
        />
        
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          class="input"
          :disabled="loading"
        />
        
        <input
          v-model="password"
          type="password"
          placeholder="Пароль (минимум 6 символов)"
          required
          class="input"
          :disabled="loading"
        />
        
        <button type="submit" :disabled="loading" class="button">
          {{ loading ? 'Загрузка...' : 'Зарегистрироваться' }}
        </button>
        
        <p v-if="localError || error" class="error">
          {{ localError || error }}
        </p>
      </form>
      
      <p class="login-link">
        Уже есть аккаунт? <NuxtLink to="/login">Войти</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
}

.register-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.register-title {
  font-family: '5mal6Lampen', monospace;
  font-size: 2.5rem;
  color: #ffffff;
  margin-bottom: 2rem;
  text-align: center;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input {
  padding: 1rem 1.5rem;
  background-color: #2d2d2d;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  transition: background-color 0.2s;
}

.input:focus {
  background-color: #353535;
}

.input::placeholder {
  color: #808080;
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button {
  padding: 1rem;
  background-color: #4a9eff;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.button:hover:not(:disabled) {
  background-color: #3a8eef;
  transform: translateY(-1px);
}

.button:active:not(:disabled) {
  transform: translateY(0);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff4444;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.login-link {
  color: #808080;
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

.login-link a {
  color: #4a9eff;
  text-decoration: none;
  transition: color 0.2s;
}

.login-link a:hover {
  color: #3a8eef;
}
</style>
```

---

## ✅ Задание 6: Auth Middleware

**Файл**: `frontend/app/middleware/auth.ts`

```typescript
/**
 * Auth Middleware
 * 
 * ПАТТЕРН: Middleware Pattern
 * ЗАЧЕМ: Защита routes от неавторизованных пользователей
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // Если уже авторизован - пропустить
  if (authStore.isAuthenticated) {
    return
  }
  
  // Проверить localStorage
  const token = localStorage.getItem('token')
  
  if (!token) {
    // Нет токена → редирект на /login
    return navigateTo('/login')
  }
  
  // Есть токен → попробовать загрузить профиль
  try {
    await authStore.fetchProfile()
    // Успех - пропустить
  } catch {
    // Токен невалиден → редирект на /login
    return navigateTo('/login')
  }
})
```

**Использование на главной странице**:

**Файл**: `frontend/app/pages/index.vue`

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'], // Требует авторизацию
})

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="home-page">
    <div class="container">
      <h1 class="title">Главная страница</h1>
      <p class="welcome">Привет, {{ user?.name }}! 👋</p>
      
      <div class="user-info">
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>Статус:</strong> {{ user?.status }}</p>
      </div>
      
      <button @click="handleLogout" class="button">
        Выйти
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
}

.container {
  max-width: 600px;
  padding: 2rem;
  text-align: center;
}

.title {
  font-family: '5mal6Lampen', monospace;
  font-size: 3rem;
  color: #ffffff;
  margin-bottom: 1rem;
}

.welcome {
  font-size: 1.5rem;
  color: #ffffff;
  margin-bottom: 2rem;
}

.user-info {
  background-color: #2d2d2d;
  padding: 1.5rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  text-align: left;
}

.user-info p {
  color: #ffffff;
  margin: 0.5rem 0;
}

.user-info strong {
  color: #4a9eff;
}

.button {
  padding: 1rem 2rem;
  background-color: #ff4444;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.button:hover {
  background-color: #ee3333;
  transform: translateY(-1px);
}
</style>
```

---

## ✅ Задание 7: Подключение шрифта

**Файл**: `frontend/app/assets/styles/fonts.css`

```css
/**
 * Подключение шрифта 5mal6Lampen
 */
@font-face {
  font-family: '5mal6Lampen';
  src: url('~/assets/fonts/5mal6Lampen.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

**Файл**: `frontend/nuxt.config.ts`

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  devtools: { enabled: true },
  
  modules: ['@pinia/nuxt'],
  
  // Подключить глобальные стили
  css: ['~/assets/styles/fonts.css'],
  
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      wsBase: process.env.NUXT_PUBLIC_WS_BASE || 'ws://localhost:3001'
    }
  }
})
```

---

## 📝 Дополнительно: Глобальные стили

**Файл**: `frontend/app/assets/styles/global.css` (опционально)

```css
/**
 * Глобальные стили
 */

/* CSS переменные */
:root {
  /* Colors */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #808080;
  --accent: #4a9eff;
  --error: #ff4444;
  
  /* Fonts */
  --font-heading: '5mal6Lampen', monospace;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
}

/* Сброс стилей */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Body */
body {
  font-family: var(--font-body);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}

/* Заголовки с дот-шрифтом */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

/* Ссылки */
a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  opacity: 0.8;
}
```

Подключить в `nuxt.config.ts`:
```typescript
css: [
  '~/assets/styles/fonts.css',
  '~/assets/styles/global.css',
],
```

---

## 🎉 Всё готово!

Теперь у тебя есть полный рабочий код для Frontend Auth! 🚀

**Что дальше**:
1. Скопируй код в свои файлы
2. Протестируй регистрацию и вход
3. Изучи как работает каждая часть
4. Переходи к Day 2 (или улучшай существующий код)
