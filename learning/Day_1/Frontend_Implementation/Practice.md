# 🎨 День 1: Frontend Аутентификация - Практика

> **Цель**: Реализовать систему аутентификации с безопасным хранением токенов

**Ты пишешь код сам!** Я даю структуру, подсказки и объяснения.

---

## ⚠️ СНАЧАЛА ИЗУЧИ ТЕОРИЮ!

**Если не знаешь концепции - ОБЯЗАТЕЛЬНО прочитай сначала**:

📚 **[Theory.md](./Theory.md)** - Все концепции подробно

**Что там:**
1. TypeScript - типизация
2. Vue 3 Composition API - ref, computed, watch
3. Pinia Store - state management
4. Nuxt 3 Cookies - безопасное хранение
5. Service Layer - изоляция API
6. Composables - переиспользование
7. Middleware - защита routes
8. Компонентная архитектура - DRY

**Без теории будет сложно!** 📖

---

## 📋 Список заданий

1. ✅ Централизованные типы
2. ✅ UI Компоненты (BaseInput, BaseButton, AuthForm)
3. ✅ API Service Layer
4. ✅ Pinia Store с cookies
5. ✅ useAuth Composable
6. ✅ Страницы (Login, Register)
7. ✅ Middleware (auth, guest)
8. ✅ Настройка шифрования cookies

**Время**: ~6-8 часов

---

## 🎯 Задание 1: Централизованные типы

### Цель
Создать единый источник типов для всей системы аутентификации.

### Файл
`frontend/app/types/auth.types.ts`

### Что нужно сделать

**1. Определить интерфейс User**:
```typescript
export interface User {
  _id: string        // MongoDB использует _id
  name: string       // Имя пользователя
  email: string      // Email
  avatar?: string | null  // Опциональный аватар
  status?: string    // online/offline
  createdAt?: string // Дата создания
}
```

**2. Определить интерфейс LoginCredentials**:
```typescript
export interface LoginCredentials {
  email: string
  password: string
}
```

**3. Определить интерфейс RegisterData**:
```typescript
export interface RegisterData {
  name: string       // Backend ожидает 'name'
  email: string
  password: string
}
```

**4. Определить интерфейс AuthResponse**:
```typescript
export interface AuthResponse {
  user: User
  accessToken: string  // camelCase (маппинг из access_token)
  refreshToken?: string
}
```

**5. Определить интерфейс AuthState**:
```typescript
export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}
```

### Подсказки

**Опциональные поля:**
- `?` после имени = может отсутствовать
- `| null` = может быть null
- `?: string | null` = может отсутствовать ИЛИ быть null

**Зачем централизованные типы:**
- ✅ DRY - определены один раз
- ✅ Single Source of Truth
- ✅ Легко менять
- ✅ Автодополнение везде

### Проверка

```typescript
// Должно работать
const user: User = {
  _id: '123',
  name: 'John',
  email: 'john@example.com'
}

const credentials: LoginCredentials = {
  email: 'test@example.com',
  password: '123456'
}
```

---

## 🎯 Задание 2: UI Компоненты

### Цель
Создать переиспользуемые UI компоненты по принципу DRY.

---

### 2.1 BaseInput - Переиспользуемый Input

**Файл**: `frontend/app/components/ui/BaseInput.vue`

**Что нужно сделать:**

**1. Template с семантической разметкой:**
```vue
<template>
  <div class="base-input">
    <!-- Label связан с input через for и id -->
    <label v-if="label" :for="inputId" class="base-input__label">
      {{ label }}
    </label>
    
    <!-- Input с v-model -->
    <input
      :id="inputId"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="base-input__field"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />
    
    <!-- Ошибка валидации -->
    <span v-if="error" class="base-input__error">{{ error }}</span>
  </div>
</template>
```

**2. Script setup с TypeScript:**
```vue
<script setup lang="ts">
interface Props {
  modelValue: string
  type?: 'text' | 'email' | 'password'
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
  'focus': []
}>()

// v-model реализация
const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Уникальный ID для label
const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)
</script>
```

**3. Стили (SCSS):**
```vue
<style lang="scss" scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  &__label {
    @include font-styles(14px, 500, 1.4);
    color: $text-secondary;
  }

  &__field {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid transparent;
    border-radius: $radius;
    background: $bg-input;
    color: $text-primary;
    box-shadow: $shadow-input;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    @include transition;

    &::placeholder {
      color: $text-placeholder;
      font-size: 16px;
      line-height: 1.5;
    }

    &:focus {
      outline: none;
      box-shadow: $shadow-input, 0 0 0 2px rgba($accent-primary, 0.5);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__error {
    @include font-styles(12px, 400, 1.4);
    color: #F44336;
    margin-top: -4px;
  }
}
</style>
```

**Ключевые концепции:**
- `v-model` через computed get/set
- Props с TypeScript интерфейсом
- Emits для событий
- Семантика: label связан с input
- BEM методология в CSS

---

### 2.2 BaseButton - Переиспользуемая Кнопка

**Файл**: `frontend/app/components/ui/BaseButton.vue`

**Что нужно сделать:**

**1. Template:**
```vue
<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['base-button', `base-button--${variant}`]"
    @click="$emit('click')"
  >
    <span v-if="loading" class="base-button__spinner">⏳</span>
    <slot />
  </button>
</template>
```

**2. Script:**
```vue
<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  disabled: false,
  loading: false
})

defineEmits<{
  'click': []
}>()
</script>
```

**3. Стили:**
```vue
<style lang="scss" scoped>
.base-button {
  padding: 12px 24px;
  border: none;
  border-radius: $radius;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  @include transition;
  
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &--primary {
    background: $accent-primary;
    color: $text-primary;
    
    @include hover {
      background: lighten($accent-primary, 10%);
    }
  }

  &--secondary {
    background: $bg-secondary;
    color: $text-primary;
    
    @include hover {
      background: lighten($bg-secondary, 5%);
    }
  }

  &--ghost {
    background: transparent;
    color: $accent-primary;
    
    @include hover {
      background: rgba($accent-primary, 0.1);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

---

### 2.3 AuthForm - Обертка для форм

**Файл**: `frontend/app/components/auth/Form.vue`

**Что нужно сделать:**

**1. Template с slots:**
```vue
<template>
  <div class="auth-form">
    <header class="auth-form__header">
      <h1 class="auth-form__title">{{ title }}</h1>
      <p v-if="subtitle" class="auth-form__subtitle">{{ subtitle }}</p>
    </header>

    <form class="auth-form__form" @submit.prevent="$emit('submit')">
      <slot />
    </form>

    <footer v-if="$slots.footer" class="auth-form__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
```

**2. Script:**
```vue
<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()

defineEmits<{
  'submit': []
}>()
</script>
```

**3. Стили:**
```vue
<style lang="scss" scoped>
.auth-form {
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: $bg-secondary;
  border-radius: $radius;
  box-shadow: $shadow-block;

  &__header {
    text-align: center;
    margin-bottom: 32px;
  }

  &__title {
    @include font-styles(32px, 700, 1.2);
    color: $text-primary;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  &__subtitle {
    @include font-styles(16px, 400, 1.5);
    color: $text-secondary;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__footer {
    margin-top: 24px;
    text-align: center;
    @include font-styles(14px, 400, 1.5);
    color: $text-secondary;
  }
}
</style>
```

### Подсказки

**Slots:**
- `<slot />` - основной контент
- `<slot name="footer" />` - именованный slot
- `$slots.footer` - проверка наличия slot

**BEM:**
- `.block` - компонент
- `.block__element` - элемент
- `.block--modifier` - модификатор

### Проверка

```vue
<BaseInput v-model="email" type="email" label="Email" />
<BaseButton variant="primary" @click="handleClick">Войти</BaseButton>
<AuthForm title="Вход" subtitle="Войдите в аккаунт" @submit="handleSubmit">
  <BaseInput v-model="email" />
  <template #footer>
    <NuxtLink to="/register">Регистрация</NuxtLink>
  </template>
</AuthForm>
```

---

## 🎯 Задание 3: API Service Layer

### Цель
Изолировать API вызовы и сделать маппинг данных backend → frontend.

### Файл
`frontend/app/services/api/auth.service.ts`

### Что нужно сделать

**1. Импортировать типы:**
```typescript
import type { LoginCredentials, RegisterData, AuthResponse, User } from '~/types/auth.types'
```

**2. Создать функцию getApiBase():**
```typescript
function getApiBase(): string {
  const config = useRuntimeConfig()
  return config.public.apiBase as string
}
```

**3. Реализовать register():**
```typescript
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const apiBase = getApiBase()
    const response = await $fetch<any>(`${apiBase}/auth/register`, {
      method: 'POST',
      body: data
    })
    // Маппинг: access_token → accessToken
    return {
      user: response.user,
      accessToken: response.access_token
    }
  } catch (error: any) {
    throw new Error(error.data?.message || 'Ошибка регистрации')
  }
}
```

**4. Реализовать login()** - аналогично register

**5. Реализовать getProfile():**
```typescript
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
```

### Ключевые концепции

- **$fetch** - Nuxt утилита для HTTP запросов
- **Маппинг** - преобразование snake_case → camelCase
- **Error handling** - обработка ошибок
- **TypeScript** - типизация запросов и ответов

### Проверка

```typescript
const response = await register({
  name: 'Test',
  email: 'test@example.com',
  password: '123456'
})
console.log(response.accessToken) // camelCase!
```

---

## 🎯 Задание 4: Pinia Store с Cookies

### Цель
Создать store с безопасным хранением токенов в зашифрованных cookies.

### Файл
`frontend/app/stores/auth.ts`

### Что нужно сделать

**1. Импорты:**
```typescript
import { defineStore } from 'pinia'
import type { AuthState, LoginCredentials, RegisterData } from '~/types/auth.types'
import * as authService from '~/services/api/auth.service'
```

**2. Создать store (Composition API стиль):**
```typescript
export const useAuthStore = defineStore('auth', () => {
  // STATE
  const user = ref<AuthState['user']>(null)
  const accessToken = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // GETTERS
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)

  // ACTIONS
  async function register(data: RegisterData): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await authService.register(data)
      user.value = response.user
      accessToken.value = response.accessToken

      // Сохранить в зашифрованной cookie
      const tokenCookie = useCookie('auth_token', {
        maxAge: 60 * 60 * 24 * 7,  // 7 дней
        secure: true,
        sameSite: 'strict',
        httpOnly: false
      })
      tokenCookie.value = response.accessToken
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // login() - аналогично register
  // logout() - очистить state и cookie
  // restoreSession() - восстановить из cookie

  return {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    restoreSession,
    clearError
  }
})
```

### Ключевые концепции

- **useCookie()** - Nuxt API для cookies
- **Шифрование** - автоматическое через NUXT_SESSION_PASSWORD
- **maxAge** - время жизни cookie
- **secure** - только HTTPS
- **sameSite** - защита от CSRF

### Проверка

```typescript
const authStore = useAuthStore()
await authStore.register({ name: 'Test', email: 'test@example.com', password: '123456' })
console.log(authStore.isAuthenticated) // true
console.log(document.cookie) // auth_token=зашифрованное_значение
```

---

## 🎯 Задание 5: useAuth Composable

### Цель
Создать Facade над store для удобного использования в компонентах.

### Файл
`frontend/app/composables/useAuth.ts`

### Что нужно сделать

```typescript
import { useAuthStore } from '~/stores/auth'
import type { LoginCredentials, RegisterData } from '~/types/auth.types'

export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()

  const register = async (data: RegisterData): Promise<void> => {
    try {
      await authStore.register(data)
      await router.push('/')
    } catch (error) {
      throw error
    }
  }

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      await authStore.login(credentials)
      await router.push('/')
    } catch (error) {
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    authStore.logout()
    await router.push('/login')
  }

  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error),
    register,
    login,
    logout,
    clearError: authStore.clearError
  }
}
```

### Ключевые концепции

- **Facade Pattern** - упрощенный интерфейс
- **Автоматический редирект** - после login/register
- **computed()** - реактивность

---

## 🎯 Задание 6: Страницы Login и Register

### 6.1 Login Page

**Файл**: `frontend/app/pages/login.vue`

**Структура:**
```vue
<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ['guest']
})

const { login, loading, error, clearError } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const validateForm = (): boolean => {
  // Валидация
}

const handleLogin = async () => {
  if (!validateForm()) return
  clearError()
  try {
    await login({
      email: form.email,
      password: form.password
    })
  } catch (err) {
    console.error('Login error:', err)
  }
}

watch([() => form.email, () => form.password], () => {
  clearError()
})
</script>

<template>
  <main class="login-page">
    <AuthForm
      title="Вход"
      subtitle="Войдите в свой аккаунт"
      @submit="handleLogin"
    >
      <UiBaseInput
        v-model="form.email"
        type="email"
        label="Email"
        placeholder="Введите email"
        :error="errors.email"
        required
      />

      <UiBaseInput
        v-model="form.password"
        type="password"
        label="Пароль"
        placeholder="Введите пароль"
        :error="errors.password"
        required
      />

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <UiBaseButton
        type="submit"
        variant="primary"
        :loading="loading"
      >
        Войти
      </UiBaseButton>

      <template #footer>
        <p class="auth-link">
          Нет аккаунта?
          <NuxtLink to="/register" class="auth-link__link">
            Зарегистрироваться
          </NuxtLink>
        </p>
      </template>
    </AuthForm>
  </main>
</template>
```

### 6.2 Register Page

Аналогично Login, но с дополнительным полем `name` и `confirmPassword`.

---

## 🎯 Задание 7: Middleware

### 7.1 Auth Middleware

**Файл**: `frontend/app/middleware/auth.ts`

```typescript
import { useAuthStore } from "~/stores/auth"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    const tokenCookie = useCookie('auth_token')
    if (tokenCookie.value) {
      await authStore.restoreSession()
    }
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

### 7.2 Guest Middleware

**Файл**: `frontend/app/middleware/guest.ts`

```typescript
import { useAuthStore } from "~/stores/auth"

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
```

---

## 🎯 Задание 8: Настройка шифрования

### Файл `.env`

```bash
# API Configuration
NUXT_PUBLIC_API_BASE=http://localhost:3001
NUXT_PUBLIC_WS_BASE=ws://localhost:3001

# Cookie Encryption (минимум 32 символа)
NUXT_SESSION_PASSWORD=icore-messenger-secret-key-for-cookie-encryption-2025
```

### Проверка

1. Запустите приложение
2. Зарегистрируйтесь
3. Откройте DevTools → Application → Cookies
4. Увидите `auth_token` с зашифрованным значением

---

## ✅ Финальная проверка

### Чек-лист:

- [ ] Типы созданы и переиспользуются
- [ ] UI компоненты работают (BaseInput, BaseButton, AuthForm)
- [ ] API Service изолирован и делает маппинг
- [ ] Store сохраняет токен в зашифрованной cookie
- [ ] useAuth composable работает
- [ ] Login страница работает
- [ ] Register страница работает
- [ ] Middleware защищает routes
- [ ] Cookie шифруется (NUXT_SESSION_PASSWORD)
- [ ] После входа редирект на главную
- [ ] После выхода редирект на login
- [ ] Сессия восстанавливается при перезагрузке

### Тестирование:

**1. Регистрация:**
```
1. Откройте /register
2. Заполните форму
3. Нажмите "Зарегистрироваться"
4. Должен произойти редирект на /
5. Проверьте cookie в DevTools
```

**2. Вход:**
```
1. Выйдите
2. Откройте /login
3. Введите данные
4. Нажмите "Войти"
5. Должен произойти редирект на /
```

**3. Middleware:**
```
1. Выйдите
2. Попробуйте открыть /
3. Должен произойти редирект на /login
```

**4. Восстановление сессии:**
```
1. Войдите
2. Перезагрузите страницу (F5)
3. Должны остаться авторизованными
```

---

## 🚀 Готово!

Покажи результат! Скажи "Выполнил Frontend День 1" 🎉

**Если застрял** - смотри **Solutions.md** с полным кодом!
