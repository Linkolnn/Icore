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
        <button class="menu-nav__button" @click="openCreateGroup">
          <Icon name="material-symbols:group-add" class="button-icon" />
          <span class="button-text">Создать беседу</span>
        </button>
        <button class="menu-nav__button" @click="goToProfile">
          <Icon name="material-symbols:person-outline" class="button-icon" />
          <span class="button-text">Профиль</span>
        </button>
        <button class="menu-nav__button" @click="goToSettings">
          <Icon name="material-symbols:settings-outline" class="button-icon" />
          <span class="button-text">Настройки</span>
        </button>
        <button class="menu-nav__button menu-nav__button--danger" @click="handleLogout">
          <Icon name="material-symbols:logout" class="button-icon" />
          <span class="button-text">Выйти</span>
        </button>
      </nav>
    </div>
  </div>

  <!-- Create Group Modal -->
  <ChatCreateGroupModal
    v-if="isCreateGroupOpen"
    :is-open="isCreateGroupOpen"
    @close="isCreateGroupOpen = false"
    @created="handleGroupCreated"
  />
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

const isCreateGroupOpen = ref(false)

const close = () => {
  emit('update:modelValue', false)
}

const openCreateGroup = () => {
  isCreateGroupOpen.value = true
  close()
}

const handleGroupCreated = (chat: any) => {
  isCreateGroupOpen.value = false
  router.push(`/chat/${chat._id}`)
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
  top: 88px; // Под AppHeader (высота header ~50px + gap)
  left: 10px; // Отступ от левого края
  width: 280px;
  background: $bg-primary; // ✅ Единый фон
  border-radius: $radius;
  box-shadow: $shadow-block; // ✅ Тень для блока
  overflow: hidden;
  z-index: 1000;
}

// ===== HEADER =====

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px 10px 20px;
  .menu-title {
    @include font-styles(18px, 400, 1.4);
    color: $text-primary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.close-icon {
  width: 18px;
  height: 18px;
  color: $text-primary;
}

// ===== NAVIGATION =====

.menu-nav {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__button {
    width: 100%;
    padding: 10px;
    background: transparent;
    text-align: left;
    @include font-styles(16px, 400, 1.5);
    color: $text-primary;
    cursor: pointer;
    border-radius: 14px; // Меньший радиус для внутренних элементов
    @include transition;
    display: flex;
    align-items: center;
    gap: 10px;

    @include hover {
      opacity: 0.8; // ✅ Hover через opacity
    }

    &--danger {
      color: $error-color;
    }
  }

  .button-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: white;
  }

  .button-text {
    flex: 1;
  }
}
</style>
