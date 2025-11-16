<template>
  <main class="chat-page" :class="{ 'chat-page--leaving': isLeaving }">
    <!-- Loading State -->
    <div v-if="chatsStore.currentChatLoading || previewLoading" class="chat-page__loading">
      <p>{{ isPreviewMode ? 'Загрузка пользователя...' : 'Загрузка чата...' }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="chatsStore.chatsError || previewError" class="chat-page__error">
      <p>{{ chatsStore.chatsError || previewError }}</p>
      <UiBaseButton variant="secondary" @click="handleRetry">
        Повторить
      </UiBaseButton>
      <UiBaseButton variant="secondary" @click="handleBack">
        Назад к списку
      </UiBaseButton>
    </div>

    <!-- Chat Content (normal mode with chat OR preview mode with user) -->
    <div v-else-if="chatsStore.currentChat || (isPreviewMode && previewUser)" class="chat-page__content">
      <!-- Chat Header -->
      <ChatHeader
        :title="chatName"
        :subtitle="chatSubtitle"
        :avatar="chatAvatar"
        @back="handleBack"
        @call="handleCall"
        @menu="handleMenu"
      />

      <!-- Chat Rules (Empty Chat Placeholder) -->
      <section class="chat-rules">
        <div class="chat-rules__card">
          <h2 class="chat-rules__title">{{ chatName }}</h2>
          <p class="chat-rules__description">
            Это ваш чат. Здесь можно обмениваться с вашим собеседником.
          </p>
          <ul class="chat-rules__list">
            <li>Никому не говорить об этом чате (даже собеседнику);</li>
            <li>Не материться, а то тоже накажу;</li>
            <li>Не следовать 1 правилу.</li>
          </ul>
        </div>
      </section>

      <!-- Message Input with inline buttons and external Send button -->
      <footer class="chat-input">
        <UiBaseInput
          v-model="messageText"
          type="text"
          placeholder="СООБЩЕНИЕ"
          @enter="handleSendMessage"
        >
          <template #rightAction>
            <UiBaseButton
              variant="input-icon"
              aria-label="Эмодзи"
              @click="handleEmoji"
            >
              <SvgoStickerIcon />
            </UiBaseButton>
            <UiBaseButton
              variant="input-icon"
              aria-label="Прикрепить файл"
              @click="handleAttach"
            >
              <SvgoClipIcon />
            </UiBaseButton>
          </template>
        </UiBaseInput>

        <!-- Send Button (outside input) -->
        <UiBaseButton
          variant="icon"
          aria-label="Отправить"
          @click="handleSendMessage"
        >
          <SvgoSendIcon />
        </UiBaseButton>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * Chat Page ([id].vue)
 *
 * Применяем паттерны:
 * - Dynamic Route (Nuxt 4 auto-routing)
 * - Store Integration
 * - Conditional Rendering
 */

// ===== ROUTE =====

const route = useRoute()
const chatId = route.params.id as string
const isPreviewMode = computed(() => route.query.preview === 'true')

// ===== STORE =====

const chatsStore = useChatsStore()
const authStore = useAuthStore()

// ===== STATE =====

const messageText = ref('')
const previewUser = ref<any>(null) // User data for preview mode
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const isLeaving = ref(false) // Флаг для анимации выхода

// ===== COMPOSABLES =====

/**
 * Данные чата через composables
 */
const chatName = useChatName(computed(() => chatsStore.currentChat), previewUser)
const chatSubtitle = useChatSubtitle(computed(() => chatsStore.currentChat), previewUser)
const chatAvatar = useChatAvatar(computed(() => chatsStore.currentChat), previewUser)

// ===== LIFECYCLE =====

/**
 * При монтировании загружаем чат или пользователя (preview mode)
 */
onMounted(async () => {
  if (isPreviewMode.value) {
    // Preview mode: загружаем данные пользователя
    await loadPreviewUser()
  } else {
    // Normal mode: загружаем чат
    chatsStore.loadChatById(chatId)
  }
})

/**
 * При размонтировании очищаем текущий чат
 */
onUnmounted(() => {
  chatsStore.clearCurrentChat()
  previewUser.value = null
  previewError.value = null
})

// ===== METHODS =====

/**
 * Загрузка данных пользователя для preview mode
 */
async function loadPreviewUser() {
  previewLoading.value = true
  previewError.value = null

  try {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()

    // Сначала проверяем, существует ли уже чат с этим пользователем
    const checkResponse = await $fetch(`/chats/find-or-check/${chatId}`, {
      baseURL: config.public.apiBase,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })

    if (checkResponse.exists && checkResponse.chat) {
      // Чат уже существует - редирект на обычный режим
      navigateTo(`/chat/${checkResponse.chat._id}`)
      return
    }

    // Чат не существует - загружаем данные пользователя для preview
    const user = await $fetch(`/users/${chatId}`, {
      baseURL: config.public.apiBase,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })
    previewUser.value = user
  } catch (err: any) {
    previewError.value = err.message || 'Ошибка загрузки пользователя'
    console.error('Load preview user error:', err)
  } finally {
    previewLoading.value = false
  }
}

/**
 * Назад к списку чатов с плавной анимацией
 */
function handleBack() {
  // Включаем анимацию выхода
  isLeaving.value = true

  // Ждем завершения анимации (350ms) перед навигацией
  setTimeout(() => {
    navigateTo('/')
  }, 350)
}

/**
 * Повторная загрузка чата
 */
function handleRetry() {
  chatsStore.loadChatById(chatId)
}

/**
 * Звонок (TODO: Day 7 - WebRTC)
 */
function handleCall() {
  console.log('Call clicked')
}

/**
 * Меню чата (TODO: Day 4)
 */
function handleMenu() {
  console.log('Menu clicked')
}

/**
 * Отправка сообщения
 */
async function handleSendMessage() {
  if (!messageText.value.trim()) return

  // Preview mode: создаём чат при отправке первого сообщения
  if (isPreviewMode.value && previewUser.value) {
    try {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      // Создаём personal чат
      const chat = await $fetch('/chats', {
        baseURL: config.public.apiBase,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        },
        body: {
          type: 'personal',
          participantId: previewUser.value._id
        }
      })

      // Редирект на созданный чат (уже без preview)
      navigateTo(`/chat/${chat._id}`)

      // TODO: После редиректа отправить сообщение (будет реализовано с messages)
      console.log('Chat created, message will be sent:', messageText.value)

    } catch (err: any) {
      console.error('Create chat error:', err)
      previewError.value = 'Ошибка создания чата'
    }
    return
  }

  // Normal mode: отправка сообщения (TODO: Day 5)
  console.log('Send message:', messageText.value)
  messageText.value = ''
}

/**
 * Прикрепить файл (TODO: Day 6)
 */
function handleAttach() {
  console.log('Attach clicked')
}

/**
 * Эмодзи (TODO: Day 6)
 */
function handleEmoji() {
  console.log('Emoji clicked')
}
</script>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-primary;
  width: 100%;

  // Плавная анимация выхода
  &--leaving {
    animation: fadeOut 0.35s ease-out forwards;
  }

  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    height: 100%;
    color: $text-secondary;
    padding: 32px;
    @include transition; // Плавная анимация
    animation: fadeIn 0.35s ease-out;
  }

  &__error {
    color: #F44336;

    p {
      color: #F44336;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px;
    @include transition; // Плавная анимация
    animation: fadeIn 0.35s ease-out;
  }
}

// ===== CHAT RULES (Empty Chat Placeholder) =====

.chat-rules {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  overflow-y: auto;

  &__card {
    max-width: 500px;
    padding: 32px 24px;
    background: $bg-primary;
    box-shadow: $shadow-block;
    border-radius: $radius;
    border: none;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: $text-primary;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0 0 16px 0;
    text-align: center;
  }

  &__description {
    font-size: 14px;
    color: $text-secondary;
    margin: 0 0 16px 0;
    text-align: center;
    line-height: 1.6;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    li {
      font-size: 14px;
      color: $text-secondary;
      padding-left: 24px;
      position: relative;
      line-height: 1.6;

      &::before {
        content: '•';
        position: absolute;
        left: 8px;
        color: $color-accent;
        font-weight: 700;
      }
    }
  }
}

// ===== CHAT INPUT FOOTER =====

.chat-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-block;

  // Override BaseInput styles for chat
  :deep(.base-input) {
    flex: 1;
    gap: 0;
  }

  :deep(.base-input__field) {
    background: $bg-input;
    box-shadow: $shadow-input;
  }
}

// ===== ANIMATIONS =====

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
