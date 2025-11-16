# 📖 День 3: Frontend Theory - Chat List UI

> Теория для реализации списка чатов и маршрутизации

---

## 🎯 Что изучим

1. File-based Routing (Nuxt 4)
2. Dynamic Route Params
3. NuxtLink vs router.push
4. Chat Store Pattern (Pinia)
5. Active State Tracking
6. Empty State UI Pattern
7. User Search Integration

---

## 1. File-based Routing (Nuxt 4)

### Концепция

**File-based Routing** - автоматическая генерация маршрутов на основе структуры папки `pages/`

```
pages/
├── index.vue           → / (главная страница)
├── login.vue           → /login
├── register.vue        → /register
└── chat/
    └── [id].vue        → /chat/:id (динамический маршрут)
```

**Правила:**
- Файл `index.vue` → корень маршрута (`/` или `/parent`)
- Имя файла → путь (`about.vue` → `/about`)
- Папка с `[param].vue` → динамический параметр

### pages/index.vue

```vue
<template>
  <div class="layout">
    <!-- Sidebar всегда виден -->
    <LayoutChatSidebar />
    
    <!-- Вложенные маршруты рендерятся здесь -->
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// Это layout-страница, отображает sidebar + содержимое
</script>
```

**Что происходит:**
- URL `/` → показывается index.vue с `<NuxtPage />` (empty state)
- URL `/chat/123` → показывается index.vue + `chat/[id].vue` внутри `<NuxtPage />`

---

## 2. Dynamic Route Params

### [id].vue - Динамический параметр

```
pages/chat/[id].vue → /chat/:id
```

**:id** может быть любым значением: `123`, `abc`, `507f1f77bcf86cd799439011`

### Доступ к параметру

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// Получаем chatId из URL
const chatId = computed(() => route.params.id as string)

// Пример: /chat/123 → chatId.value = '123'
console.log(chatId.value)
</script>
```

### Реактивность

```vue
<script setup lang="ts">
const route = useRoute()
const chatsStore = useChatsStore()

const chatId = computed(() => route.params.id as string)

// Загружаем чат при изменении ID
watch(chatId, async (newId) => {
  if (newId) {
    await chatsStore.getChatById(newId)
  }
}, { immediate: true })
</script>
```

**Что происходит:**
- Пользователь переходит на `/chat/123` → `chatId = '123'` → загружаем чат 123
- Пользователь переходит на `/chat/456` → `chatId = '456'` → загружаем чат 456
- Реактивность через `watch` отслеживает изменения

---

## 3. NuxtLink vs router.push

### NuxtLink (Декларативная навигация)

```vue
<template>
  <NuxtLink :to="`/chat/${chat._id}`" class="chat-item">
    {{ chat.name }}
  </NuxtLink>
</template>
```

**Преимущества:**
- Автоматический prefetch (предзагрузка)
- SEO-friendly (поисковики видят ссылки)
- Простота использования

### router.push (Программная навигация)

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function openChat(chatId: string) {
  // Дополнительная логика перед навигацией
  console.log(`Opening chat ${chatId}`)
  
  router.push(`/chat/${chatId}`)
}
</script>

<template>
  <article @click="openChat(chat._id)" class="chat-item">
    {{ chat.name }}
  </article>
</template>
```

**Когда использовать:**
- Нужна логика перед навигацией
- Навигация внутри функции (не в template)
- Условная навигация

### В нашем случае

```vue
<!-- ChatItem.vue -->
<template>
  <NuxtLink :to="`/chat/${chat._id}`" class="chat-item">
    <!-- Контент чата -->
  </NuxtLink>
</template>
```

**Почему NuxtLink:**
- Простота
- Нативная поддержка Nuxt
- Prefetch страниц

---

## 4. Chat Store Pattern (Pinia)

### Структура Store

```typescript
// stores/chats.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Chat } from '@/types/chat.types'
import { chatService } from '@/services/api/chat.service'

export const useChatsStore = defineStore('chats', () => {
  // State
  const chats = ref<Chat[]>([])
  const currentChat = ref<Chat | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchChats() {
    loading.value = true
    error.value = null
    try {
      const response = await chatService.getUserChats()
      chats.value = response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch chats'
    } finally {
      loading.value = false
    }
  }

  async function createChat(participantId: string) {
    loading.value = true
    error.value = null
    try {
      const newChat = await chatService.createChat({
        type: 'personal',
        participantId
      })
      chats.value.unshift(newChat) // Добавляем в начало списка
      return newChat
    } catch (err: any) {
      error.value = err.message || 'Failed to create chat'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getChatById(chatId: string) {
    loading.value = true
    error.value = null
    try {
      const chat = await chatService.getChatById(chatId)
      currentChat.value = chat
      return chat
    } catch (err: any) {
      error.value = err.message || 'Chat not found'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteChat(chatId: string) {
    try {
      await chatService.deleteChat(chatId)
      // Удаляем из локального списка
      chats.value = chats.value.filter(chat => chat._id !== chatId)
    } catch (err: any) {
      error.value = err.message || 'Failed to delete chat'
      throw err
    }
  }

  return {
    chats,
    currentChat,
    loading,
    error,
    fetchChats,
    createChat,
    getChatById,
    deleteChat
  }
})
```

### Использование в компоненте

```vue
<script setup lang="ts">
import { useChatsStore } from '@/stores/chats'

const chatsStore = useChatsStore()

// Загружаем чаты при монтировании
onMounted(() => {
  chatsStore.fetchChats()
})
</script>

<template>
  <div v-if="chatsStore.loading">Loading...</div>
  <div v-else-if="chatsStore.error">{{ chatsStore.error }}</div>
  <div v-else>
    <article v-for="chat in chatsStore.chats" :key="chat._id">
      {{ chat.name }}
    </article>
  </div>
</template>
```

---

## 5. Active State Tracking

### Проблема

Как показать что текущий чат активен в списке?

### Решение - Computed Property

```vue
<!-- ChatItem.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Chat } from '@/types/chat.types'

interface Props {
  chat: Chat
}

const props = defineProps<Props>()
const route = useRoute()

// Проверяем совпадает ли ID чата с текущим маршрутом
const isActive = computed(() => {
  return route.params.id === props.chat._id
})
</script>

<template>
  <NuxtLink
    :to="`/chat/${chat._id}`"
    class="chat-item"
    :class="{ 'chat-item--active': isActive }"
  >
    <!-- Контент -->
  </NuxtLink>
</template>

<style lang="scss" scoped>
.chat-item {
  background: $bg-primary;
  box-shadow: $shadow-block;
  @include transition;

  @include hover {
    opacity: 0.8;
  }

  // Active state
  &--active {
    box-shadow: $shadow-block, 0 0 15px rgba($color-accent, 0.3);
  }
}
</style>
```

**Что происходит:**
- URL `/chat/123` → route.params.id = '123'
- ChatItem с chat._id = '123' → isActive = true → добавляется класс `chat-item--active`
- Другие ChatItem → isActive = false → нет класса

---

## 6. Empty State UI Pattern

### Проблема

Что показывать когда чатов нет?

### Решение - v-if / v-else

```vue
<template>
  <div class="sidebar-content">
    <!-- Loading state -->
    <div v-if="chatsStore.loading" class="empty-state">
      <p>Loading chats...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="chatsStore.error" class="empty-state">
      <p class="error">{{ chatsStore.error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="chatsStore.chats.length === 0" class="empty-state">
      <p>No chats yet</p>
      <p class="empty-state__hint">Search for users to start a chat</p>
    </div>

    <!-- Chats list -->
    <div v-else class="chats-list">
      <ChatItem
        v-for="chat in chatsStore.chats"
        :key="chat._id"
        :chat="chat"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: $text-secondary;

  &__hint {
    margin-top: 8px;
    font-size: 14px;
    color: $text-placeholder;
  }

  .error {
    color: #F44336;
  }
}
</style>
```

**Порядок проверок:**
1. `loading` → показываем "Loading..."
2. `error` → показываем ошибку
3. `chats.length === 0` → показываем Empty State
4. Иначе → показываем список чатов

---

## 7. User Search Integration

### Проблема

Как создать чат при клике на пользователя из поиска?

### Решение - Emit Event → Create Chat → Navigate

#### Шаг 1: AppHeader эмитит событие

```vue
<!-- AppHeader.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  'user-selected': [userId: string]
}>()

function handleUserClick(userId: string) {
  emit('user-selected', userId)
}
</script>

<template>
  <div v-if="showResults" class="search-results">
    <article
      v-for="user in usersStore.searchResults"
      :key="user._id"
      @click="handleUserClick(user._id)"
      class="user-card"
    >
      {{ user.name }}
    </article>
  </div>
</template>
```

#### Шаг 2: ChatSidebar обрабатывает событие

```vue
<!-- ChatSidebar.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useChatsStore } from '@/stores/chats'

const router = useRouter()
const chatsStore = useChatsStore()

async function handleUserSelected(userId: string) {
  try {
    // Создаём чат
    const chat = await chatsStore.createChat(userId)
    
    // Перенаправляем на созданный чат
    router.push(`/chat/${chat._id}`)
    
    // Закрываем поиск
    searchQuery.value = ''
    showResults.value = false
  } catch (error) {
    console.error('Failed to create chat:', error)
  }
}
</script>

<template>
  <aside class="sidebar">
    <LayoutAppHeader
      v-model:search-query="searchQuery"
      v-model:show-results="showResults"
      @user-selected="handleUserSelected"
    />
    
    <!-- Чаты -->
  </aside>
</template>
```

**Что происходит:**
1. Пользователь вводит запрос в поиск
2. Показываются результаты
3. Клик на пользователя → emit('user-selected', userId)
4. ChatSidebar получает событие → createChat(userId)
5. Backend создаёт чат (или возвращает существующий)
6. router.push(`/chat/${chat._id}`) → переход на чат
7. Поиск закрывается

### Обработка дубликатов

**Backend автоматически проверяет дубликаты:**

```typescript
// Backend: ChatsService.createChat()
if (dto.type === 'personal') {
  const existingChat = await this.findPersonalChat(currentUserId, dto.participantId);
  if (existingChat) {
    return existingChat; // Возвращаем существующий чат
  }
}
```

**Frontend просто получает чат:**

```typescript
const chat = await chatsStore.createChat(userId)
// Если чат существует → получаем его ID
// Если нет → создаётся новый
router.push(`/chat/${chat._id}`)
```

---

## 📚 Дополнительно

### Оптимизация: Prefetch Chats

```vue
<script setup lang="ts">
import { useChatsStore } from '@/stores/chats'

const chatsStore = useChatsStore()

// Загружаем чаты один раз при монтировании приложения
onMounted(() => {
  if (chatsStore.chats.length === 0) {
    chatsStore.fetchChats()
  }
})
</script>
```

### Обработка несуществующего чата

```vue
<!-- pages/chat/[id].vue -->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useChatsStore } from '@/stores/chats'

const route = useRoute()
const router = useRouter()
const chatsStore = useChatsStore()

const chatId = computed(() => route.params.id as string)

watch(chatId, async (newId) => {
  try {
    await chatsStore.getChatById(newId)
  } catch (error) {
    // Чат не найден → редирект на главную
    router.push('/')
  }
}, { immediate: true })
</script>
```

### Сортировка чатов

```typescript
// Backend: ChatsService.getUserChats()
return this.chatModel
  .find({ participants: userId, isDeleted: false })
  .populate('participants', '-password -refreshToken')
  .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 }) // Сортировка
  .lean();
```

**Порядок:**
1. По `lastMessage.createdAt` (DESC) - чаты с последними сообщениями сверху
2. По `updatedAt` (DESC) - для чатов без сообщений

---

## ✅ Резюме

**Изучили:**
1. ✅ File-based Routing (pages/ → маршруты)
2. ✅ Dynamic Route Params ([id].vue → :id)
3. ✅ NuxtLink vs router.push (декларативная vs программная навигация)
4. ✅ Chat Store Pattern (Pinia Composition API)
5. ✅ Active State Tracking (computed isActive)
6. ✅ Empty State UI (v-if/v-else для состояний)
7. ✅ User Search Integration (emit → createChat → navigate)

**Следующий шаг:** [Practice.md](./Practice.md) - реализация кода

---

**Время изучения:** ~1.5-2 часа
