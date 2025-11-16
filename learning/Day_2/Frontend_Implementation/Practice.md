# 🛠️ День 2: Frontend Sidebar UI - Практика

> **Цель**: Создать адаптивный Sidebar с глобальным поиском пользователей, применяя Component Composition и строгую дизайн-систему

---

## 📋 Что будем делать

1. ✅ Создать типы для User Search (user.types.ts)
2. ✅ Создать User API Service (user.service.ts)
3. ✅ Создать Users Store (users.ts)
4. ✅ Расширить BaseButton для icon variant
5. ✅ Расширить BaseInput для icon slot
6. ✅ Создать AppHeader с поиском (layout/)
7. ✅ Создать MenuModal (layout/)
8. ✅ Создать ChatSidebar (layout/)
9. ✅ Интегрировать в app.vue
10. ✅ Тестирование

---

## 🚀 Шаг 1: Типы (user.types.ts)

```typescript
// frontend/app/types/user.types.ts
export interface User {
  _id: string
  userId: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface SearchUsersParams {
  query: string
  limit?: number
  skip?: number
}

export interface SearchUsersResponse {
  users: User[]
  total: number
  hasMore: boolean
}
```

**Создай файл:**
```bash
touch frontend/app/types/user.types.ts
```

**Скопируй код выше** и вставь в файл.

**Объяснение:**
- `User` - базовый интерфейс пользователя (без password, refreshToken)
- `SearchUsersParams` - параметры для поиска (query обязательный, limit/skip опциональные)
- `SearchUsersResponse` - ответ от Backend (users, total, hasMore для pagination)

---

## 📡 Шаг 2: User API Service (user.service.ts)

```typescript
// frontend/app/services/api/user.service.ts
import type { SearchUsersParams, SearchUsersResponse } from '~/types/user.types'

/**
 * User API Service
 *
 * Паттерн: Service Layer
 * - Все API вызовы для работы с пользователями
 * - Использует $fetch (Nuxt auto-import)
 * - Берёт токен из authStore
 */

export async function searchUsers(params: SearchUsersParams): Promise<SearchUsersResponse> {
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
```

**Создай файл:**
```bash
touch frontend/app/services/api/user.service.ts
```

**Скопируй код выше** и вставь в файл.

**Объяснение:**
- Используем `$fetch` (Nuxt auto-import) вместо fetch/axios
- `useRuntimeConfig()` для получения API base URL
- `useAuthStore()` для токена (auto-import)
- Параметры передаём через `query` (автоматически строит query string)
- Возвращаем `Promise<SearchUsersResponse>`

---

## 🏪 Шаг 3: Users Store (users.ts)

```typescript
// frontend/app/stores/users.ts
import { defineStore } from 'pinia'
import { searchUsers } from '~/services/api/user.service'
import type { User, SearchUsersParams } from '~/types/user.types'

/**
 * Users Store
 *
 * Паттерн: Pinia Store (Composition API)
 * - searchResults - массив найденных пользователей
 * - searchLoading - индикатор загрузки
 * - searchUsers() - action для поиска
 * - clearSearch() - очистка результатов
 */

export const useUsersStore = defineStore('users', () => {
  // State
  const searchResults = ref<User[]>([])
  const searchLoading = ref(false)
  const searchError = ref<string | null>(null)

  // Actions
  async function searchUsers(params: SearchUsersParams) {
    searchLoading.value = true
    searchError.value = null

    try {
      const response = await searchUsers(params)
      searchResults.value = response.users
    } catch (error) {
      searchError.value = 'Ошибка поиска пользователей'
      console.error('[UsersStore] searchUsers error:', error)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  function clearSearch() {
    searchResults.value = []
    searchError.value = null
  }

  return {
    searchResults,
    searchLoading,
    searchError,
    searchUsers,
    clearSearch,
  }
})
```

**Создай файл:**
```bash
touch frontend/app/stores/users.ts
```

**Скопируй код выше** и вставь в файл.

**Объяснение:**
- Composition API стиль (setup function)
- `searchResults` - реактивный массив найденных пользователей
- `searchLoading` - индикатор загрузки для UI
- `searchError` - сообщение об ошибке
- `searchUsers()` - async action для вызова API
- `clearSearch()` - очистка результатов

---

## 🎨 Шаг 4: Расширить BaseButton (icon variant)

Открой `frontend/app/components/ui/BaseButton.vue` и **добавь icon variant**:

```typescript
// В interface Props добавь:
variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
```

```scss
// В <style> добавь:
// Icon - кнопка с иконкой (для меню, действий)
&--icon {
  background: $bg-primary;
  color: $text-primary;
  box-shadow: $shadow-block;
  padding: 0;
  min-width: 40px;
  width: 40px;
  height: 40px;
  border-radius: $radius;

  @include hover {
    opacity: 0.8; // ✅ Строгое правило: НЕ меняем фон!
  }

  .base-button__content {
    width: 24px;
    height: 24px;
  }
}
```

**Объяснение:**
- `icon` variant - квадратная кнопка 40x40px для иконок
- **ВАЖНО**: Hover через `opacity`, НЕ через изменение `background`
- Используем `$shadow-block` для объёма
- Применяем строгие правила дизайна (см. DESIGN_REFERENCE.md)

---

## 🔍 Шаг 5: Расширить BaseInput (icon slot)

Открой `frontend/app/components/ui/BaseInput.vue` и **добавь wrapper + icon slot**:

```vue
<!-- Замени input на wrapper: -->
<div class="base-input__wrapper">
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
  <div v-if="$slots.icon" class="base-input__icon">
    <slot name="icon" />
  </div>
</div>
```

```scss
// В <style> добавь:
&__wrapper {
  position: relative;
  width: 100%;
}

&__icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: $text-secondary;
}
```

**Объяснение:**
- `wrapper` - relative positioning для абсолютной иконки
- `icon` slot - позволяет передавать иконки через `<template #icon>`
- `pointer-events: none` - иконка не перехватывает клики
- Иконка справа (right: 14px) для search input

---

## 📂 Шаг 6: AppHeader.vue (layout/)

```vue
<script setup lang="ts">
/**
 * AppHeader Component
 *
 * Строго по макету appheader (в обычном chatlist).png:
 * - MenuButton слева (UiBaseButton variant="icon")
 * - Search Input справа (UiBaseInput с иконкой)
 * - Единый фон $bg-primary (#212121)
 * - НЕТ границ (borders)
 *
 * Component Composition:
 * - UiBaseButton - переиспользуемая кнопка
 * - UiBaseInput - переиспользуемый инпут
 * - Search dropdown встроен прямо здесь (inline)
 *
 * NOTE: Все импорты автоматические (Nuxt auto-import)
 */

const emit = defineEmits<{
  'open-menu': []
}>()

const usersStore = useUsersStore()
const searchQuery = ref('')
const showResults = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Debounced поиск (300ms) - простая реализация
function debouncedSearch(query: string) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    if (query.length >= 2) {
      await usersStore.searchUsers({ query, limit: 10 })
      showResults.value = true
    } else {
      closeSearch()
    }
  }, 300)
}

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

function handleFocus() {
  if (searchQuery.value.length >= 2) {
    showResults.value = true
  }
}

function handleUserClick(userId: string) {
  console.log('User clicked:', userId)
  closeSearch()
  // TODO: Интеграция с чатами (День 3)
}

function closeSearch() {
  showResults.value = false
  searchQuery.value = ''
  usersStore.clearSearch()
}

// Закрытие по Escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearch()
    }
  }
  document.addEventListener('keydown', handleEscape)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<template>
  <header class="app-header">
    <!-- MenuButton слева -->
    <UiBaseButton
      variant="icon"
      aria-label="Открыть меню"
      @click="emit('open-menu')"
    >
      <SvgoMenuIcon class="menu-icon" />
    </UiBaseButton>

    <!-- Search Input справа -->
    <div class="search-wrapper">
      <UiBaseInput
        v-model="searchQuery"
        type="text"
        placeholder="ПОИСК"
        @focus="handleFocus"
      >
        <template #icon>
          <SvgoSearchIcon class="search-icon" />
        </template>
      </UiBaseInput>

      <!-- Search Results Dropdown -->
      <div v-if="showResults" class="search-results">
        <!-- Loading -->
        <div v-if="usersStore.searchLoading" class="search-results__loading">
          Поиск...
        </div>

        <!-- Results -->
        <div v-else-if="usersStore.searchResults.length > 0" class="search-results__list">
          <article
            v-for="user in usersStore.searchResults"
            :key="user._id"
            class="search-result-item"
            @click="handleUserClick(user._id)"
          >
            <img
              :src="user.avatar || '/default-avatar.png'"
              :alt="user.name"
              class="search-result-item__avatar"
            />
            <div class="search-result-item__info">
              <h4 class="search-result-item__name">{{ user.name }}</h4>
              <p class="search-result-item__id">{{ user.userId }}</p>
            </div>
          </article>
        </div>

        <!-- Empty -->
        <div v-else class="search-results__empty">
          Пользователи не найдены
        </div>
      </div>

      <!-- Overlay -->
      <div
        v-if="showResults"
        class="search-overlay"
        @click="closeSearch"
      ></div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
/**
 * AppHeader Styles
 *
 * ✅ Единый фон $bg-primary (#212121)
 * ✅ Тень $shadow-block
 * ✅ НЕТ границ (borders)
 * ✅ Hover через opacity (НЕ фон!)
 * ✅ Семантические теги (header, article)
 */

.app-header {
  position: relative;
  width: 100%;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: $radius;
}

// ===== MENU ICON =====

.menu-icon {
  width: 24px;
  height: 24px;
  color: $text-primary;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

// ===== SEARCH WRAPPER =====

.search-wrapper {
  position: relative;
  flex: 1;

  // Переопределяем стили BaseInput для search
  :deep(.base-input__field) {
    padding: 10px 20px 10px 20px;
    background: $bg-primary;
    @include font-styles(14px, 400, 1.5);
  }
}

.search-icon {
  width: 20px;
  height: 20px;
  color: $text-secondary;

  :deep(svg) {
    width: 20px;
    height: 20px;
    color: $text-secondary;
  }
}

// ===== SEARCH RESULTS =====

.search-results {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  background: $bg-primary;
  border: none;
  border-radius: $radius;
  box-shadow: $shadow-block;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;

  &__loading,
  &__empty {
    padding: 2rem;
    text-align: center;
    color: $text-secondary;
    @include font-styles(14px, 400, 1.5);
  }

  &__list {
    padding: 10px;
  }
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: $radius;
  background: $bg-primary; // ✅ Единый фон!
  @include transition;
  cursor: pointer;

  @include hover {
    opacity: 0.8; // ✅ Hover через opacity, НЕ фон!
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    margin: 0;
    @include font-styles(14px, 500, 1.4);
    color: $text-primary;
  }

  &__id {
    margin: 4px 0 0;
    @include font-styles(12px, 400, 1.4);
    color: $text-secondary;
    font-family: monospace;
  }
}

// ===== OVERLAY =====

.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style>
```

**Создай файл:**
```bash
touch frontend/app/components/layout/AppHeader.vue
```

**Объяснение Component Composition:**
- **НЕ создаём отдельный SearchInput.vue** - search встроен inline в AppHeader
- **Используем UiBaseInput** с icon slot вместо отдельного компонента
- **Используем UiBaseButton** variant="icon" для MenuButton
- **Debounce** реализован вручную через setTimeout (300ms)
- **Semantic HTML**: `<header>`, `<article>` для результатов
- **Design System**: `$bg-primary` + `$shadow-block`, hover через `opacity`

---

## 📝 Шаг 7: MenuModal.vue (layout/)

```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h2>МЕНЮ</h2>
          <UiBaseButton
            variant="icon"
            aria-label="Закрыть"
            @click="close"
          >
            <SvgoCloseIcon class="close-icon" />
          </UiBaseButton>
        </header>

        <nav class="modal-nav">
          <UiBaseButton variant="ghost" @click="goToProfile">
            👤 ПРОФИЛЬ
          </UiBaseButton>
          <UiBaseButton variant="ghost" @click="goToSettings">
            ⚙️ НАСТРОЙКИ
          </UiBaseButton>
          <UiBaseButton variant="ghost" @click="handleLogout">
            🚪 ВЫЙТИ
          </UiBaseButton>
        </nav>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * MenuModal Component
 *
 * Component Composition:
 * - UiBaseButton variant="icon" для close button
 * - UiBaseButton variant="ghost" для navigation buttons
 *
 * NOTE: Все импорты автоматические (Nuxt auto-import)
 */

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const authStore = useAuthStore()

const close = () => {
  emit('update:modelValue', false)
}

const goToProfile = () => {
  router.push('/profile')
  close()
}

const goToSettings = () => {
  router.push('/settings')
  close()
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
  close()
}

// Закрытие по Escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue) {
      close()
    }
  }
  window.addEventListener('keydown', handleEscape)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style lang="scss" scoped>
/**
 * MenuModal Styles
 *
 * ✅ Единый фон $bg-primary
 * ✅ Тень $shadow-block
 * ✅ НЕТ границ
 * ✅ Используем UiBaseButton (не кастомные кнопки)
 */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 400px;
  max-width: 90vw;
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-block;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;

  h2 {
    margin: 0;
    @include font-styles(20px, 500, 1.4);
    color: $text-primary;
    text-transform: uppercase; // ✅ Заголовки - uppercase
    letter-spacing: 1px;
  }
}

.close-icon {
  width: 24px;
  height: 24px;
  color: $text-primary;
}

.modal-nav {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  // Кастомизация ghost buttons для navigation
  :deep(.base-button--ghost) {
    width: 100%;
    text-align: left;
    justify-content: flex-start;
    min-width: unset;
  }
}
</style>
```

**Создай файл:**
```bash
touch frontend/app/components/layout/MenuModal.vue
```

**Объяснение:**
- `Teleport to="body"` - рендерит модалку в body (избегаем z-index проблем)
- `v-model` паттерн для открытия/закрытия
- **Component Composition**: используем `UiBaseButton` variant="icon" и "ghost"
- Закрытие по Escape и клику на overlay
- **Design System**: `$bg-primary`, `$shadow-block`, uppercase заголовки

---

## 🏠 Шаг 8: ChatSidebar.vue (layout/)

```vue
<template>
  <aside class="sidebar">
    <!-- AppHeader с MenuButton и SearchInput -->
    <LayoutAppHeader @open-menu="isMenuOpen = true" />

    <!-- Placeholder для списка чатов (День 3) -->
    <div class="chat-list">
      <p class="placeholder">Список чатов появится в День 3</p>
    </div>

    <!-- MenuModal -->
    <LayoutMenuModal v-model="isMenuOpen" />
  </aside>
</template>

<script setup lang="ts">
/**
 * ChatSidebar Component
 *
 * Применяем Component Composition:
 * - LayoutAppHeader (MenuButton + SearchInput)
 * - LayoutMenuModal (модальное меню)
 * - Placeholder для списка чатов (День 3)
 *
 * Применяем адаптивный layout:
 * - Desktop (>859px): 400px max-width
 * - Mobile (≤859px): 100vw
 *
 * NOTE: Все импорты автоматические (Nuxt auto-import)
 * - ref - Vue (auto-import)
 * - LayoutAppHeader - компонент из layout/ (auto-import)
 * - LayoutMenuModal - компонент из layout/ (auto-import)
 */

const isMenuOpen = ref(false)
</script>

<style lang="scss" scoped>
/**
 * ChatSidebar Styles
 *
 * Применяем дизайн-систему:
 * - Единый фон $bg-primary
 * - Тень $shadow-block
 * - НЕТ границ
 * - Адаптивность через mixins
 */

.sidebar {
  width: 100%;
  max-width: 400px;
  background: $bg-primary; // ✅ Единый фон
  box-shadow: $shadow-block; // ✅ Тень для блока
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 10px;
  border: none; // ✅ НЕТ границ!

  @include mobile {
    width: 100vw; // Mobile: на весь экран
    max-width: 100vw;
  }
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  .placeholder {
    text-align: center;
    color: $text-secondary;
    @include font-styles(14px, 400, 1.5);
    margin-top: 40px;
  }
}
</style>
```

**Создай файл:**
```bash
touch frontend/app/components/layout/ChatSidebar.vue
```

**Объяснение:**
- `<aside>` - семантический тег для боковой панели
- Адаптивная ширина: 400px (Desktop), 100vw (Mobile)
- Используем `@include mobile` mixin (max-width: 859px)
- **Component Composition**: LayoutAppHeader + LayoutMenuModal
- Placeholder для списка чатов (День 3)

---

## 🔗 Шаг 9: Интеграция в app.vue

Открой `frontend/app/app.vue` и **замени содержимое**:

```vue
<template>
  <div class="app-layout">
    <LayoutChatSidebar v-if="authStore.isAuthenticated" />

    <main class="chat-window">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * App Layout
 *
 * Desktop (>859px): Sidebar слева (400px), Chat Window справа (flex: 1)
 * Mobile (≤859px): Только Sidebar (100vw), Chat Window скрыт
 *
 * NOTE: LayoutChatSidebar auto-imported (Nuxt)
 */

const authStore = useAuthStore()
</script>

<style lang="scss">
@import '@/assets/styles/main.scss';

.app-layout {
  display: flex;
  height: 100vh;
  background: $bg-primary;

  .chat-window {
    flex: 1;
    overflow-y: auto;

    @include mobile {
      display: none; // Скрываем на Mobile
    }
  }
}
</style>
```

**Объяснение:**
- LayoutChatSidebar отображается только для авторизованных пользователей
- Desktop (>859px): Sidebar слева (400px), Chat Window справа (flex: 1)
- Mobile (≤859px): Только Sidebar (100vw), Chat Window скрыт
- Используем `@include mobile` mixin из mixins.scss

---

## 🧪 Шаг 10: Тестирование

### Тест 1: Запуск и визуальная проверка

1. Запусти Backend:
```bash
docker-compose up -d
```

2. Запусти Frontend:
```bash
cd frontend
yarn dev
```

3. Открой http://localhost:3000

4. Авторизуйся через `/login` (alice@test.com / password123)

5. Проверь визуально:
   - ✅ Sidebar виден слева
   - ✅ MenuButton (иконка) слева в AppHeader
   - ✅ SearchInput справа в AppHeader
   - ✅ Всё выглядит как в макете `appheader (в обычном chatlist).png`

### Тест 2: Адаптивность

1. Открой DevTools (F12) → Responsive Mode (Ctrl+Shift+M)

2. Проверь Desktop (>859px):
   - Sidebar должен быть 400px
   - Chat Window справа (flex: 1)

3. Проверь Mobile (≤859px):
   - Sidebar должен быть 100vw (полный экран)
   - Chat Window скрыт

### Тест 3: MenuButton и MenuModal

1. Кликни на MenuButton (иконка меню)
   - MenuModal должен открыться

2. Нажми Escape
   - MenuModal должен закрыться

3. Открой MenuModal снова и кликни на overlay
   - MenuModal должен закрыться

4. Проверь кнопки:
   - Профиль → редирект на `/profile`
   - Настройки → редирект на `/settings`
   - Выйти → редирект на `/login`, токен удалён

### Тест 4: Глобальный поиск

1. В SearchInput введи "alice"

2. Подожди 300ms (debounce)

3. Проверь:
   - Dropdown с результатами должен открыться
   - Результаты содержат пользователей с "alice" в name/userId/email
   - Должна быть видна Alice Test

4. Кликни на пользователя:
   - Консоль: `User clicked: <userId>`
   - Dropdown закрывается

5. Нажми Escape
   - Dropdown должен закрыться

### Тест 5: Backend интеграция

1. Открой DevTools → Network

2. Введи запрос в SearchInput

3. Проверь что запрос `GET /users/search?query=alice&limit=10` отправлен:
   - Статус ответа: 200 OK
   - Ответ содержит `{ users, total, hasMore }`
   - Header: `Authorization: Bearer <token>`

### Тест 6: Design System

1. Проверь что ВСЕ элементы имеют:
   - ✅ Единый фон `$bg-primary` (#212121)
   - ✅ Тени `$shadow-block` или `$shadow-input`
   - ✅ НЕТ границ (borders)
   - ✅ Hover через `opacity`, НЕ через изменение фона

2. Проверь hover на:
   - BaseButton (icon, ghost variants) - должна меняться opacity
   - Search result item - должна меняться opacity

---

## ✅ Чек-лист завершения

### Файлы созданы:
- [ ] `frontend/app/types/user.types.ts`
- [ ] `frontend/app/services/api/user.service.ts`
- [ ] `frontend/app/stores/users.ts`
- [ ] `frontend/app/components/ui/BaseButton.vue` (расширен icon variant)
- [ ] `frontend/app/components/ui/BaseInput.vue` (расширен icon slot)
- [ ] `frontend/app/components/layout/AppHeader.vue`
- [ ] `frontend/app/components/layout/MenuModal.vue`
- [ ] `frontend/app/components/layout/ChatSidebar.vue`
- [ ] `frontend/app/app.vue` (обновлён)

### Функциональность работает:
- [ ] Sidebar адаптивный (400px / 100vw)
- [ ] MenuButton открывает MenuModal
- [ ] MenuModal закрывается по Escape / клик вне
- [ ] Глобальный поиск работает (debounce 300ms)
- [ ] Dropdown с результатами открывается/закрывается
- [ ] Клик по пользователю логирует userId
- [ ] Кнопки Профиль / Настройки / Выйти работают

### Design System применён:
- [ ] Все элементы имеют `background: $bg-primary`
- [ ] Все элементы выделяются через тени (`$shadow-block`, `$shadow-input`)
- [ ] НЕТ границ (кроме focus состояний)
- [ ] Hover через `opacity`, НЕ через изменение фона
- [ ] Заголовки в uppercase (h2 в MenuModal)
- [ ] Используется единый радиус `$radius`

### Тестирование:
- [ ] Desktop Layout (>859px) работает
- [ ] Mobile Layout (≤859px) работает - Sidebar 100vw, Chat Window скрыт
- [ ] Backend интеграция работает (200 OK)
- [ ] Нет ошибок в консоли
- [ ] Нет ошибок в Network tab

---

## 🎉 Поздравляем!

Ты завершил Frontend часть Дня 2! Теперь у тебя есть:
- ✅ Адаптивный Sidebar (400px / 100vw)
- ✅ AppHeader с MenuButton + SearchInput (Component Composition)
- ✅ MenuModal с навигацией
- ✅ Глобальный поиск пользователей (debounce 300ms)
- ✅ Строгое соблюдение Design System (тени, единый фон, opacity hover)
- ✅ Semantic HTML5 (header, aside, article, nav)
- ✅ Переиспользуемые компоненты (BaseButton, BaseInput)

**Следующий шаг:** День 3 - Список чатов (отображение чатов в Sidebar)

---

## 🎓 Ключевые паттерны, которые ты применил:

1. **Component Composition** - используем BaseButton/BaseInput вместо дубликатов
2. **Service Layer** - API логика в `user.service.ts`, не в компонентах
3. **State Management** - Pinia store для глобального состояния
4. **Design System** - строгие правила (тени, единый фон, opacity hover)
5. **Semantic HTML** - `<header>`, `<aside>`, `<article>`, `<nav>`
6. **Debounce** - оптимизация поиска (300ms)
7. **DRY** - нет дублирования кода, всё переиспользуется

**Время выполнения:** ~2-3 часа
