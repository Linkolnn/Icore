<template>
  <!-- Overlay без затемнения, только для закрытия по клику -->
  <div v-if="modelValue" class="menu-overlay" @click="close">
    <!-- Menu Dropdown под кнопкой в AppHeader -->
    <div class="menu-dropdown" @click.stop>
      <header class="menu-header">
        <h2 class="menu-title">Меню</h2>
        <UiBaseButton
          variant="icon"
          aria-label="Закрыть"
          @click="close"
        >
          <SvgoX class="close-icon" />
        </UiBaseButton>
      </header>

      <nav class="menu-nav">
        <button class="menu-nav__button" @click="goToProfile">
          <span class="button-icon">👤</span>
          <span class="button-text">Профиль</span>
        </button>
        <button class="menu-nav__button" @click="goToSettings">
          <span class="button-icon">⚙️</span>
          <span class="button-text">Настройки</span>
        </button>
        <button class="menu-nav__button menu-nav__button--danger" @click="handleLogout">
          <span class="button-icon">🚪</span>
          <span class="button-text">Выйти</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * MenuModal Component
 *
 * Dropdown Menu под кнопкой меню в AppHeader:
 * - НЕТ Teleport (рендерится в месте использования)
 * - НЕТ затемнения фона (прозрачный overlay)
 * - Позиционируется абсолютно под кнопкой меню
 * - v-model паттерн для открытия/закрытия
 * - Закрытие по Escape и клику вне меню
 * - BaseButton с иконкой x.svg для закрытия
 * - Семантические теги (header, nav)
 *
 * NOTE: Все импорты автоматические (Nuxt auto-import)
 * - useRouter, useAuthStore - auto-import
 * - UiBaseButton - компонент из ui/ (auto-import)
 * - SvgoX - nuxt-svgo (auto-import для x.svg)
 */

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const authStore = useAuthStore()

const close = () => {
  emit('update:modelValue', false)
}

const goToProfile = () => {
  router.push('/profile')
  close()
}

const goToSettings = () => {
  router.push('/settings')
  close()
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
  close()
}

// Закрытие по Escape
onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}
</script>

<style lang="scss" scoped>
/**
 * MenuModal Styles
 *
 * Применяем дизайн-систему:
 * - Единый фон $bg-primary
 * - Тень $shadow-block
 * - НЕТ границ
 * - НЕТ затемнения фона (прозрачный overlay)
 */

// ===== OVERLAY (прозрачный, только для закрытия по клику) =====

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent; // ✅ НЕТ затемнения!
  z-index: 999;
}

// ===== MENU DROPDOWN (под кнопкой меню) =====

.menu-dropdown {
  position: absolute;
  top: 60px; // Под AppHeader (высота header ~50px + gap)
  left: 10px; // Отступ от левого края
  width: 280px;
  background: $bg-primary; // ✅ Единый фон
  border-radius: $radius;
  box-shadow: $shadow-block; // ✅ Тень для блока
  overflow: hidden;
  border: none; // ✅ НЕТ границ!
  z-index: 1000;
}

// ===== HEADER =====

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: $bg-primary;

  .menu-title {
    margin: 0;
    @include font-styles(18px, 600, 1.4);
    color: $text-primary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.close-icon {
  width: 18px;
  height: 18px;
  color: $text-primary;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

// ===== NAVIGATION =====

.menu-nav {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__button {
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none; // ✅ НЕТ границ!
    text-align: left;
    @include font-styles(16px, 400, 1.5);
    color: $text-primary;
    cursor: pointer;
    border-radius: 14px; // Меньший радиус для внутренних элементов
    @include transition;
    display: flex;
    align-items: center;
    gap: 12px;

    @include hover {
      opacity: 0.8; // ✅ Hover через opacity
    }

    &--danger {
      color: $error-color;
    }
  }

  .button-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .button-text {
    flex: 1;
  }
}
</style>
