<template>
  <div id="app">
    <!-- Layout для авторизованных: Sidebar + Content -->
    <div v-if="authStore.isAuthenticated" class="app-layout">
      <LayoutChatSidebar />
      <main class="chat-window">
        <NuxtPage />
      </main>
    </div>

    <!-- Layout для неавторизованных: только контент -->
    <div v-else class="app-auth">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * App Root Component
 *
 * Применяем Component Composition:
 * - LayoutChatSidebar для авторизованных (слева)
 * - NuxtPage для роутинга
 *
 * Layout применен строго по плану Дня 2:
 * - Desktop (>859px): Sidebar 400px max + Chat Window flex: 1
 * - Mobile (≤859px): Sidebar 100vw, Chat Window скрыт
 *
 * Восстановление сессии происходит в plugins/auth.client.ts
 *
 * NOTE: Все импорты автоматические (Nuxt auto-import)
 * - useAuthStore - Pinia store (auto-import)
 * - LayoutChatSidebar - компонент из layout/ (auto-import)
 */

const authStore = useAuthStore()
</script>

<style lang="scss">
// Глобальные стили импортируются из main.scss
@import '@/assets/styles/main.scss';

#app {
  min-height: 100vh;
  background: $bg-primary;
}

// ===== LAYOUT ДЛЯ АВТОРИЗОВАННЫХ =====

.app-layout {
  display: flex; // Flexbox вместо Grid
  height: 100vh;
  overflow: hidden;
  background: $bg-primary;

  .chat-window {
    flex: 1; // Занимает оставшееся пространство
    overflow-y: auto;
    background: $bg-primary;

    @include tablet {
      display: none; // Скрываем Chat Window на планшетах
    }

    @include mobile {
      display: none; // Скрываем Chat Window на мобильных
    }
  }
}

// ===== LAYOUT ДЛЯ НЕАВТОРИЗОВАННЫХ =====

.app-auth {
  min-height: 100vh;
}
</style>
