<template>
  <main class="home-page">
    <div class="home-page__placeholder">
      <h1 class="home-page__title">iCore Messenger</h1>
      <p class="home-page__subtitle">Выберите чат из списка слева</p>
    </div>
  </main>
</template>

<script setup lang="ts">
/**
 * Home Page - Главная страница чатов
 *
 * Показывает placeholder, когда чат не выбран
 * ChatSidebar показывается автоматически через app.vue
 */

// Проверка авторизации при монтировании
onMounted(() => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    navigateTo('/login')
  }
})
</script>

<style lang="scss" scoped>
.home-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-primary;

  &__placeholder {
    text-align: center;
    padding: 32px;
  }

  &__title {
    font-size: 32px;
    font-weight: 700;
    color: $text-primary;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0 0 16px 0;
  }

  &__subtitle {
    font-size: 16px;
    color: $text-secondary;
    margin: 0;
  }
}
</style>
