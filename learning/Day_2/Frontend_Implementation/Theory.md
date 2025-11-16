# 📖 День 2: Frontend Theory - Sidebar UI и Глобальный Поиск

> Теория для создания адаптивного ChatSidebar, AppHeader и глобального поиска пользователей

---

## 🎯 Что изучим

1. Строгие правила дизайна (единый фон, тени, НЕТ границ)
2. Адаптивный Layout через mixins
3. Component Composition Pattern
4. Debounced Search (простая реализация)
5. Search Results в Sidebar (НЕ dropdown!)
6. Menu Dropdown под кнопкой (НЕ modal!)
7. v-model Pattern
8. Семантический HTML5
9. Pinia Composition API
10. Clean Code (без лишних тегов)

---

## 1. 🎨 Строгие правила дизайна (КРИТИЧЕСКИ ВАЖНО!)

### Концепция: Объём через тени, НЕ через фоны!

Это ГЛАВНЫЙ принцип дизайн-системы iCore Messenger.

### ✅ РАЗРЕШЕНО:

```scss
// 1. Единый фон для ВСЕХ элементов
.element {
  background: $bg-primary; // #212121 - ТОЛЬКО ЭТО!
}

// 2. Объём через тени (НЕ через фоны!)
.card {
  background: $bg-primary;
  box-shadow: $shadow-block; // Тень создаёт объём
}

.input {
  background: $bg-primary;
  box-shadow: $shadow-input; // Специальная тень для input
}

// 3. Единый радиус
.element {
  border-radius: $radius; // 28px везде
}

// 4. НЕТ границ (кроме focus)
.element {
  border: none; // ✅ Правильно
}

// 5. Hover через opacity
.element {
  @include hover {
    opacity: 0.8; // ✅ Правильно - меняем прозрачность
  }
}
```

### ❌ ЗАПРЕЩЕНО:

```scss
// ❌ НЕТ разных фонов
.element {
  background: $bg-secondary; // ЗАПРЕЩЕНО!
  background: lighten($bg-primary, 5%); // ЗАПРЕЩЕНО!
  background: darken($bg-primary, 5%); // ЗАПРЕЩЕНО!
}

// ❌ НЕТ границ
.element {
  border: 1px solid rgba(255, 255, 255, 0.1); // ЗАПРЕЩЕНО!
}

// ❌ НЕТ rgba фонов на hover
.element {
  @include hover {
    background: rgba(255, 255, 255, 0.05); // ЗАПРЕЩЕНО!
  }
}

// ❌ НЕТ кастомных теней
.element {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); // ЗАПРЕЩЕНО!
}
```

### Почему это важно?

1. **Единообразие** - весь интерфейс выглядит цельно
2. **Объём** - тени создают глубину, не меняя фон
3. **Производительность** - меньше перерисовок при hover
4. **Поддержка** - легко изменить тени глобально

---

## 2. Адаптивный Layout через SCSS Mixins

### Используем готовые mixins

В `frontend/app/assets/styles/mixins.scss` уже есть:

```scss
@mixin mobile {
  @media (max-width: 859px) {
    @content;
  }
}

@mixin tablet {
  @media (max-width: 1364px) {
    @content;
  }
}

@mixin hover {
  @media (hover: hover) {
    &:hover {
      @content;
    }
  }
}
```

### Правильное применение:

```scss
.sidebar {
  width: 400px; // Desktop по умолчанию
  max-width: 400px;

  @include mobile {
    width: 100vw; // Mobile - на весь экран
    max-width: 100vw;
  }
}
```

**ВАЖНО:** Миксины импортируются автоматически через `nuxt.config.ts`, НЕ нужно импортировать вручную!

---

## 3. Component Composition Pattern

### Переиспользование компонентов

Вместо создания специализированных компонентов, используем базовые:

```vue
<!-- ❌ Плохо: создаём отдельные компоненты -->
<MenuButton @click="openMenu" />
<SearchButton @click="search" />
<CloseButton @click="close" />

<!-- ✅ Хорошо: переиспользуем BaseButton -->
<UiBaseButton variant="icon" @click="openMenu">
  <SvgoMenuIcon />
</UiBaseButton>

<UiBaseButton variant="icon" @click="close">
  <SvgoX />
</UiBaseButton>
```

### Почему это лучше?

1. **DRY** - не дублируем код
2. **Консистентность** - все кнопки выглядят одинаково
3. **Поддержка** - изменения в одном месте
4. **Меньше кода** - проще проект

---

## 4. Debounced Search (простая реализация)

### Проблема: слишком много запросов

Без debounce каждое нажатие клавиши = запрос к серверу:
- Пользователь вводит "john" = 4 запроса (j, jo, joh, john)
- Сервер перегружается
- UX плохой (мерцание результатов)

### Решение: Debouncing с setTimeout

```typescript
// AppHeader.vue
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSearch(query: string) {
  // Отменяем предыдущий таймер
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Ставим новый таймер на 300ms
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

// Следим за изменениями searchQuery
watch(() => props.searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})
```

### Как это работает:

1. Пользователь вводит "j" → ставится таймер 300ms
2. Пользователь вводит "o" → **отменяется** предыдущий таймер, ставится новый 300ms
3. Пользователь вводит "h" → отменяется, новый таймер 300ms
4. Пользователь вводит "n" → отменяется, новый таймер 300ms
5. Прошло 300ms без ввода → **выполняется запрос** "john"

**Результат:** Вместо 4 запросов - только 1!

---

## 5. Search Results в Sidebar (НЕ dropdown!)

### ❌ Неправильно: Dropdown поверх списка

```vue
<!-- AppHeader.vue - ПЛОХО -->
<div class="search-wrapper">
  <input v-model="search" />

  <!-- Dropdown position absolute -->
  <div v-if="showResults" class="dropdown">
    <div v-for="user in results">...</div>
  </div>
</div>
```

**Проблемы:**
- Перекрывает другие элементы
- Плохо на mobile
- z-index конфликты
- Сложная логика закрытия

### ✅ Правильно: Conditional Rendering в Sidebar

```vue
<!-- ChatSidebar.vue - ХОРОШО -->
<aside class="sidebar">
  <LayoutAppHeader
    v-model:search-query="searchQuery"
    v-model:show-results="showResults"
  />

  <div class="chat-list">
    <!-- Search Results -->
    <div v-if="showResults && searchQuery.length >= 2">
      <div v-if="usersStore.searchLoading">Поиск...</div>

      <div v-else-if="usersStore.searchResults.length > 0">
        <article
          v-for="user in usersStore.searchResults"
          :key="user._id"
          class="chat-item"
        >
          <!-- User card -->
        </article>
      </div>

      <div v-else>Пользователи не найдены</div>
    </div>

    <!-- Chat List Placeholder -->
    <p v-else>Список чатов появится в День 3</p>
  </div>
</aside>
```

**Преимущества:**
- Естественный flow контента
- Отлично на mobile
- Нет z-index проблем
- Простая логика

---

## 6. Menu Dropdown под кнопкой (НЕ modal!)

### ❌ Неправильно: Modal в центре экрана

```vue
<!-- ПЛОХО - старый паттерн -->
<Teleport to="body">
  <div class="modal-overlay" @click="close">
    <div class="modal-content">
      <!-- Меню в центре экрана -->
    </div>
  </div>
</Teleport>
```

**Проблемы:**
- Занимает весь экран
- Затемнение фона мешает
- Оверкилл для простого меню

### ✅ Правильно: Dropdown под кнопкой

```vue
<!-- MenuModal.vue - ХОРОШО -->
<div v-if="modelValue" class="menu-overlay" @click="close">
  <div class="menu-dropdown" @click.stop>
    <header class="menu-header">
      <h2>Меню</h2>
      <UiBaseButton variant="icon" @click="close">
        <SvgoX />
      </UiBaseButton>
    </header>

    <nav class="menu-nav">
      <button @click="goToProfile">Профиль</button>
      <button @click="goToSettings">Настройки</button>
      <button @click="handleLogout">Выйти</button>
    </nav>
  </div>
</div>
```

```scss
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent; // ✅ НЕТ затемнения!
  z-index: 999;
}

.menu-dropdown {
  position: absolute;
  top: 60px; // Под AppHeader
  left: 10px; // Отступ от края
  width: 280px;
  background: $bg-primary;
  box-shadow: $shadow-block;
  border-radius: $radius;
  z-index: 1000;
}
```

**Преимущества:**
- Не мешает видеть контент
- Быстрый доступ
- Меньше отвлекает
- Стандартный UX паттерн

---

## 7. v-model Pattern (двусторонняя связь)

### Базовый v-model для компонентов

```vue
<!-- Parent: ChatSidebar.vue -->
<script setup>
const searchQuery = ref('')
const showResults = ref(false)
</script>

<template>
  <LayoutAppHeader
    v-model:search-query="searchQuery"
    v-model:show-results="showResults"
  />
</template>
```

```vue
<!-- Child: AppHeader.vue -->
<script setup>
const props = defineProps<{
  searchQuery: string
  showResults: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:showResults': [value: boolean]
}>()

// Локальный computed для BaseInput
const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
})
</script>

<template>
  <UiBaseInput v-model="localSearchQuery" />
</template>
```

### Почему computed для v-model?

1. **Props read-only** - нельзя менять напрямую
2. **Computed getter/setter** - мост между props и emit
3. **Реактивность** - Vue отслеживает изменения
4. **Clean Code** - стандартный паттерн Vue 3

---

## 8. Семантический HTML5 (обязательно!)

### ❌ Плохо: Divitis

```vue
<div class="sidebar">
  <div class="header">
    <div class="navigation">
      <div class="chat-list">
        <div class="chat-item">
          ...
        </div>
      </div>
    </div>
  </div>
</div>
```

### ✅ Хорошо: Семантические теги

```vue
<aside class="sidebar">
  <header class="header">
    <nav class="navigation">
      <div class="chat-list">
        <article class="chat-item">
          ...
        </article>
      </div>
    </nav>
  </header>
</aside>
```

### Когда использовать:

- `<aside>` - боковая панель (Sidebar)
- `<header>` - шапка секции/страницы (AppHeader)
- `<footer>` - подвал секции/страницы
- `<nav>` - навигация (MenuModal navigation)
- `<main>` - основной контент страницы
- `<section>` - логический раздел
- `<article>` - независимый контент (chat-item, user-card)

### Зачем?

1. **SEO** - поисковики лучше понимают структуру
2. **Accessibility** - screen readers правильно читают
3. **Читаемость** - код понятнее
4. **Стандарты** - следуем спецификации HTML5

---

## 9. Pinia Composition API

### Setup Function Style (используем это!)

```typescript
// stores/users.ts
import { defineStore } from 'pinia'

export const useUsersStore = defineStore('users', () => {
  // State (как ref)
  const searchResults = ref<User[]>([])
  const searchLoading = ref(false)
  const searchError = ref<string | null>(null)

  // Actions (как функции)
  async function searchUsers(params: SearchUsersParams) {
    searchLoading.value = true
    searchError.value = null

    try {
      const data = await userService.searchUsers(params)
      searchResults.value = data.users
    } catch (error) {
      searchError.value = 'Ошибка поиска'
      throw error
    } finally {
      searchLoading.value = false
    }
  }

  function clearSearch() {
    searchResults.value = []
    searchError.value = null
  }

  // Return всё что нужно экспортировать
  return {
    searchResults,
    searchLoading,
    searchError,
    searchUsers,
    clearSearch
  }
})
```

### Использование в компонентах:

```vue
<script setup>
const usersStore = useUsersStore()

// Прямой доступ к state и actions
console.log(usersStore.searchResults)
await usersStore.searchUsers({ query: 'john' })
</script>
```

### Почему Composition API?

1. **Похоже на Vue 3** - тот же синтаксис setup
2. **TypeScript** - лучший вывод типов
3. **Меньше магии** - всё явно
4. **Гибкость** - можно использовать любые composables

---

## 10. Clean Code (без лишних тегов)

### ❌ Плохо: Избыточные обёртки

```vue
<!-- BaseButton.vue -->
<template>
  <button>
    <span v-if="loading" class="loader"></span>
    <span v-else class="content">
      <slot />
    </span>
  </button>
</template>
```

**Проблемы:**
- Лишний span
- Больше DOM узлов
- Сложнее стилизация

### ✅ Хорошо: Минимум разметки

```vue
<!-- BaseButton.vue -->
<template>
  <button>
    <span v-if="loading" class="loader"></span>
    <slot v-else />
  </button>
</template>
```

**Преимущества:**
- Меньше DOM
- Проще стили
- Лучше производительность
- Читаемее код

### Правило:

> Если тег не нужен для стилизации или логики - убирай его!

---

## 📊 Сравнение паттернов

### Search Results: Dropdown vs Sidebar

| Аспект | Dropdown | Sidebar (✅) |
|--------|----------|--------------|
| Mobile UX | ❌ Плохо | ✅ Отлично |
| z-index | ❌ Конфликты | ✅ Нет проблем |
| Код | ❌ Сложный | ✅ Простой |
| UX | ❌ Перекрывает | ✅ Естественно |

### Menu: Modal vs Dropdown

| Аспект | Modal | Dropdown (✅) |
|--------|-------|---------------|
| Доступность | ❌ Занимает экран | ✅ Не мешает |
| Скорость | ❌ Медленно | ✅ Быстро |
| Затемнение | ❌ Отвлекает | ✅ Нет |
| Стандарт | ❌ Нет | ✅ Да |

---

## ✅ Проверь себя

После изучения теории ты должен понимать:

- [ ] Почему единый фон для всех элементов?
- [ ] Как тени создают объём вместо разных фонов?
- [ ] Почему hover через opacity, а не background?
- [ ] Как работает debouncing с setTimeout?
- [ ] Почему Search Results в Sidebar, а не dropdown?
- [ ] Почему MenuModal под кнопкой, а не в центре?
- [ ] Как работает v-model с computed?
- [ ] Зачем семантические HTML5 теги?
- [ ] Как работает Pinia Composition API?
- [ ] Почему убирать лишние span обёртки?

Если на все вопросы "Да" - можешь переходить к [Practice.md](./Practice.md)!

---

## 📚 Дополнительные материалы

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia Composition Stores](https://pinia.vuejs.org/core-concepts/#setup-stores)
- [MDN HTML5 Semantic Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [Vue v-model Guide](https://vuejs.org/guide/components/v-model.html)

---

**Готов к практике? Переходи к [Practice.md](./Practice.md)! 🚀**
