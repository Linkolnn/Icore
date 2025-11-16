<template>
  <aside class="sidebar">
    <!-- AppHeader с MenuButton и SearchInput -->
    <LayoutAppHeader
      v-model:search-query="searchQuery"
      v-model:show-results="showResults"
      @open-menu="isMenuOpen = true"
    />

    <!-- Search Results или Chat List -->
    <div class="chat-list">
      <!-- Search Results -->
      <div v-if="showResults && searchQuery.length >= 2" class="search-results">
        <!-- Loading -->
        <div v-if="usersStore.searchLoading" class="search-results__loading">
          Поиск...
        </div>

        <!-- Results -->
        <div v-else-if="usersStore.searchResults.length > 0" class="search-results__list">
          <article
            v-for="user in usersStore.searchResults"
            :key="user._id"
            class="chat-item"
            @click="handleUserClick(user._id)"
          >
            <img
              :src="user.avatar || '/default-avatar.png'"
              :alt="user.name"
              class="chat-item__avatar"
            />
            <div class="chat-item__content">
              <div class="chat-item__header">
                <h4 class="chat-item__name">{{ user.name }}</h4>
                <span class="chat-item__time">Онлайн</span>
              </div>
              <p class="chat-item__message">{{ user.userId }}</p>
            </div>
          </article>
        </div>

        <!-- Empty -->
        <div v-else class="search-results__empty">
          Пользователи не найдены
        </div>
      </div>

      <!-- Chat List Placeholder (when not searching) -->
      <p v-else class="placeholder">Список чатов появится в День 3</p>
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
 * - Search Results (результаты поиска пользователей)
 * - Placeholder для списка чатов (День 3)
 *
 * Применяем адаптивный layout:
 * - Desktop (>859px): 400px max-width
 * - Mobile (≤859px): 100vw
 *
 * NOTE: Все импорты автоматические (Nuxt auto-import)
 * - ref - Vue (auto-import)
 * - useUsersStore - Pinia store (auto-import)
 * - LayoutAppHeader - компонент из layout/ (auto-import)
 * - LayoutMenuModal - компонент из layout/ (auto-import)
 */

const isMenuOpen = ref(false)
const usersStore = useUsersStore()
const searchQuery = ref('')
const showResults = ref(false)

function handleUserClick(userId: string) {
  console.log('User clicked:', userId)
  searchQuery.value = ''
  showResults.value = false
  usersStore.clearSearch()
  // TODO: Интеграция с чатами (День 3)
}
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
  padding: 10px;

  .placeholder {
    text-align: center;
    color: $text-secondary;
    @include font-styles(14px, 400, 1.5);
    margin-top: 40px;
  }
}

// ===== SEARCH RESULTS =====

.search-results {
  width: 100%;

  &__loading,
  &__empty {
    padding: 2rem;
    text-align: center;
    color: $text-secondary;
    @include font-styles(14px, 400, 1.5);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

// ===== CHAT ITEM (по макету chat-component.png) =====

.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: $radius; // 28px
  background: $bg-primary; // ✅ Единый фон
  box-shadow: $shadow-block; // ✅ Объём через тень
  @include transition;
  cursor: pointer;
  border: none; // ✅ НЕТ границ

  @include hover {
    opacity: 0.8; // ✅ Hover через opacity
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__name {
    margin: 0;
    @include font-styles(16px, 500, 1.4);
    color: $text-primary;
    text-transform: uppercase; // По макету заголовок uppercase
    letter-spacing: 0.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    @include font-styles(12px, 400, 1.4);
    color: $text-secondary;
    flex-shrink: 0;
  }

  &__message {
    margin: 0;
    @include font-styles(14px, 400, 1.4);
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
