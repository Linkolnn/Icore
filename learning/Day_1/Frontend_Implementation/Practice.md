# 🎨 Frontend Auth - Практические задания

> **Цель**: Реализовать Login и Register страницы с интеграцией Backend API

**Ты пишешь код сам!** Я даю подсказки, структуру и объяснения.

---

## ⚠️ СНАЧАЛА ИЗУЧИ ТЕОРИЮ!

**Если не знаешь Pinia, Composition API, TypeScript - ОБЯЗАТЕЛЬНО прочитай сначала**:

📚 **[Theory.md](./Theory.md)** - Теория Frontend концепций

**Что там объясняется**:
1. **Pinia** - что это, зачем, как работает `defineStore`
2. **Composition API** - `script setup` синтаксис
3. **TypeScript интерфейсы** - типизация
4. **Reactivity** - `ref()`, `computed()`
5. **Composables** - переиспользуемая логика
6. **Nuxt Pages и Middleware** - роутинг и защита
7. **Service Layer Pattern** - изоляция API

**Без этой теории будет сложно!** Сначала Theory.md, потом Practice.md! 📖

---

## 📋 Список заданий

1. ✅ Auth Store (Pinia) - состояние авторизации
2. ✅ API Service Layer - вызовы Backend API
3. ✅ useAuth Composable - обертка над Store
4. ✅ Login страница - форма входа
5. ✅ Register страница - форма регистрации
6. ✅ Auth Middleware - защита routes
7. ✅ Стилизация - темная тема как в макете

---

## 🎯 Задание 1: Auth Store (Pinia)

### Цель
Создать Pinia store для управления состоянием авторизации.

### Файл
`frontend/app/stores/auth.ts`

### Что нужно сделать

**1. Импортировать Pinia**:
```typescript
import { defineStore } from 'pinia'
```

**2. Определить TypeScript интерфейсы**:
```typescript
// Интерфейс пользователя (совпадает с Backend)
interface User {
  _id: string
  name: string
  email: string
  avatar: string | null
  status: string
}

// Интерфейс состояния Store
interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}
```

**3. Создать Store с помощью `defineStore`**:
```typescript
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    // Инициализация состояния
    token: null,
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  actions: {
    // Методы для изменения состояния
  },
})
```

**4. Реализовать actions**:

**`async register(name, email, password)`**:
- Установить `loading = true`
- Вызвать API регистрации (будет в следующем задании)
- Сохранить `token` и `user` из ответа
- Установить `isAuthenticated = true`
- Сохранить token в `localStorage`
- Обработать ошибки

**`async login(email, password)`**:
- Аналогично register, но без name

**`async fetchProfile()`**:
- Получить token из localStorage или state
- Вызвать API профиля с токеном
- Обновить `user` из ответа

**`logout()`**:
- Очистить `token`, `user`
- Установить `isAuthenticated = false`
- Удалить token из `localStorage`

**`initAuth()`**:
- Проверить наличие token в localStorage
- Если есть → вызвать `fetchProfile()`
- Если нет → оставить неавторизованным

### Подсказки

**localStorage API**:
```typescript
// Сохранить
localStorage.setItem('token', token)

// Получить
const token = localStorage.getItem('token')

// Удалить
localStorage.removeItem('token')
```

**Async/await с try-catch**:
```typescript
async someAction() {
  this.loading = true
  this.error = null
  
  try {
    const result = await someApiCall()
    // Обработка успеха
  } catch (err: any) {
    this.error = err.message || 'Ошибка'
  } finally {
    this.loading = false
  }
}
```

**Вызов API** (пока заглушка, реализуем в задании 2):
```typescript
// Временно можно использовать fetch напрямую
const response = await fetch('http://localhost:3001/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password }),
})

if (!response.ok) {
  throw new Error('Ошибка регистрации')
}

const data = await response.json()
```

### Вопросы для понимания

1. Зачем нужен Pinia Store?
2. Почему состояние централизованное?
3. Зачем сохранять token в localStorage?
4. Что такое `isAuthenticated` и зачем он нужен?

### Проверка

```typescript
// В консоли браузера:
const authStore = useAuthStore()
await authStore.register('Test', 'test@example.com', 'password')
console.log(authStore.isAuthenticated) // true
console.log(authStore.user) // { name: 'Test', ... }
```

---

## 🎯 Задание 2: API Service Layer

### Цель
Изолировать API вызовы в отдельный сервис.

### Файл
`frontend/app/services/api/auth.service.ts`

### Что нужно сделать

**1. Определить типы**:
```typescript
interface RegisterData {
  name: string
  email: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

interface AuthResponse {
  access_token: string
  user: {
    _id: string
    name: string
    email: string
    avatar: string | null
    status: string
  }
}
```

**2. Создать конфигурацию API**:
```typescript
const API_BASE_URL = 'http://localhost:3001'
```

**3. Реализовать функции**:

**`registerUser(data: RegisterData): Promise<AuthResponse>`**:
- POST запрос на `/auth/register`
- Body: `{ name, email, password }`
- Вернуть `{ access_token, user }`

**`loginUser(data: LoginData): Promise<AuthResponse>`**:
- POST запрос на `/auth/login`
- Body: `{ email, password }`
- Вернуть `{ access_token, user }`

**`getProfile(token: string): Promise<User>`**:
- GET запрос на `/auth/profile`
- Headers: `Authorization: Bearer <token>`
- Вернуть `user`

### Подсказки

**Fetch с обработкой ошибок**:
```typescript
async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'API Error')
  }
  
  return response.json()
}
```

**Использование**:
```typescript
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
```

### Зачем Service Layer?

- ✅ **Изоляция**: API логика отдельно от компонентов
- ✅ **Переиспользование**: Один сервис для всех компонентов
- ✅ **Тестируемость**: Легко мокировать
- ✅ **Масштабируемость**: Легко добавлять новые endpoints

### Вопросы для понимания

1. Почему API вызовы изолированы от Store?
2. Что такое Service Layer Pattern?
3. Зачем создавать типы для запросов/ответов?

### Проверка

```typescript
import { registerUser } from '~/services/api/auth.service'

const result = await registerUser({
  name: 'Test',
  email: 'test@example.com',
  password: 'password',
})

console.log(result.access_token) // JWT токен
```

---

## 🎯 Задание 3: useAuth Composable

### Цель
Создать composable для удобного использования Auth Store.

### Файл
`frontend/app/composables/useAuth.ts`

### Что нужно сделать

**1. Импортировать Store**:
```typescript
import { useAuthStore } from '~/stores/auth'
```

**2. Создать composable функцию**:
```typescript
export const useAuth = () => {
  const authStore = useAuthStore()

  // Computed свойства для реактивности
  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)

  // Методы (обертки над actions)
  const register = async (name: string, email: string, password: string) => {
    await authStore.register(name, email, password)
  }

  const login = async (email: string, password: string) => {
    await authStore.login(email, password)
  }

  const logout = () => {
    authStore.logout()
  }

  // Вернуть всё для использования в компонентах
  return {
    user,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
  }
}
```

### Подсказки

**Computed в Composition API**:
```typescript
import { computed } from 'vue'

const value = computed(() => someStore.someValue)
// value.value автоматически обновится при изменении someStore.someValue
```

### Зачем Composable?

- ✅ **Удобство**: Проще использовать в компонентах
- ✅ **Реактивность**: `computed` автоматически обновляет UI
- ✅ **Чистый код**: Меньше импортов в компонентах

### Использование в компонентах

```vue
<script setup lang="ts">
const { user, isAuthenticated, login } = useAuth()

const handleLogin = async () => {
  await login(email.value, password.value)
}
</script>

<template>
  <div v-if="isAuthenticated">
    Welcome, {{ user?.name }}!
  </div>
</template>
```

### Вопросы для понимания

1. Что такое Composable?
2. Зачем оборачивать Store в Composable?
3. Что делает `computed()`?

---

## 🎯 Задание 4: Login страница

### Цель
Создать страницу входа с формой и валидацией.

### Файл
`frontend/app/pages/login.vue`

### Что нужно сделать

**1. Script setup**:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { login, error, loading } = useAuth()
const router = useRouter()

// Reactive переменные для формы
const email = ref('')
const password = ref('')

// Обработчик отправки формы
const handleSubmit = async () => {
  try {
    await login(email.value, password.value)
    // Перенаправление на главную после успеха
    router.push('/')
  } catch (err) {
    // Ошибка уже в error из Store
  }
}
</script>
```

**2. Template (HTML)**:
```vue
<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">Вход</h1>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- Email инпут -->
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          class="input"
        />
        
        <!-- Password инпут -->
        <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          required
          class="input"
        />
        
        <!-- Кнопка отправки -->
        <button type="submit" :disabled="loading" class="button">
          {{ loading ? 'Загрузка...' : 'Войти' }}
        </button>
        
        <!-- Ошибка -->
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      
      <!-- Ссылка на регистрацию -->
      <p class="register-link">
        Нет аккаунта? <NuxtLink to="/register">Зарегистрироваться</NuxtLink>
      </p>
    </div>
  </div>
</template>
```

**3. Стили (темная тема как в макете)**:
```vue
<style scoped>
.login-page {
  /* Полный экран, центрирование */
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a; /* Темный фон */
}

.login-container {
  /* Контейнер формы */
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.login-title {
  /* Заголовок с дот-шрифтом */
  font-family: '5mal6Lampen', monospace;
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 2rem;
  text-align: center;
}

.login-form {
  /* Форма */
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input {
  /* Инпуты (как в макете поисковика) */
  padding: 1rem;
  background-color: #2d2d2d; /* Темный фон */
  border: none;
  border-radius: 20px; /* Закругленные края как в макете */
  color: #ffffff;
  font-size: 1rem;
}

.input::placeholder {
  color: #808080; /* Серый placeholder */
}

.button {
  /* Кнопка */
  padding: 1rem;
  background-color: #4a9eff; /* Акцентный цвет */
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.button:hover {
  opacity: 0.8;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff4444; /* Красный для ошибок */
  text-align: center;
}

.register-link {
  color: #808080;
  text-align: center;
  margin-top: 1rem;
}

.register-link a {
  color: #4a9eff;
  text-decoration: none;
}
</style>
```

### Подсказки

**v-model для двусторонней привязки**:
```vue
<input v-model="email" />
<!-- Равносильно: -->
<input :value="email" @input="email = $event.target.value" />
```

**@submit.prevent для предотвращения перезагрузки**:
```vue
<form @submit.prevent="handleSubmit">
  <!-- prevent = preventDefault() -->
</form>
```

**:disabled реактивный атрибут**:
```vue
<button :disabled="loading">
  <!-- Кнопка отключена пока loading = true -->
</button>
```

**v-if условный рендеринг**:
```vue
<p v-if="error">{{ error }}</p>
<!-- Показывается только если error не null -->
```

### Вопросы для понимания

1. Что делает `ref()`?
2. Зачем `@submit.prevent`?
3. Что такое `v-model`?
4. Как работает реактивность Vue?

### Проверка

1. Откройте `http://localhost:3000/login`
2. Введите email и пароль
3. Нажмите "Войти"
4. Должен произойти редирект на главную
5. Проверьте localStorage - должен быть token

---

## 🎯 Задание 5: Register страница

### Цель
Создать страницу регистрации (аналогично Login).

### Файл
`frontend/app/pages/register.vue`

### Что нужно сделать

**Аналогично Login, но**:
1. Добавить поле `name` (имя пользователя)
2. Использовать `register()` вместо `login()`
3. Заголовок "Регистрация"
4. Кнопка "Зарегистрироваться"
5. Ссылка на `/login` вместо `/register`

### Подсказки

**Дополнительное поле**:
```vue
<script setup lang="ts">
const name = ref('')
const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  await register(name.value, email.value, password.value)
  router.push('/')
}
</script>

<template>
  <input v-model="name" type="text" placeholder="Имя" required />
  <input v-model="email" type="email" placeholder="Email" required />
  <input v-model="password" type="password" placeholder="Пароль" required />
</template>
```

### Вопросы для понимания

1. Чем отличается регистрация от входа?
2. Зачем дублировать стили? (Подсказка: можно вынести в общий файл)

### Проверка

1. Откройте `http://localhost:3000/register`
2. Введите имя, email, пароль
3. Нажмите "Зарегистрироваться"
4. Должен произойти редирект на главную
5. Проверьте localStorage - должен быть token

---

## 🎯 Задание 6: Auth Middleware

### Цель
Защитить routes от неавторизованных пользователей.

### Файл
`frontend/app/middleware/auth.ts`

### Что нужно сделать

**1. Создать middleware функцию**:
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  // Проверить авторизацию
  if (!authStore.isAuthenticated) {
    // Проверить localStorage
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Нет токена → редирект на /login
      return navigateTo('/login')
    }
    
    // Есть токен → загрузить профиль
    authStore.fetchProfile().catch(() => {
      // Токен невалиден → редирект на /login
      return navigateTo('/login')
    })
  }
})
```

**2. Использовать middleware на защищённых страницах**:

В `pages/index.vue` (главная):
```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'] // Требует авторизацию
})

const { user } = useAuth()
</script>

<template>
  <div>
    <h1>Главная страница</h1>
    <p>Привет, {{ user?.name }}!</p>
  </div>
</template>
```

### Подсказки

**defineNuxtRouteMiddleware**:
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  // to - куда идём
  // from - откуда идём
  
  // Вернуть navigateTo() для редиректа
  return navigateTo('/login')
})
```

**definePageMeta**:
```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'], // Применить middleware
  layout: 'default', // Опционально
})
</script>
```

### Вопросы для понимания

1. Что такое Middleware?
2. Зачем защищать routes?
3. Что происходит если пользователь неавторизован?

### Проверка

1. Выйдите из системы (`authStore.logout()` в консоли)
2. Попробуйте открыть `http://localhost:3000/`
3. Должен произойти редирект на `/login`
4. Войдите снова
5. Теперь главная должна быть доступна

---

## 🎯 Задание 7: Подключение шрифта 5mal6Lampen

### Цель
Подключить дот-шрифт для заголовков.

### Файл
`frontend/nuxt.config.ts`

### Что нужно сделать

**1. Добавить в nuxt.config.ts**:
```typescript
export default defineNuxtConfig({
  // ...существующая конфигурация
  
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: '/fonts/5mal6Lampen.css', // Или создать CSS файл
        },
      ],
    },
  },
})
```

**2. Создать CSS файл для шрифта**:

`frontend/app/assets/styles/fonts.css`:
```css
@font-face {
  font-family: '5mal6Lampen';
  src: url('/assets/fonts/5mal6Lampen.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
```

**3. Использовать в компонентах**:
```css
.login-title {
  font-family: '5mal6Lampen', monospace;
}
```

### Альтернативный способ (глобальные стили):

Создать `frontend/app/assets/styles/main.css`:
```css
@font-face {
  font-family: '5mal6Lampen';
  src: url('~/assets/fonts/5mal6Lampen.ttf') format('truetype');
}

:root {
  --font-heading: '5mal6Lampen', monospace;
  --font-body: -apple-system, BlinkMacSystemFont, sans-serif;
}

h1, h2, h3 {
  font-family: var(--font-heading);
}
```

И подключить в `nuxt.config.ts`:
```typescript
css: ['~/assets/styles/main.css'],
```

### Проверка

1. Откройте Login страницу
2. Заголовок "Вход" должен быть дот-шрифтом
3. Откройте инспектор → вкладка Fonts
4. Должен быть загружен 5mal6Lampen.ttf

---

## ✅ Финальная проверка

### Чек-лист:

- [ ] Auth Store создан и работает
- [ ] API Service изолирован
- [ ] useAuth composable работает
- [ ] Login страница работает (вход)
- [ ] Register страница работает (регистрация)
- [ ] Middleware защищает главную страницу
- [ ] Шрифт 5mal6Lampen подключен для заголовков
- [ ] Стили соответствуют макету (темная тема, закругленные края)
- [ ] Token сохраняется в localStorage
- [ ] После входа редирект на главную
- [ ] Ошибки отображаются пользователю

### Тестирование:

**1. Регистрация**:
```
1. Откройте /register
2. Введите: Имя, Email, Пароль
3. Нажмите "Зарегистрироваться"
4. Должен произойти редирект на /
5. Проверьте localStorage - есть token
```

**2. Вход**:
```
1. Выйдите (authStore.logout() в консоли)
2. Откройте /login
3. Введите Email и Пароль
4. Нажмите "Войти"
5. Должен произойти редирект на /
```

**3. Middleware**:
```
1. Выйдите
2. Попробуйте открыть /
3. Должен произойти редирект на /login
```

**4. Ошибки**:
```
1. Попробуйте войти с неверным паролем
2. Должна отобразиться ошибка
3. Попробуйте зарегистрироваться с существующим email
4. Должна отобразиться ошибка "Email уже зарегистрирован"
```

---

## 📚 Дополнительные улучшения (опционально)

### 1. Валидация на клиенте:
```typescript
const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const handleSubmit = async () => {
  if (!validateEmail(email.value)) {
    error.value = 'Неверный формат email'
    return
  }
  // ...
}
```

### 2. Переиспользуемые компоненты:

`components/ui/Input.vue`:
```vue
<script setup lang="ts">
defineProps<{
  modelValue: string
  type?: string
  placeholder?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <input
    :type="type || 'text'"
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    :placeholder="placeholder"
    class="input"
  />
</template>
```

Использование:
```vue
<Input v-model="email" type="email" placeholder="Email" />
```

### 3. Loading indicator:
```vue
<div v-if="loading" class="loading-spinner">Загрузка...</div>
```

---

## 🎓 Что изучили

- ✅ **Pinia Store** - управление состоянием
- ✅ **Composition API** - script setup синтаксис
- ✅ **Service Layer** - изоляция API вызовов
- ✅ **Composables** - переиспользуемая логика
- ✅ **Nuxt Pages** - роутинг
- ✅ **Middleware** - защита routes
- ✅ **TypeScript** - типизация
- ✅ **Reactivity** - Vue реактивность (ref, computed)
- ✅ **Template syntax** - v-model, v-if, @events
- ✅ **Стилизация** - scoped styles, CSS переменные

---

## 🚀 Готово!

Покажи мне результат когда закончишь! Скажи "Выполнил Frontend День 1" 🎉

**Готовые решения смотри в**: `Solutions.md` (если застрял)
