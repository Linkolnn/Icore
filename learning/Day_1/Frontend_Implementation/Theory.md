# 📚 Frontend Auth - Теория

> **Перед практикой**: Изучи эти концепции, чтобы понимать что делаешь!

---

## 🎯 Содержание

1. [Pinia - State Management](#1-pinia---state-management)
2. [Composition API (script setup)](#2-composition-api-script-setup)
3. [TypeScript интерфейсы](#3-typescript-интерфейсы)
4. [Reactivity (ref, computed)](#4-reactivity-ref-computed)
5. [Composables](#5-composables)
6. [Nuxt Pages и Middleware](#6-nuxt-pages-и-middleware)
7. [Service Layer Pattern](#7-service-layer-pattern)

---

## 1. Pinia - State Management

### Что такое Pinia?

**Pinia** - это библиотека для управления состоянием (state management) в Vue.js приложениях.

**Простыми словами**: Это **общее хранилище данных**, к которому могут обращаться все компоненты.

### Зачем нужна Pinia?

**Проблема без Pinia**:
```vue
<!-- LoginPage.vue -->
<script setup>
const user = { name: 'John' }
// user доступен ТОЛЬКО в LoginPage
</script>

<!-- ProfilePage.vue -->
<script setup>
// Как получить user из LoginPage? 🤔
// Нужно передавать через props по всей цепочке компонентов
</script>
```

**Решение с Pinia**:
```typescript
// stores/auth.ts - ОБЩЕЕ хранилище
const user = { name: 'John' }

// LoginPage.vue
const authStore = useAuthStore()
console.log(authStore.user) // { name: 'John' }

// ProfilePage.vue
const authStore = useAuthStore()
console.log(authStore.user) // { name: 'John' } - ТОТ ЖЕ user!
```

**Преимущества**:
- ✅ **Централизованное состояние** - одно место для всех данных
- ✅ **Доступно везде** - любой компонент может обратиться
- ✅ **Реактивность** - при изменении обновляются все компоненты
- ✅ **TypeScript поддержка** - автодополнение и проверка типов
- ✅ **DevTools** - можно видеть и отлаживать состояние

### Когда использовать Pinia?

**Используй Pinia для**:
- ✅ Авторизация (user, token, isAuthenticated)
- ✅ Глобальные настройки (theme, language)
- ✅ Данные которые нужны в разных компонентах
- ✅ Состояние которое переживает навигацию

**НЕ используй для**:
- ❌ Локальное состояние компонента (используй `ref()`)
- ❌ Временные данные (используй `ref()`)
- ❌ Данные одной формы (используй `ref()`)

**Пример**:
```vue
<!-- Локальное состояние (ref) -->
<script setup>
const count = ref(0) // Только для этого компонента
</script>

<!-- Глобальное состояние (Pinia) -->
<script setup>
const authStore = useAuthStore() // Для всего приложения
</script>
```

---

## 1.1 defineStore - создание Store

### Что такое defineStore?

**`defineStore`** - это функция из Pinia для создания хранилища (store).

**Синтаксис**:
```typescript
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  // 'auth' - уникальное имя store
  state: () => ({ /* данные */ }),
  actions: { /* методы */ },
})
```

### Анатомия Store

```typescript
export const useAuthStore = defineStore('auth', {
  // 1. STATE - данные (как data в Options API)
  state: () => ({
    user: null,      // Текущий пользователь
    token: null,     // JWT токен
    isAuthenticated: false,
  }),

  // 2. GETTERS - вычисляемые значения (как computed)
  getters: {
    userName: (state) => state.user?.name || 'Гость',
  },

  // 3. ACTIONS - методы для изменения state (как methods)
  actions: {
    async login(email, password) {
      // Логика входа
      this.user = { name: 'John' }
      this.isAuthenticated = true
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
    },
  },
})
```

### State

**State** - это данные, которые хранит store.

```typescript
state: () => ({
  user: null,           // Объект пользователя
  token: null,          // Строка токена
  isAuthenticated: false, // Булево значение
  loading: false,
  error: null,
})
```

**Почему функция `() => ({ ... })`?**
- Чтобы каждый store имел свои данные
- Избегаем проблем с shared state

### Actions

**Actions** - это методы для изменения state.

```typescript
actions: {
  // Обычный метод
  setUser(user) {
    this.user = user  // this = state
  },

  // Async метод (для API вызовов)
  async fetchUser() {
    this.loading = true
    try {
      const user = await api.getUser()
      this.user = user
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  },
}
```

**Ключевые моменты**:
- Используй `this` для доступа к state
- Можно делать async/await
- Можно вызывать другие actions

### Getters (опционально)

**Getters** - это вычисляемые значения (computed).

```typescript
getters: {
  // Простой getter
  userName: (state) => state.user?.name || 'Гость',
  
  // Getter с другим getter
  greeting(): string {
    return `Привет, ${this.userName}!`
  },
}
```

---

## 1.2 Использование Store в компонентах

### Как использовать?

```vue
<script setup lang="ts">
// 1. Импортировать store
import { useAuthStore } from '~/stores/auth'

// 2. Создать экземпляр
const authStore = useAuthStore()

// 3. Читать state
console.log(authStore.user)
console.log(authStore.isAuthenticated)

// 4. Вызывать actions
authStore.login('email@example.com', 'password')
authStore.logout()
</script>

<template>
  <!-- 5. Использовать в template -->
  <div v-if="authStore.isAuthenticated">
    Welcome, {{ authStore.user.name }}!
  </div>
  
  <button @click="authStore.logout()">
    Выйти
  </button>
</template>
```

### Реактивность

**Важно**: Store реактивен! При изменении state → UI обновляется автоматически.

```vue
<script setup>
const authStore = useAuthStore()

// Изменим state через action
const handleLogin = async () => {
  await authStore.login(email, password)
  // После login() state изменится
  // И UI обновится автоматически!
}
</script>

<template>
  <!-- Автоматически обновится когда изменится isAuthenticated -->
  <div v-if="authStore.isAuthenticated">
    Вы вошли!
  </div>
</template>
```

---

## 2. Composition API (script setup)

### Что такое Composition API?

**Composition API** - это новый способ писать компоненты в Vue 3.

**Options API** (старый, НЕ используем):
```vue
<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>
```

**Composition API** (новый, используем):
```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
const increment = () => {
  count.value++
}
</script>
```

### Зачем script setup?

- ✅ **Короче** - меньше кода
- ✅ **Понятнее** - всё последовательно сверху вниз
- ✅ **TypeScript** - лучшая поддержка типов
- ✅ **Производительность** - быстрее компилируется

### Базовый синтаксис

```vue
<script setup lang="ts">
// 1. Импорты
import { ref, computed } from 'vue'

// 2. Reactive переменные
const count = ref(0)
const doubled = computed(() => count.value * 2)

// 3. Функции
const increment = () => {
  count.value++
}

// 4. Всё автоматически доступно в template!
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">+1</button>
  </div>
</template>
```

**Ключевые моменты**:
- Нет `export default`
- Всё объявленное доступно в template
- TypeScript через `lang="ts"`

---

## 3. TypeScript интерфейсы

### Что такое interface?

**Interface** - это описание структуры объекта в TypeScript.

**Без интерфейса** (плохо):
```typescript
const user = {
  name: 'John',
  email: 'john@example.com',
  age: 25,
}

// TypeScript не знает какие поля есть
// Можно случайно написать user.nam (опечатка)
```

**С интерфейсом** (хорошо):
```typescript
interface User {
  name: string
  email: string
  age: number
}

const user: User = {
  name: 'John',
  email: 'john@example.com',
  age: 25,
}

// TypeScript знает структуру
// user.nam - ошибка компиляции!
// user.name - автодополнение работает!
```

### Синтаксис

```typescript
interface User {
  // Обязательные поля
  _id: string
  name: string
  email: string
  
  // Опциональные поля (могут отсутствовать)
  avatar?: string  // ? = опциональное
  phone?: string
  
  // Типы
  age: number              // Число
  isActive: boolean        // true/false
  roles: string[]          // Массив строк
  createdAt: Date          // Дата
  metadata: object         // Объект
  status: 'online' | 'offline' // Только эти значения
}
```

### Использование

```typescript
// Типизация переменной
const user: User = {
  _id: '123',
  name: 'John',
  email: 'john@example.com',
}

// Типизация функции
function greet(user: User): string {
  return `Hello, ${user.name}!`
}

// Типизация массива
const users: User[] = [user1, user2]
```

### Зачем нужны?

- ✅ **Автодополнение** - IDE подсказывает поля
- ✅ **Проверка типов** - ловит ошибки до запуска
- ✅ **Документация** - видно какие поля есть
- ✅ **Рефакторинг** - безопасно менять код

---

## 4. Reactivity (ref, computed)

### ref() - реактивная переменная

**`ref()`** - создаёт реактивную переменную, при изменении которой обновляется UI.

```vue
<script setup>
import { ref } from 'vue'

// Создать реактивную переменную
const count = ref(0)

// Изменить значение (используй .value)
const increment = () => {
  count.value++  // .value обязателен в script
}
</script>

<template>
  <!-- В template .value НЕ нужен -->
  <p>Count: {{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

**Ключевые моменты**:
- В `<script>` используй `.value`
- В `<template>` НЕ используй `.value`
- При изменении → UI обновляется автоматически

### computed() - вычисляемое значение

**`computed()`** - создаёт значение которое пересчитывается при изменении зависимостей.

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// Вычисляемое значение
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// Изменим firstName
firstName.value = 'Jane'
// fullName автоматически пересчитается: "Jane Doe"
</script>

<template>
  <p>{{ fullName }}</p> <!-- Jane Doe -->
</template>
```

**Зачем computed?**:
- ✅ **Кеширование** - пересчитывается только при изменении зависимостей
- ✅ **Чистота** - логика в одном месте
- ✅ **Производительность** - не пересчитывается каждый рендер

**Разница ref vs computed**:

```typescript
// ref - для хранения значения
const count = ref(0)
count.value = 5  // Можно изменять

// computed - для вычисления
const doubled = computed(() => count.value * 2)
doubled.value = 10  // ❌ ОШИБКА! Нельзя изменять напрямую
```

---

## 5. Composables

### Что такое Composable?

**Composable** - это переиспользуемая функция с реактивной логикой.

**Простыми словами**: Функция которая возвращает reactive data и methods.

**Зачем**:
- ✅ Переиспользование логики
- ✅ Чистый код
- ✅ Легко тестировать

### Пример

**Без Composable** (дублирование):
```vue
<!-- LoginPage.vue -->
<script setup>
const authStore = useAuthStore()
const login = async (email, password) => {
  await authStore.login(email, password)
}
</script>

<!-- RegisterPage.vue -->
<script setup>
const authStore = useAuthStore()
const register = async (name, email, password) => {
  await authStore.register(name, email, password)
}
</script>
```

**С Composable** (переиспользование):
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const authStore = useAuthStore()
  
  const login = async (email, password) => {
    await authStore.login(email, password)
  }
  
  const register = async (name, email, password) => {
    await authStore.register(name, email, password)
  }
  
  return { login, register, user: computed(() => authStore.user) }
}
```

Использование:
```vue
<!-- LoginPage.vue -->
<script setup>
const { login, user } = useAuth()
</script>

<!-- RegisterPage.vue -->
<script setup>
const { register, user } = useAuth()
</script>
```

### Naming Convention

- Всегда начинается с `use...`
- `useAuth`, `useUser`, `useCart`, etc.

---

## 6. Nuxt Pages и Middleware

### Nuxt Pages

**Nuxt Pages** - это автоматический роутинг на основе файловой структуры.

```
pages/
├── index.vue          → /
├── login.vue          → /login
├── register.vue       → /register
└── profile.vue        → /profile
```

**Навигация**:
```vue
<template>
  <!-- Ссылки -->
  <NuxtLink to="/">Главная</NuxtLink>
  <NuxtLink to="/login">Вход</NuxtLink>
  
  <!-- Программная навигация -->
  <button @click="goToProfile">Профиль</button>
</template>

<script setup>
const router = useRouter()

const goToProfile = () => {
  router.push('/profile')
}
</script>
```

### Middleware

**Middleware** - это функция которая выполняется перед переходом на страницу.

**Зачем**: Защита routes от неавторизованных пользователей.

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  // Проверка авторизации
  if (!authStore.isAuthenticated) {
    return navigateTo('/login') // Редирект
  }
  
  // Если авторизован - пропустить
})
```

**Использование на странице**:
```vue
<script setup>
definePageMeta({
  middleware: ['auth'] // Требует авторизацию
})
</script>

<template>
  <div>Защищённая страница</div>
</template>
```

---

## 7. Service Layer Pattern

### Что такое Service Layer?

**Service Layer** - это слой который изолирует API вызовы от компонентов.

**Без Service Layer** (плохо):
```vue
<script setup>
// API вызовы прямо в компоненте
const login = async () => {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json()
  // ...
}
</script>
```

**С Service Layer** (хорошо):
```typescript
// services/api/auth.service.ts
export async function loginUser(email, password) {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}
```

```vue
<script setup>
import { loginUser } from '~/services/api/auth.service'

const login = async () => {
  const data = await loginUser(email, password)
  // Чище и понятнее!
}
</script>
```

**Преимущества**:
- ✅ **Изоляция** - API логика отдельно
- ✅ **Переиспользование** - один сервис для всех
- ✅ **Тестируемость** - легко мокировать
- ✅ **Масштабируемость** - легко добавлять endpoints

---

## 📝 Резюме

### Что изучил:

1. **Pinia** - централизованное хранилище состояния
   - `defineStore` для создания store
   - `state` для данных, `actions` для методов
   - Используется для глобального состояния

2. **Composition API** - современный способ писать компоненты
   - `<script setup>` синтаксис
   - Всё доступно в template

3. **TypeScript** - типизация для безопасности
   - `interface` для структуры объектов
   - Автодополнение и проверка типов

4. **Reactivity** - автоматическое обновление UI
   - `ref()` для переменных
   - `computed()` для вычисляемых значений

5. **Composables** - переиспользуемая логика
   - Функции которые начинаются с `use...`

6. **Nuxt Pages** - файловый роутинг
   - **Middleware** для защиты routes

7. **Service Layer** - изоляция API вызовов

---

## 🚀 Готов к практике!

Теперь переходи к **Practice.md** и начинай писать код! 💪

Все эти концепции применишь на практике в заданиях.
