<template>
  <article class="auth-form">
    <header class="auth-form__header">
      <h1 class="auth-form__title">{{ title }}</h1>
      <p v-if="subtitle" class="auth-form__subtitle">{{ subtitle }}</p>
    </header>

    <form class="auth-form__form" @submit.prevent="$emit('submit')">
      <!-- Слот для полей формы -->
      <slot />
    </form>

    <footer v-if="$slots.footer" class="auth-form__footer">
      <!-- Слот для footer (ссылки на другие страницы) -->
      <slot name="footer" />
    </footer>
  </article>
</template>

<script setup lang="ts">
// ===================================
// 🧩 FORM - Переиспользуемая обертка для форм аутентификации
// ===================================
// Паттерн: Component Composition + Slots Pattern
// Принцип: DRY - общая структура для login/register
// Использование: login.vue, register.vue
// Тег: <AuthForm> (Nuxt 4 auto-import: components/auth/Form.vue → <AuthForm>)

interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()

defineEmits<{
  'submit': []
}>()
</script>

<style lang="scss" scoped>
.auth-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 30px 20px;
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-block;

  @include mobile {
    padding: 25px 15px;
    max-width: 100%;
  }

  &__header {
    margin-bottom: 32px;
    text-align: center;
  }

  &__title {
    font-family: '5mal6Lampen', sans-serif;
    @include font-styles(32px, 400, 1.2);
    color: $text-primary;
    margin-bottom: 8px;

    @include mobile {
      @include font-styles(24px, 400, 1.2);
    }
  }

  &__subtitle {
    @include font-styles(14px, 400, 1.5);
    color: $text-secondary;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__footer {
    margin-top: 24px;
    padding-top: 24px;
    text-align: center;
    // ✅ НЕТ границ! Разделение через отступ
  }
}
</style>
