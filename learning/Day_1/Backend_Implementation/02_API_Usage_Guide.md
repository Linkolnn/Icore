# 📡 API Usage Guide - Как использовать Backend API

Это руководство для **Frontend разработчика** - как работать с Auth API.

---

## 🌐 Base URL

```
Development: http://localhost:3001
Production: https://your-domain.com
```

---

## 🔐 Endpoints

### 1. POST /auth/register - Регистрация

**Описание**: Создаёт нового пользователя

**URL**: `POST /auth/register`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Успешный ответ** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null,
    "status": "offline"
  }
}
```

**Ошибки**:

| Код | Описание | Ответ |
|-----|----------|-------|
| 400 | Валидация не прошла | `{ message: ["email must be an email"], error: "Bad Request" }` |
| 409 | Email уже зарегистрирован | `{ message: "Пользователь с таким email уже существует" }` |

**Пример (Fetch API)**:
```typescript
const register = async (name: string, email: string, password: string) => {
  const response = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }
  
  const data = await response.json()
  return data // { access_token, user }
}
```

**Пример (Nuxt 3 + Composable)**:
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await useFetch('/auth/register', {
      baseURL: 'http://localhost:3001',
      method: 'POST',
      body: { name, email, password },
    })
    
    if (error.value) {
      throw new Error(error.value.message)
    }
    
    return data.value
  }
  
  return { register }
}
```

---

### 2. POST /auth/login - Вход

**Описание**: Вход существующего пользователя

**URL**: `POST /auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Успешный ответ** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null,
    "status": "offline"
  }
}
```

**Ошибки**:

| Код | Описание | Ответ |
|-----|----------|-------|
| 400 | Валидация не прошла | `{ message: ["email must be an email"] }` |
| 401 | Неверный email или пароль | `{ message: "Неверный email или пароль" }` |

**Пример (Fetch API)**:
```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }
  
  return await response.json() // { access_token, user }
}
```

---

### 3. GET /auth/profile - Получить профиль

**Описание**: Получить данные текущего пользователя (требует авторизацию)

**URL**: `GET /auth/profile`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body**: Нет

**Успешный ответ** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": null,
  "status": "offline",
  "createdAt": "2025-11-11T18:00:00.000Z",
  "updatedAt": "2025-11-11T18:00:00.000Z"
}
```

**Ошибки**:

| Код | Описание | Ответ |
|-----|----------|-------|
| 401 | Нет токена | `{ message: "Unauthorized" }` |
| 401 | Токен невалидный | `{ message: "Unauthorized" }` |
| 401 | Токен истёк | `{ message: "Unauthorized" }` |

**Пример (Fetch API)**:
```typescript
const getProfile = async (token: string) => {
  const response = await fetch('http://localhost:3001/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Unauthorized')
  }
  
  return await response.json()
}
```

---

## 🎯 Frontend Integration (Nuxt 3)

### Полный пример с Pinia Store:

**1. Создайте Auth Store** (`stores/auth.ts`):
```typescript
import { defineStore } from 'pinia'

interface User {
  _id: string
  name: string
  email: string
  avatar: string | null
  status: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    isAuthenticated: false,
  }),

  actions: {
    // Регистрация
    async register(name: string, email: string, password: string) {
      const { data, error } = await useFetch('/auth/register', {
        baseURL: 'http://localhost:3001',
        method: 'POST',
        body: { name, email, password },
      })

      if (error.value) {
        throw new Error(error.value.data?.message || 'Ошибка регистрации')
      }

      this.token = data.value.access_token
      this.user = data.value.user
      this.isAuthenticated = true

      // Сохранить токен
      localStorage.setItem('token', this.token)
    },

    // Вход
    async login(email: string, password: string) {
      const { data, error } = await useFetch('/auth/login', {
        baseURL: 'http://localhost:3001',
        method: 'POST',
        body: { email, password },
      })

      if (error.value) {
        throw new Error(error.value.data?.message || 'Ошибка входа')
      }

      this.token = data.value.access_token
      this.user = data.value.user
      this.isAuthenticated = true

      localStorage.setItem('token', this.token)
    },

    // Получить профиль
    async fetchProfile() {
      const token = this.token || localStorage.getItem('token')
      
      if (!token) {
        throw new Error('Нет токена')
      }

      const { data, error } = await useFetch('/auth/profile', {
        baseURL: 'http://localhost:3001',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (error.value) {
        this.logout()
        throw new Error('Unauthorized')
      }

      this.user = data.value
      this.isAuthenticated = true
    },

    // Выход
    logout() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
    },
  },
})
```

**2. Используйте в компонентах**:

```vue
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { ref } from 'vue'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  try {
    error.value = ''
    await authStore.login(email.value, password.value)
    // Перенаправить на главную
    navigateTo('/')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Пароль" required />
    <button type="submit">Войти</button>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
```

---

## 🔒 Работа с токеном

### Где хранить токен?

**Вариант 1: localStorage** (проще, но менее безопасно):
```typescript
// Сохранить
localStorage.setItem('token', access_token)

// Получить
const token = localStorage.getItem('token')

// Удалить
localStorage.removeItem('token')
```

**Вариант 2: httpOnly cookies** (безопаснее):
```typescript
// Backend устанавливает cookie:
res.cookie('token', access_token, {
  httpOnly: true,  // Недоступен для JavaScript
  secure: true,    // Только HTTPS
  sameSite: 'strict',
})

// Frontend не имеет доступа (автоматически отправляется)
```

**Рекомендация**: Для обучения используйте localStorage, в production - httpOnly cookies.

---

## 🛡️ Защита routes (Nuxt 3)

**Middleware для защиты страниц**:

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  // Проверить авторизацию
  if (!authStore.isAuthenticated) {
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Перенаправить на /login
      return navigateTo('/login')
    }
    
    // Попробовать загрузить профиль
    authStore.fetchProfile().catch(() => {
      return navigateTo('/login')
    })
  }
})
```

**Использование**:
```vue
<script setup>
// Защищённая страница
definePageMeta({
  middleware: ['auth']
})
</script>

<template>
  <div>Только для авторизованных пользователей</div>
</template>
```

---

## 🧪 Тестирование API (Postman/Thunder Client)

### 1. Регистрация:
```
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123"
}
```

### 2. Вход:
```
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

Скопируйте `access_token` из ответа!

### 3. Профиль:
```
GET http://localhost:3001/auth/profile
Authorization: Bearer <вставьте_токен_сюда>
```

---

## 📝 Резюме

**Что нужно делать на Frontend**:

1. ✅ Отправить POST /auth/register или /auth/login
2. ✅ Получить `access_token` из ответа
3. ✅ Сохранить токен (localStorage или Pinia store)
4. ✅ Использовать токен в заголовке `Authorization: Bearer <token>`
5. ✅ Обрабатывать ошибки (401, 409, 400)
6. ✅ При 401 - перенаправлять на /login

**Следующий шаг**: Изучите `05_JWT_Security.md` - как работают JWT токены!
