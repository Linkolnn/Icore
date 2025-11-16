<template>
  <main class="auth-page login-page">
    <AuthForm
      title="Вход"
      subtitle="Войдите в свой аккаунт"
      @submit="handleLogin"
    >
      <!-- Email поле -->
      <UiBaseInput
        v-model="form.email"
        type="email"
        label="Email"
        placeholder="Введите email"
        :error="errors.email"
        required
      />

      <!-- Password поле -->
      <UiBaseInput
        v-model="form.password"
        type="password"
        label="Пароль"
        placeholder="Введите пароль"
        :error="errors.password"
        required
      />

      <!-- Сообщение об ошибке от сервера -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Кнопка отправки -->
      <UiBaseButton
        type="submit"
        variant="primary"
        :loading="loading"
      >
        Войти
      </UiBaseButton>

      <!-- Footer с ссылкой на регистрацию -->
      <template #footer>
        <p class="auth-link">
          Нет аккаунта?
          <NuxtLink to="/register" class="auth-link__link">
            Зарегистрироваться
          </NuxtLink>
        </p>
      </template>
    </AuthForm>
  </main>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

// ===================================
// 🔐 LOGIN PAGE - Страница входа
// ===================================
// Паттерн: Component Composition
// Компоненты: <AuthForm>, <UiBaseInput>, <UiBaseButton> (Nuxt 4 auto-import)
// Типы: LoginCredentials из auth.types.ts

definePageMeta({
  layout: false
})

// ===================================
// COMPOSABLES
// ===================================
const auth = useAuth()
const { login, loading, error, clearError } = auth

// ===================================
// FORM STATE
// ===================================
const form = reactive({
  email: '',
  password: ''
})

// ===================================
// VALIDATION ERRORS
// ===================================
const errors = reactive({
  email: '',
  password: ''
})

/**
 * Валидация формы
 * @returns true если форма валидна
 */
const validateForm = (): boolean => {
  let isValid = true

  // Reset errors
  errors.email = ''
  errors.password = ''

  // Email validation
  if (!form.email) {
    errors.email = 'Email обязателен'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Некорректный email'
    isValid = false
  }

  // Password validation
  if (!form.password) {
    errors.password = 'Пароль обязателен'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Пароль должен быть минимум 6 символов'
    isValid = false
  }

  return isValid
}

/**
 * Обработчик отправки формы
 */
const handleLogin = async () => {
  if (!validateForm()) return

  clearError()

  try {
    await login({
      email: form.email,
      password: form.password
    })
  } catch (err) {
    // Ошибка уже в store.error
    console.error('Login error:', err)
  }
}

// Очистка ошибки при изменении полей
watch([() => form.email, () => form.password], () => {
  clearError()
})
</script>

<style lang="scss" scoped>
// Все общие стили в @/assets/styles/auth.scss
// Специфичные стили для login-page (если нужны) добавляем здесь
</style>
