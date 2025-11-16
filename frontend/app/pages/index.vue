<template>
  <main class="home-page">
    <div class="container">
      <header class="home-page__header">
        <h1 class="home-page__title">ИCore Messenger</h1>
        <p class="home-page__subtitle">Добро пожаловать, {{ user?.name }}!</p>
      </header>

      <section class="home-page__content">
        <!-- Карточка профиля -->
        <article class="card">
          <h2 class="home-page__card-title">Ваш профиль</h2>
          <div class="home-page__info">
            <p><strong>Имя:</strong> {{ user?.name }}</p>
            <p><strong>Email:</strong> {{ user?.email }}</p>
          </div>
        </article>

        <!-- Кнопка выхода -->
        <UiBaseButton
          variant="secondary"
          @click="handleLogout"
        >
          Выйти
        </UiBaseButton>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
// ===================================
// 🏠 HOME PAGE - Главная страница (защищенная)
// ===================================
// Только для авторизованных пользователей
// Компоненты: <UiBaseButton> (Nuxt auto-import)
//
// NOTE: Все импорты автоматические (Nuxt auto-import)
// - useAuth - composable (auto-import)
// - useAuthStore - Pinia store (auto-import)
// - UiBaseButton - компонент из ui/ (auto-import)

const auth = useAuth()
const { user, logout } = auth

const handleLogout = async () => {
  await logout()
}

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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: $bg-primary;

  &__header {
    text-align: center;
    margin-bottom: 40px;
  }

  &__title {
    font-family: '5mal6Lampen', sans-serif;
    @include font-styles(48px, 700, 1.2);
    color: $text-primary;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 2px;

    @include mobile {
      @include font-styles(32px, 700, 1.2);
    }
  }

  &__subtitle {
    @include font-styles(18px, 400, 1.5);
    color: $text-secondary;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__card-title {
    font-family: '5mal6Lampen', sans-serif;
    @include font-styles(24px, 600, 1.3);
    color: $text-primary;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 12px;

    p {
      @include font-styles(16px, 400, 1.5);
      color: $text-secondary;

      strong {
        color: $text-primary;
        font-weight: 500;
      }
    }
  }
}
</style>
