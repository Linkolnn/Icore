<template>
  <main class="auth-page register-page">
    <AuthForm
      title="Регистрация"
      subtitle="Создайте новый аккаунт"
      @submit="handleRegister"
    >
      <!-- Username поле -->
      <UiBaseInput
        v-model="form.username"
        type="text"
        label="Имя пользователя"
        placeholder="Введите имя"
        :error="errors.username"
        required
      />

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

      <!-- Confirm Password поле -->
      <UiBaseInput
        v-model="form.confirmPassword"
        type="password"
        label="Подтверждение пароля"
        placeholder="Повторите пароль"
        :error="errors.confirmPassword"
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
        Зарегистрироваться
      </UiBaseButton>

      <!-- Footer с ссылкой на вход -->
      <template #footer>
        <p class="auth-link">
          Уже есть аккаунт?
          <NuxtLink to="/login" class="auth-link__link">
            Войти
          </NuxtLink>
        </p>
      </template>
    </AuthForm>
  </main>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

// ===================================
// 🔐 REGISTER PAGE - Страница регистрации
// ===================================
// Паттерн: Component Composition
// Компоненты: <AuthForm>, <UiBaseInput>, <UiBaseButton> (Nuxt 4 auto-import)
// Типы: RegisterData из auth.types.ts

definePageMeta({
  layout: false,
  middleware: 'guest'
})

// ===================================
// COMPOSABLES
// ===================================
const auth = useAuth()
const { register, loading, error, clearError } = auth

// ===================================
// FORM STATE
// ===================================
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// ===================================
// VALIDATION ERRORS
// ===================================
const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

/**
 * Валидация формы
 * @returns true если форма валидна
 */
const validateForm = (): boolean => {
  let isValid = true

  // Reset errors
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  // Username validation
  if (!form.username) {
    errors.username = 'Имя пользователя обязательно'
    isValid = false
  } else if (form.username.length < 3) {
    errors.username = 'Имя должно быть минимум 3 символа'
    isValid = false
  }

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

  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Подтвердите пароль'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Пароли не совпадают'
    isValid = false
  }

  return isValid
}

/**
 * Обработчик отправки формы
 */
const handleRegister = async () => {
  if (!validateForm()) return

  clearError()

  try {
    await register({
      name: form.username, // Backend ожидает 'name', а не 'username'
      email: form.email,
      password: form.password
    })
  } catch (err) {
    // Ошибка уже в store.error
    console.error('Register error:', err)
  }
}

// Очистка ошибки при изменении полей
watch([() => form.username, () => form.email, () => form.password, () => form.confirmPassword], () => {
  clearError()
})
</script>

<style lang="scss" scoped>
// Все общие стили в @/assets/styles/auth.scss
// Специфичные стили для register-page (если нужны) добавляем здесь
</style>
