<script setup lang="ts">
/**
 * AppHeader Component
 *
 * Строго по макету appheader (в обычном chatlist).png:
 * - MenuButton слева (иконка-кнопка inline)
 * - Search Input справа (BaseInput с поиском пользователей)
 * - Единый фон $bg-primary (#212121)
 * - НЕТ границ (borders)
 *
 * Component Composition:
 * - MenuButton (inline) - UiBaseButton variant="icon"
 * - UiBaseInput - переиспользуемый базовый инпут из ui/
 *
 * NOTE: Все импорты автоматические (Nuxt auto-import)
 * - ref, watch, onMounted - Vue (auto-import)
 * - useUsersStore - Pinia store (auto-import)
 * - SvgoMenuIcon, SvgoSearchIcon - nuxt-svgo (auto-import)
 * - UiBaseButton, UiBaseInput - компоненты из ui/ (auto-import)
 */

const props = defineProps<{
  searchQuery: string
  showResults: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:showResults': [value: boolean]
  'open-menu': []
}>()

const usersStore = useUsersStore()
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Локальный computed для v-model BaseInput
const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
})

// Debounced поиск (300ms)
function debouncedSearch(query: string) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    if (query.length >= 2) {
      await usersStore.searchUsers({ query, limit: 10 })
      emit('update:showResults', true)
    } else {
      usersStore.clearSearch()
      emit('update:showResults', false)
    }
  }, 300)
}

watch(() => props.searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

function handleFocus() {
  if (props.searchQuery.length >= 2) {
    emit('update:showResults', true)
  }
}
</script>

<template>
  <header class="app-header">
    <!-- MenuButton слева -->
    <UiBaseButton
      variant="icon"
      aria-label="Открыть меню"
      @click="emit('open-menu')"
    >
      <SvgoMenuIcon class="menu-icon" />
    </UiBaseButton>

    <!-- Search Input справа -->
    <div class="search-wrapper">
      <UiBaseInput
        v-model="localSearchQuery"
        type="text"
        placeholder="ПОИСК"
        @focus="handleFocus"
      >
        <template #icon>
          <SvgoSearchIcon class="search-icon" />
        </template>
      </UiBaseInput>
    </div>
  </header>
</template>

<style lang="scss" scoped>
/**
 * AppHeader Styles
 *
 * ✅ Единый фон $bg-primary (#212121)
 * ✅ Тень $shadow-block
 * ✅ НЕТ границ (borders)
 * ✅ Семантические теги (header)
 */

.app-header {
  position: relative;
  width: 100%;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: $radius;
}

// ===== MENU ICON =====

.menu-icon {
  width: 24px;
  height: 24px;
  color: $text-primary;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

// ===== SEARCH WRAPPER =====

.search-wrapper {
  position: relative;
  flex: 1;

  // Переопределяем стили BaseInput для search
  :deep(.base-input__field) {
    padding: 10px 20px 10px 20px;
    background: $bg-primary;
    @include font-styles(14px, 400, 1.5);
  }
}

.search-icon {
  width: 20px;
  height: 20px;
  color: $text-secondary;

  :deep(svg) {
    width: 20px;
    height: 20px;
    color: $text-secondary;
  }
}
</style>
