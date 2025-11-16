# 🛠️ День 3: Frontend Practice - Chat List UI

> Пошаговая реализация списка чатов и маршрутизации

---

## 🎯 Что реализуем

1. **chat.types.ts** - типы для чатов
2. **chat.service.ts** - API для работы с чатами
3. **chats.ts** - Pinia store
4. **ChatItem.vue** - компонент карточки чата
5. **pages/index.vue** - главная страница с sidebar
6. **pages/chat/[id].vue** - страница чата
7. **ChatSidebar интеграция** - добавляем список чатов
8. **User Search → Create Chat** - создание чата из поиска
9. **Тестирование**

---

## Шаг 1: chat.types.ts

Создаём типы для чатов.

**Файл:** `frontend/app/types/chat.types.ts`

```typescript
import type { User } from './user.types'

/**
 * Тип чата
 */
export type ChatType = 'personal' | 'group' | 'channel'

/**
 * Последнее сообщение в чате
 */
export interface LastMessage {
  text: string
  sender: string // User ID
  createdAt: string
}

/**
 * Чат (модель из backend)
 */
export interface Chat {
  _id: string
  type: ChatType
  participants: User[] // Populated users
  name?: string
  lastMessage?: LastMessage
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

/**
 * DTO для создания чата
 */
export interface CreateChatDto {
  type: ChatType
  participantId: string
  name?: string
}

/**
 * Ответ API GET /chats
 */
export type GetChatsResponse = Chat[]

/**
 * Ответ API POST /chats
 */
export type CreateChatResponse = Chat

/**
 * Ответ API GET /chats/:id
 */
export type GetChatByIdResponse = Chat
```

**Объяснение:**
- `Chat` - полная модель чата с populated participants
- `CreateChatDto` - данные для создания чата
- Response типы для API endpoints

---

## Шаг 2: chat.service.ts

Создаём API сервис для работы с чатами.

**Файл:** `frontend/app/services/api/chat.service.ts`

```typescript
import type {
  Chat,
  CreateChatDto,
  GetChatsResponse,
  CreateChatResponse,
  GetChatByIdResponse
} from '@/types/chat.types'

/**
 * Chat API Service
 */
class ChatService {
  private baseUrl = '/api/chats'

  /**
   * GET /chats - Получить список чатов пользователя
   */
  async getUserChats(): Promise<GetChatsResponse> {
    const { data, error } = await useFetch<GetChatsResponse>(this.baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    })

    if (error.value) {
      throw new Error(error.value.message || 'Failed to fetch chats')
    }

    return data.value || []
  }

  /**
   * POST /chats - Создать новый чат
   */
  async createChat(dto: CreateChatDto): Promise<CreateChatResponse> {
    const { data, error } = await useFetch<CreateChatResponse>(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: dto
    })

    if (error.value) {
      throw new Error(error.value.message || 'Failed to create chat')
    }

    if (!data.value) {
      throw new Error('No data returned from server')
    }

    return data.value
  }

  /**
   * GET /chats/:id - Получить детали чата
   */
  async getChatById(chatId: string): Promise<GetChatByIdResponse> {
    const { data, error } = await useFetch<GetChatByIdResponse>(
      `${this.baseUrl}/${chatId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    )

    if (error.value) {
      throw new Error(error.value.message || 'Chat not found')
    }

    if (!data.value) {
      throw new Error('Chat not found')
    }

    return data.value
  }

  /**
   * DELETE /chats/:id - Удалить чат
   */
  async deleteChat(chatId: string): Promise<void> {
    const { error } = await useFetch(`${this.baseUrl}/${chatId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    })

    if (error.value) {
      throw new Error(error.value.message || 'Failed to delete chat')
    }
  }

  /**
   * Получить токен из localStorage
   */
  private getToken(): string {
    if (process.client) {
      return localStorage.getItem('token') || ''
    }
    return ''
  }
}

export const chatService = new ChatService()
```

**Объяснение:**
- Используем `useFetch` из Nuxt
- Добавляем JWT токен в headers
- Обрабатываем ошибки

---

## Шаг 3: chats.ts Store

Создаём Pinia store для управления состоянием чатов.

**Файл:** `frontend/app/stores/chats.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Chat, CreateChatDto } from '@/types/chat.types'
import { chatService } from '@/services/api/chat.service'

export const useChatsStore = defineStore('chats', () => {
  // State
  const chats = ref<Chat[]>([])
  const currentChat = ref<Chat | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasChats = computed(() => chats.value.length > 0)

  // Actions
  /**
   * Загрузить список чатов
   */
  async function fetchChats() {
    loading.value = true
    error.value = null
    try {
      const response = await chatService.getUserChats()
      chats.value = response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch chats'
      console.error('fetchChats error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Создать новый чат
   */
  async function createChat(participantId: string): Promise<Chat> {
    loading.value = true
    error.value = null
    try {
      const dto: CreateChatDto = {
        type: 'personal',
        participantId
      }
      
      const newChat = await chatService.createChat(dto)
      
      // Проверяем есть ли уже такой чат в списке
      const existingIndex = chats.value.findIndex(c => c._id === newChat._id)
      
      if (existingIndex === -1) {
        // Добавляем новый чат в начало списка
        chats.value.unshift(newChat)
      } else {
        // Обновляем существующий чат
        chats.value[existingIndex] = newChat
      }
      
      return newChat
    } catch (err: any) {
      error.value = err.message || 'Failed to create chat'
      console.error('createChat error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Получить детали чата по ID
   */
  async function getChatById(chatId: string): Promise<Chat> {
    loading.value = true
    error.value = null
    try {
      const chat = await chatService.getChatById(chatId)
      currentChat.value = chat
      return chat
    } catch (err: any) {
      error.value = err.message || 'Chat not found'
      console.error('getChatById error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Удалить чат
   */
  async function deleteChat(chatId: string): Promise<void> {
    try {
      await chatService.deleteChat(chatId)
      
      // Удаляем из локального списка
      chats.value = chats.value.filter(chat => chat._id !== chatId)
      
      // Очищаем currentChat если это был он
      if (currentChat.value?._id === chatId) {
        currentChat.value = null
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete chat'
      console.error('deleteChat error:', err)
      throw err
    }
  }

  /**
   * Очистить ошибку
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    chats,
    currentChat,
    loading,
    error,
    // Getters
    hasChats,
    // Actions
    fetchChats,
    createChat,
    getChatById,
    deleteChat,
    clearError
  }
})
```

**Объяснение:**
- Composition API style (setup function)
- `fetchChats()` - загружает список чатов
- `createChat()` - создаёт чат и добавляет в список
- `getChatById()` - загружает детали чата
- `deleteChat()` - удаляет чат
- `hasChats` - computed для проверки есть ли чаты

---

## Шаг 4: ChatItem.vue

Создаём компонент карточки чата.

**Файл:** `frontend/app/components/ChatItem.vue`

```vue
<template>
  <NuxtLink
    :to="`/chat/${chat._id}`"
    class="chat-item"
    :class="{ 'chat-item--active': isActive }"
  >
    <div class="chat-item__avatar">
      {{ otherParticipant?.name.charAt(0).toUpperCase() || '?' }}
    </div>

    <div class="chat-item__content">
      <div class="chat-item__header">
        <h3 class="chat-item__name">
          {{ otherParticipant?.name || 'Unknown' }}
        </h3>
        <span v-if="chat.lastMessage" class="chat-item__time">
          {{ formatTime(chat.lastMessage.createdAt) }}
        </span>
      </div>

      <div class="chat-item__footer">
        <p v-if="chat.lastMessage" class="chat-item__message">
          {{ chat.lastMessage.text }}
        </p>
        <p v-else class="chat-item__message chat-item__message--empty">
          No messages yet
        </p>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Chat } from '@/types/chat.types'
import { useAuthStore } from '@/stores/auth'

interface Props {
  chat: Chat
}

const props = defineProps<Props>()
const route = useRoute()
const authStore = useAuthStore()

/**
 * Проверяем активен ли этот чат
 */
const isActive = computed(() => {
  return route.params.id === props.chat._id
})

/**
 * Получаем собеседника (другого участника)
 */
const otherParticipant = computed(() => {
  return props.chat.participants.find(
    (p) => p._id !== authStore.user?._id
  )
})

/**
 * Форматирование времени
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  // Возвращаем дату в формате DD.MM
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}
</script>

<style lang="scss" scoped>
.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: $radius;
  text-decoration: none;
  color: $text-primary;
  @include transition;

  @include hover {
    opacity: 0.8;
  }

  &--active {
    box-shadow: $shadow-block, 0 0 15px rgba($color-accent, 0.3);
  }

  &__avatar {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: $bg-input;
    box-shadow: $shadow-input;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: $text-primary;
    text-transform: uppercase;
  }

  &__content {
    flex: 1;
    min-width: 0; // Для text-overflow
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__name {
    font-size: 16px;
    font-weight: bold;
    color: $text-primary;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }

  &__time {
    flex-shrink: 0;
    font-size: 12px;
    color: $text-secondary;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__message {
    flex: 1;
    font-size: 14px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;

    &--empty {
      font-style: italic;
      color: $text-placeholder;
    }
  }
}
</style>
```

**Объяснение:**
- `NuxtLink` для навигации на `/chat/:id`
- `isActive` computed для подсветки активного чата
- `otherParticipant` для отображения собеседника
- `formatTime()` для красивого отображения времени (now, 5m, 2h, 3d, 12.01)
- Дизайн: unified background, shadow для объёма, активный чат подсвечивается accent shadow

---

## Шаг 5: pages/index.vue

Создаём главную страницу с sidebar.

**Файл:** `frontend/app/pages/index.vue`

```vue
<template>
  <main class="layout">
    <LayoutChatSidebar />
    
    <section class="content">
      <NuxtPage />
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth' // Требуется авторизация
})
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  height: 100vh;
  background: $bg-primary;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  @include mobile {
    display: none; // На мобильных скрываем, показываем только sidebar
  }
}
</style>
```

**Объяснение:**
- `<NuxtPage />` - здесь рендерятся дочерние маршруты (например, `/chat/:id`)
- `middleware: 'auth'` - страница требует авторизации
- Flexbox layout: sidebar слева, content справа

---

## Шаг 6: pages/chat/[id].vue

Создаём страницу чата (пока заглушка).

**Файл:** `frontend/app/pages/chat/[id].vue`

```vue
<template>
  <div class="chat-page">
    <div v-if="chatsStore.loading" class="loading">
      Loading chat...
    </div>

    <div v-else-if="chatsStore.error" class="error">
      <p>{{ chatsStore.error }}</p>
      <UiBaseButton variant="secondary" @click="router.push('/')">
        Back to chats
      </UiBaseButton>
    </div>

    <div v-else-if="chatsStore.currentChat" class="chat-content">
      <header class="chat-header">
        <h1>{{ otherParticipant?.name || 'Chat' }}</h1>
      </header>

      <div class="chat-messages">
        <p class="placeholder">Messages will appear here (Day 4-5)</p>
      </div>

      <div class="chat-input">
        <p class="placeholder">Message input will appear here (Day 4-5)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatsStore } from '@/stores/chats'
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const chatsStore = useChatsStore()
const authStore = useAuthStore()

const chatId = computed(() => route.params.id as string)

/**
 * Получаем собеседника
 */
const otherParticipant = computed(() => {
  if (!chatsStore.currentChat) return null
  
  return chatsStore.currentChat.participants.find(
    (p) => p._id !== authStore.user?._id
  )
})

/**
 * Загружаем чат при изменении ID
 */
watch(chatId, async (newId) => {
  if (newId) {
    try {
      await chatsStore.getChatById(newId)
    } catch (error) {
      console.error('Failed to load chat:', error)
      // Редирект на главную если чат не найден
      router.push('/')
    }
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.chat-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $bg-primary;
}

.loading,
.error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: $text-secondary;
}

.error {
  color: #F44336;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $bg-primary;
}

.chat-header {
  padding: 16px 24px;
  background: $bg-primary;
  box-shadow: $shadow-block;

  h1 {
    margin: 0;
    font-size: 20px;
    text-transform: uppercase;
    color: $text-primary;
  }
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-input {
  padding: 16px 24px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder {
  color: $text-placeholder;
  font-style: italic;
  margin: 0;
}
</style>
```

**Объяснение:**
- `watch(chatId)` - загружаем чат при изменении URL
- Обработка ошибок: редирект на главную если чат не найден
- Пока заглушка, полный функционал будет в Day 4-5

---

## Шаг 7: ChatSidebar Интеграция

Обновляем ChatSidebar для отображения списка чатов.

**Файл:** `frontend/app/components/layout/ChatSidebar.vue`

Добавляем/изменяем:

```vue
<template>
  <aside class="sidebar">
    <LayoutAppHeader
      v-model:search-query="searchQuery"
      v-model:show-results="showResults"
      @user-selected="handleUserSelected"
    />

    <div class="sidebar__content">
      <!-- Search Results -->
      <div v-if="showResults && searchQuery.length >= 2" class="search-results">
        <div v-if="usersStore.searchLoading" class="loading">
          Searching...
        </div>

        <div v-else-if="usersStore.searchError" class="error">
          {{ usersStore.searchError }}
        </div>

        <div v-else-if="usersStore.searchResults.length === 0" class="empty">
          No users found
        </div>

        <article
          v-for="user in usersStore.searchResults"
          :key="user._id"
          @click="handleUserClick(user._id)"
          class="user-card"
        >
          <div class="user-card__avatar">
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
          <div class="user-card__info">
            <p class="user-card__name">{{ user.name }}</p>
            <p class="user-card__username">@{{ user.userId }}</p>
          </div>
        </article>
      </div>

      <!-- Chats List -->
      <div v-else class="chats">
        <div v-if="chatsStore.loading && !chatsStore.hasChats" class="loading">
          Loading chats...
        </div>

        <div v-else-if="chatsStore.error" class="error">
          {{ chatsStore.error }}
        </div>

        <div v-else-if="!chatsStore.hasChats" class="empty-state">
          <p>No chats yet</p>
          <p class="empty-state__hint">Search for users to start a chat</p>
        </div>

        <div v-else class="chats-list">
          <ChatItem
            v-for="chat in chatsStore.chats"
            :key="chat._id"
            :chat="chat"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useChatsStore } from '@/stores/chats'

const router = useRouter()
const usersStore = useUsersStore()
const chatsStore = useChatsStore()

const searchQuery = ref('')
const showResults = ref(false)

let debounceTimer: NodeJS.Timeout | null = null

/**
 * Поиск пользователей с debounce
 */
watch(searchQuery, (newQuery) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    if (newQuery.length >= 2) {
      await usersStore.searchUsers({ query: newQuery, limit: 10 })
      showResults.value = true
    } else {
      usersStore.clearSearch()
      showResults.value = false
    }
  }, 300)
})

/**
 * Обработка клика на пользователя из поиска
 */
async function handleUserClick(userId: string) {
  try {
    const chat = await chatsStore.createChat(userId)
    router.push(`/chat/${chat._id}`)
    searchQuery.value = ''
    showResults.value = false
  } catch (error) {
    console.error('Failed to create chat:', error)
  }
}

/**
 * Обработка события user-selected из AppHeader
 */
function handleUserSelected(userId: string) {
  handleUserClick(userId)
}

/**
 * Загружаем чаты при монтировании
 */
onMounted(() => {
  if (!chatsStore.hasChats) {
    chatsStore.fetchChats()
  }
})
</script>

<style lang="scss" scoped>
// ... existing styles ...

.chats {
  flex: 1;
  overflow-y: auto;
}

.chats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: $text-secondary;

  &__hint {
    margin-top: 8px;
    font-size: 14px;
    color: $text-placeholder;
  }
}

.loading,
.error {
  padding: 32px 16px;
  text-align: center;
  color: $text-secondary;
}

.error {
  color: #F44336;
}
</style>
```

**Объяснение:**
- Условный рендеринг: поиск или список чатов
- `onMounted(() => chatsStore.fetchChats())` - загружаем чаты при монтировании
- `handleUserClick()` - создаём чат и переходим на него
- Empty state для пустого списка

---

## Шаг 8: User Search → Create Chat

**Уже реализовано в Шаге 7!**

Логика:
1. Пользователь вводит запрос → дебаунс 300ms → `usersStore.searchUsers()`
2. Показываются результаты поиска
3. Клик на пользователя → `handleUserClick(userId)`
4. `chatsStore.createChat(userId)` → backend создаёт или возвращает чат
5. `router.push(/chat/${chat._id})` → переход на чат
6. `searchQuery = ''` → закрываем поиск

---

## Шаг 9: Тестирование

### 1. Запускаем проект

```bash
# Backend
cd backend
yarn start:dev

# Frontend (в другом терминале)
cd frontend
yarn dev
```

### 2. Проверяем функциональность

**Тест 1: Empty State**
- Открываем `http://localhost:3000`
- Должен показаться sidebar с "No chats yet"

**Тест 2: Создание чата через поиск**
- Вводим имя пользователя в поиск
- Ждём результаты (300ms debounce)
- Кликаем на пользователя
- Должен создаться чат и произойти редирект на `/chat/:id`
- В sidebar должна появиться карточка чата

**Тест 3: Список чатов**
- Обновляем страницу
- Должен загрузиться список чатов
- Чат созданный в Тесте 2 должен отображаться

**Тест 4: Навигация между чатами**
- Кликаем на чат в списке
- URL должен измениться на `/chat/:id`
- Активный чат должен подсветиться (accent shadow)
- В content должна показаться страница чата

**Тест 5: Active State**
- Открываем чат
- Карточка чата в sidebar должна иметь accent shadow
- Переходим на другой чат
- Первый чат теряет active state, второй получает

**Тест 6: Дубликат чата**
- Ищем того же пользователя
- Кликаем на него
- Должен открыться СУЩЕСТВУЮЩИЙ чат (не создаётся новый)

**Тест 7: Несуществующий чат**
- Переходим на `/chat/invalid-id`
- Должен показаться error
- Должен произойти редирект на `/`

**Тест 8: lastMessage**
- Чаты должны показывать "No messages yet" если нет lastMessage
- (В Day 4-5 будем тестировать с реальными сообщениями)

### 3. Проверяем DevTools

**Console:**
- Не должно быть ошибок
- При переходе между чатами должны логироваться `getChatById` вызовы

**Network:**
- GET `/api/chats` при загрузке страницы
- POST `/api/chats` при создании чата
- GET `/api/chats/:id` при переходе на чат

**Vue DevTools:**
- `useChatsStore` должен содержать список чатов
- `currentChat` должен обновляться при переходе между чатами

---

## ✅ Критерии завершения

День 3 Frontend считается завершённым когда:

### Основное
- [x] `chat.types.ts` создан с типами
- [x] `chat.service.ts` создан с API методами
- [x] `chats.ts` store создан (Pinia)
- [x] `ChatItem.vue` компонент создан
- [x] `pages/index.vue` создана
- [x] `pages/chat/[id].vue` создана
- [x] `ChatSidebar` интегрирован со списком чатов

### Функциональность
- [x] Список чатов отображается
- [x] Empty state показывается когда чатов нет
- [x] Loading state показывается при загрузке
- [x] Клик на чат переходит на `/chat/:id`
- [x] Active state подсвечивает текущий чат
- [x] User Search → Create Chat работает
- [x] Дубликат чата не создаётся
- [x] ChatItem показывает:
  - Аватар (первая буква имени)
  - Имя собеседника (uppercase)
  - Последнее сообщение или "No messages yet"
  - Время последнего сообщения (форматированное)

### Качество
- [x] Код следует PATTERNS_CHECKLIST.md
- [x] Дизайн следует DESIGN_REFERENCE.md:
  - Unified background (`$bg-primary`)
  - Shadows (`$shadow-block`, `$shadow-input`)
  - No borders
  - Hover через opacity
  - Active state через accent shadow
- [x] TypeScript типы определены
- [x] Semantic HTML используется
- [x] Responsive layout (mobile/desktop)
- [x] Нет console ошибок

---

## 🎉 Поздравляем!

Если все пункты выполнены, ты завершил Frontend часть Дня 3!

**Следующий шаг:**
- Протестировать всё вместе с Backend
- Переходить к Day 4 (Messages API + Real-time)

---

**Время выполнения:** ~2-3 часа
