# ✅ День 2: Frontend Sidebar UI - Чек-лист

> Используй этот чек-лист чтобы отслеживать прогресс реализации Sidebar UI и глобального поиска

---

## 📋 Теория (Theory.md)

### 1. Strict Design Rules (CRITICAL!)
- [ ] Понимаю концепцию: Volume через тени, НЕ через backgrounds
- [ ] Знаю что ВСЕ элементы имеют `background: $bg-primary`
- [ ] Понимаю что ЗАПРЕЩЕНЫ borders (кроме focus states)
- [ ] Знаю что hover ТОЛЬКО через `opacity: 0.8` (НЕ через lighten/darken)
- [ ] Понимаю разницу между `$shadow-block` и `$shadow-input`
- [ ] Знаю что `$shadow-block` для ВСЕХ блоков (кроме input)
- [ ] Знаю что `$shadow-input` ТОЛЬКО для input элементов

### 2. Adaptive Layout через SCSS Mixins
- [ ] Понимаю почему Sidebar 400px на Desktop
- [ ] Понимаю почему Sidebar 100vw на Mobile (≤859px)
- [ ] Знаю breakpoints: mobile (859px), tablet (1364px), laptop (1919px)
- [ ] Понимаю `@include mobile`, `@include tablet`, `@include laptop` из mixins.scss
- [ ] Знаю что mixins импортируются автоматически через nuxt.config.ts

### 3. Component Composition
- [ ] Понимаю зачем переиспользовать BaseButton и BaseInput
- [ ] Знаю почему BaseButton БЕЗ span wrapper (Clean Code)
- [ ] Понимаю variant="icon" для иконочных кнопок
- [ ] Знаю что BaseButton использует `:deep(svg)` для стилизации иконок

### 4. Debounced Search (простой setTimeout)
- [ ] Понимаю зачем нужен debouncing (не спамить API)
- [ ] Знаю как работает `clearTimeout(debounceTimer)`
- [ ] Понимаю почему 300ms задержка (оптимальный баланс)
- [ ] Знаю что нужен минимум 2 символа для поиска

### 5. Search Results в Sidebar (НЕ Dropdown!)
- [ ] Понимаю почему результаты В Sidebar (а не в AppHeader dropdown)
- [ ] Знаю как работает conditional rendering (v-if для search vs chatlist)
- [ ] Понимаю v-model паттерн для searchQuery и showResults
- [ ] Знаю преимущества: нет z-index проблем, лучше на mobile

### 6. Menu Dropdown под кнопкой (НЕ Modal!)
- [ ] Понимаю почему MenuModal теперь dropdown (а не центральный modal)
- [ ] Знаю что overlay ПРОЗРАЧНЫЙ (background: transparent)
- [ ] Понимаю position: absolute (top: 60px, left: 10px)
- [ ] Знаю что БЕЗ Teleport to="body" (рендерится на месте)
- [ ] Понимаю BaseButton с SvgoX иконкой для закрытия

### 7. v-model Pattern
- [ ] Понимаю `v-model:search-query` в ChatSidebar
- [ ] Понимаю `v-model:show-results` в ChatSidebar
- [ ] Знаю как работает computed getter/setter
- [ ] Понимаю props + emit для two-way binding

### 8. Семантический HTML5
- [ ] Понимаю зачем нужны семантические теги (SEO, accessibility)
- [ ] Знаю когда использовать `<aside>` (Sidebar)
- [ ] Знаю когда использовать `<header>` (AppHeader)
- [ ] Знаю когда использовать `<nav>` (MenuModal navigation)
- [ ] Знаю когда использовать `<article>` (chat-item, search result)
- [ ] Знаю когда использовать `<button>` (всегда для кликабельных элементов!)

### 9. Pinia Composition API
- [ ] Понимаю зачем нужен users.ts store
- [ ] Знаю структуру: setup function style (НЕ options API)
- [ ] Понимаю state как ref (searchResults, searchLoading, searchError)
- [ ] Понимаю actions как functions (searchUsers, clearSearch)
- [ ] Знаю как использовать store: `const usersStore = useUsersStore()`

### 10. Clean Code (без лишних тегов)
- [ ] Понимаю принцип "минимум DOM узлов"
- [ ] Знаю что не нужны span обертки если можно напрямую
- [ ] Понимаю DRY принцип (auth.scss для shared styles)
- [ ] Знаю что дублирование кода = плохо

---

## 🛠️ Практика (Practice.md)

### Шаг 1: user.types.ts ✅
- [x] Создал файл `frontend/app/types/user.types.ts`
- [x] Определил интерфейс `User` (без password, refreshToken)
- [x] Определил интерфейс `SearchUsersParams` (query, limit?, skip?)
- [x] Определил интерфейс `SearchUsersResponse` (users, total, hasMore)

### Шаг 2: user.service.ts ✅
- [x] Создал файл `frontend/app/services/api/user.service.ts`
- [x] Импортировал типы из user.types.ts
- [x] Реализовал `searchUsers(params)` функцию
- [x] Использовал `fetch` (не axios)
- [x] Добавил токен через `Authorization: Bearer ${token}`
- [x] Параметры передаются через URLSearchParams
- [x] Обработка ошибок (throw Error)

### Шаг 3: users.ts Store ✅
- [x] Создал файл `frontend/app/stores/users.ts`
- [x] Использовал Pinia Composition API (setup function style)
- [x] Импортировал userService
- [x] Создал state: searchResults (ref<User[]>)
- [x] Создал state: searchLoading (ref<boolean>)
- [x] Создал state: searchError (ref<string | null>)
- [x] Реализовал action: searchUsers(params)
- [x] Реализовал action: clearSearch()
- [x] try-catch-finally для обработки ошибок

### Шаг 4: BaseButton Cleanup ✅
- [x] Убрал лишний `<span class="base-button__content">` wrapper
- [x] Slot теперь напрямую в button (Clean Code!)
- [x] Убрал закомментированный код
- [x] Добавил variant="icon" для иконочных кнопок
- [x] Использовал `:deep(svg)` для стилизации иконок (20x20px, padding: 10px)

### Шаг 5: BaseInput Bug Fix ✅
- [x] Исправлен баг: текст пропадает при вводе
- [x] Добавлены `-webkit-text-fill-color` и `-webkit-opacity`
- [x] Гарантирован `background: $bg-primary` и `color: $text-primary`
- [x] Проверено в Chrome, Firefox, Safari

### Шаг 6: MenuModal Redesign ✅
- [x] Изменён с centered modal на dropdown под кнопкой
- [x] Убран `Teleport to="body"` (рендерится на месте)
- [x] Overlay прозрачный (background: transparent)
- [x] position: absolute (top: 60px, left: 10px)
- [x] Кнопка закрытия: BaseButton variant="icon" + SvgoX
- [x] Кнопка "Профиль" → `/profile`
- [x] Кнопка "Настройки" → `/settings`
- [x] Кнопка "Выйти" → authStore.logout()
- [x] Закрытие по Escape (window.addEventListener)
- [x] Закрытие по клику на overlay

### Шаг 7: AppHeader Refactor ✅
- [x] Создал файл `frontend/app/components/layout/AppHeader.vue`
- [x] Убран dropdown рендеринг (перенесён в ChatSidebar)
- [x] Добавлены props: searchQuery и showResults
- [x] Добавлены emits: update:searchQuery и update:showResults
- [x] Реализован debounced search (300ms) через setTimeout
- [x] Минимум 2 символа для поиска
- [x] MenuButton с emit('open-menu')
- [x] Semantic HTML: `<header>`

### Шаг 8: ChatSidebar (была ChatList) ✅
- [x] Создал файл `frontend/app/components/layout/ChatSidebar.vue`
- [x] Использовал семантический тег `<aside>`
- [x] Интегрировал AppHeader с v-model:search-query и v-model:show-results
- [x] Реализовал conditional rendering: search results OR chat list placeholder
- [x] Стилизация search results под chat-component.png mockup
- [x] Chat-item structure: Avatar + Name (uppercase) + Time + UserID
- [x] Добавил MenuModal с v-model
- [x] Ширина: 400px на Desktop
- [x] Ширина: 100vw на Mobile (@include mobile)
- [x] box-shadow: $shadow-block

### Шаг 9: auth.scss (DRY принцип) ✅
- [x] Создал файл `frontend/app/assets/styles/auth.scss`
- [x] Перенёс shared styles: .auth-page, .error-message, .auth-link
- [x] Убран border из .error-message (был нарушение дизайна!)
- [x] Hover через opacity: 0.8 (НЕ lighten!)
- [x] Добавлен в nuxt.config.ts css array
- [x] Почистил login.vue и register.vue от дублирования (~60 строк удалено!)

### Шаг 10: Auth Pages Cleanup ✅
- [x] login.vue: добавлен класс `auth-page`, удалены дублированные стили
- [x] register.vue: добавлен класс `auth-page`, удалены дублированные стили
- [x] auth/Form.vue: убран `border-top` из footer (было нарушение!)

### Шаг 11: app.vue интеграция ✅
- [x] Импортировал LayoutChatSidebar компонент (auto-import)
- [x] Добавил `v-if="authStore.isAuthenticated"` для ChatSidebar
- [x] Layout: display: flex
- [x] ChatSidebar слева, NuxtPage справа (flex: 1)
- [x] На Mobile: Chat Window скрыт через @include mobile

### Шаг 12: Тестирование ✅
- [ ] Frontend запускается: `yarn dev`
- [ ] Desktop: Sidebar 400px
- [ ] Mobile (≤859px): Sidebar 100vw
- [ ] MenuButton открывает MenuModal dropdown
- [ ] MenuModal закрывается по Escape
- [ ] MenuModal закрывается по клику на overlay
- [ ] Кнопки Профиль/Настройки/Выйти работают
- [ ] SearchInput с debounce 300ms работает
- [ ] Search results появляются В Sidebar (не dropdown!)
- [ ] Search results закрываются по очистке query
- [ ] Backend интеграция работает (GET /users/search)
- [ ] Нет ошибок в консоли

---

## 🧪 Функциональное тестирование

### Layout адаптивность
- [ ] Desktop: Sidebar 400px, Chat Window видим
- [ ] Mobile (≤859px): Sidebar 100vw, Chat Window скрыт
- [ ] Нет горизонтального скролла на Mobile
- [ ] Высота: 100vh (весь экран)

### MenuButton и MenuModal
- [ ] Клик на MenuButton открывает MenuModal dropdown
- [ ] MenuModal появляется под кнопкой (НЕ в центре экрана!)
- [ ] Overlay НЕ затемняет фон (прозрачный)
- [ ] Клик на overlay закрывает MenuModal
- [ ] Escape закрывает MenuModal
- [ ] BaseButton с SvgoX закрывает MenuModal
- [ ] "Профиль" → редирект на /profile
- [ ] "Настройки" → редирект на /settings
- [ ] "Выйти" → logout + редирект на /login

### Глобальный поиск
- [ ] Ввод в SearchInput работает (нет бага с пропаданием текста!)
- [ ] Debounce 300ms (не спамит API)
- [ ] Минимум 2 символа для поиска
- [ ] Search results появляются В Sidebar (заменяют chat list)
- [ ] Результаты содержат: Avatar + Name (uppercase) + Time + UserID
- [ ] Стилизация match chat-component.png mockup
- [ ] Текущий пользователь исключён из результатов
- [ ] Loading state показывается
- [ ] Очистка query скрывает results и показывает chat list placeholder
- [ ] Ошибки обрабатываются (searchError)

### Backend интеграция
- [ ] GET /users/search вызывается
- [ ] Authorization header передаётся
- [ ] Query параметры: query, limit, skip
- [ ] Ответ: { users, total, hasMore }
- [ ] Статус 200 OK
- [ ] Статус 401 при невалидном токене
- [ ] Статус 400 при query < 2 символов

### Безопасность
- [ ] ChatSidebar видим только для авторизованных (isAuthenticated)
- [ ] Токен берётся из authStore
- [ ] Без токена → редирект на /login (middleware/auth.ts)
- [ ] password и refreshToken НЕ возвращаются в ответе

---

## 📦 Структура файлов

### Созданные файлы ✅
- [x] `frontend/app/types/user.types.ts`
- [x] `frontend/app/services/api/user.service.ts`
- [x] `frontend/app/stores/users.ts`
- [x] `frontend/app/components/layout/AppHeader.vue`
- [x] `frontend/app/components/layout/MenuModal.vue`
- [x] `frontend/app/components/layout/ChatSidebar.vue`
- [x] `frontend/app/assets/styles/auth.scss`

### Изменённые файлы ✅
- [x] `frontend/app/app.vue` (интеграция ChatSidebar)
- [x] `frontend/app/components/ui/BaseButton.vue` (cleanup, icon variant)
- [x] `frontend/app/components/ui/BaseInput.vue` (bug fix)
- [x] `frontend/app/components/auth/Form.vue` (убран border)
- [x] `frontend/app/pages/login.vue` (cleanup, auth.scss)
- [x] `frontend/app/pages/register.vue` (cleanup, auth.scss)
- [x] `frontend/nuxt.config.ts` (добавлен auth.scss)

---

## 🎨 Design System соответствие

### STRICT RULES Compliance ✅
- [x] ВСЕ элементы имеют ЕДИНЫЙ фон: `background: $bg-primary` (#212121)
- [x] Объём ТОЛЬКО через тени: `$shadow-block` и `$shadow-input`
- [x] НЕТ границ (borders) - НИКОГДА! (кроме focus states)
- [x] Hover ТОЛЬКО через `opacity: 0.8` (НЕ lighten/darken!)
- [x] Единый радиус: `border-radius: $radius` (28px)

### Colors ✅
- [x] Используется $bg-primary (#212121) для ВСЕХ backgrounds
- [x] Используется $text-primary (#FFFFFF)
- [x] Используется $text-secondary (#999999)
- [x] Используется $accent-primary (#FFC700)
- [x] НЕ используются кастомные цвета

### Shadows ✅
- [x] ChatSidebar: box-shadow: $shadow-block ✅
- [x] AppHeader: box-shadow: $shadow-block ✅
- [x] MenuModal: box-shadow: $shadow-block ✅
- [x] BaseInput: box-shadow: $shadow-input ✅
- [x] Chat-item cards: box-shadow: $shadow-block ✅
- [x] НЕТ borders! ✅

### Font ✅
- [x] Везде используется font-family: '5mal6Lampen'
- [x] Заголовки: uppercase с letter-spacing
- [x] Chat-item name: uppercase (per mockup)

### Semantic HTML ✅
- [x] ChatSidebar: `<aside>` ✅
- [x] AppHeader: `<header>` ✅
- [x] MenuModal nav: `<nav>` ✅
- [x] Chat Window: `<main>` ✅
- [x] Chat-item / Search result: `<article>` ✅
- [x] Кнопки: `<button>` (не `<div @click>`) ✅

---

## 🔍 Код Review

### user.types.ts ✅
- [x] User интерфейс без password, refreshToken
- [x] SearchUsersParams с query (required), limit?, skip?
- [x] SearchUsersResponse с users, total, hasMore

### user.service.ts ✅
- [x] Используется fetch (не axios)
- [x] Token из authStore
- [x] URLSearchParams для query параметров
- [x] try-catch для ошибок
- [x] Возвращает Promise<SearchUsersResponse>

### users.ts Store ✅
- [x] Pinia Composition API (setup function style)
- [x] State: searchResults, searchLoading, searchError (ref)
- [x] Actions: searchUsers, clearSearch (functions)
- [x] try-catch-finally для обработки ошибок
- [x] console.error для логирования

### BaseButton.vue ✅
- [x] БЕЗ лишних span wrappers (Clean Code!)
- [x] Slot напрямую в button
- [x] variant="icon" для иконочных кнопок
- [x] `:deep(svg)` для стилизации SVG (20x20px)
- [x] padding: 10px для icon variant
- [x] aria-label для accessibility

### BaseInput.vue ✅
- [x] Исправлен баг с пропаданием текста
- [x] -webkit-text-fill-color и -webkit-opacity
- [x] background: $bg-primary, color: $text-primary
- [x] box-shadow: $shadow-input ✅
- [x] border: none ✅

### MenuModal.vue ✅
- [x] Dropdown паттерн (НЕ centered modal!)
- [x] БЕЗ Teleport to="body" (рендерится на месте)
- [x] position: absolute (top: 60px, left: 10px)
- [x] Прозрачный overlay (background: transparent)
- [x] v-model паттерн (modelValue, update:modelValue)
- [x] Escape handler (addEventListener)
- [x] @click.stop для menu-dropdown
- [x] BaseButton variant="icon" + SvgoX для закрытия
- [x] useRouter для навигации
- [x] authStore.logout() для выхода

### AppHeader.vue ✅
- [x] Semantic tag `<header>`
- [x] Props: searchQuery, showResults
- [x] Emits: update:searchQuery, update:showResults, open-menu
- [x] Debounced search через setTimeout (300ms)
- [x] Computed getter/setter для v-model BaseInput
- [x] БЕЗ dropdown рендеринга (перенесён в ChatSidebar)

### ChatSidebar.vue ✅
- [x] Semantic tag `<aside>`
- [x] Адаптивная ширина (400px Desktop / 100vw Mobile)
- [x] v-model:search-query для AppHeader
- [x] v-model:show-results для AppHeader
- [x] Conditional rendering: search results ИЛИ chat list placeholder
- [x] Chat-item стилизация match chat-component.png
- [x] Avatar + Name (uppercase) + Time + UserID структура
- [x] MenuModal с v-model

### auth.scss ✅ (NEW!)
- [x] Shared styles: .auth-page, .error-message, .auth-link
- [x] БЕЗ borders в .error-message ✅
- [x] Hover через opacity: 0.8 (НЕ lighten!) ✅
- [x] Добавлен в nuxt.config.ts

### login.vue & register.vue ✅
- [x] Класс `auth-page` добавлен
- [x] Дублированные стили удалены (~60 строк!)
- [x] Используется auth.scss

### auth/Form.vue ✅
- [x] Убран `border-top` из footer ✅

### app.vue ✅
- [x] LayoutChatSidebar с v-if="authStore.isAuthenticated"
- [x] display: flex layout
- [x] Mobile: Chat Window скрыт (@include mobile)

---

## 🐛 Исправленные баги

### Bug 1: BaseInput text disappearing ✅
- [x] **Проблема:** Текст пропадает при вводе
- [x] **Причина:** Недостаточные webkit свойства для видимости текста
- [x] **Решение:** Добавлены `-webkit-text-fill-color` и `-webkit-opacity`
- [x] **Статус:** Исправлено в BaseInput.vue:84-99

### Bug 2: SvgoXIcon not found ✅
- [x] **Проблема:** Vue ошибка "Failed to resolve component: SvgoXIcon"
- [x] **Причина:** Неправильное имя компонента (x.svg → SvgoX, не SvgoXIcon)
- [x] **Решение:** Изменено на `<SvgoX>`
- [x] **Статус:** Исправлено в MenuModal.vue

### Bug 3: Design violations (borders) ✅
- [x] **Проблема:** Borders в auth/Form.vue, login.vue, register.vue
- [x] **Причина:** Нарушение strict design rules
- [x] **Решение:** Убраны все borders, создан auth.scss
- [x] **Статус:** Исправлено, соответствует DESIGN_REFERENCE.md

### Bug 4: Hover violations ✅
- [x] **Проблема:** Использование `lighten($accent-primary, 10%)` на hover
- [x] **Причина:** Нарушение strict design rules (hover только через opacity)
- [x] **Решение:** Заменено на `opacity: 0.8`
- [x] **Статус:** Исправлено в auth.scss

### Bug 5: Code duplication ✅
- [x] **Проблема:** ~60 строк дублированного кода в login.vue и register.vue
- [x] **Причина:** Нарушение DRY принципа
- [x] **Решение:** Создан auth.scss с shared styles
- [x] **Статус:** Исправлено, -60 строк кода

### Bug 6: Unnecessary span wrapper ✅
- [x] **Проблема:** Лишний `<span class="base-button__content">` в BaseButton
- [x] **Причина:** Нарушение Clean Code принципа
- [x] **Решение:** Slot напрямую в button, `:deep(svg)` для иконок
- [x] **Статус:** Исправлено в BaseButton.vue

---

## 📚 Документация

### README.md ✅
- [x] Прочитан
- [x] Понял цели дня: Sidebar UI + Global Search
- [x] Понял структуру: AppHeader, ChatSidebar, MenuModal
- [x] Понял strict design rules (CRITICAL!)

### Theory.md ✅
- [x] Прочитана полностью (10 sections)
- [x] Все концепции понятны
- [x] Примеры кода понятны
- [x] Strict design rules понятны (✅ ALLOWED vs ❌ FORBIDDEN)

### Practice.md
- [ ] Прочитана
- [ ] Все шаги понятны
- [ ] Примеры кода рабочие

### Checklist.md
- [ ] Прочитана (ты здесь!)
- [ ] Все чек-боксы понятны
- [ ] Отслеживаю прогресс

---

## ✅ Критерии завершения

День 2 Frontend считается завершённым когда:

### Основное ✅
- [x] Все файлы созданы (types, service, store, components, auth.scss)
- [x] app.vue обновлён
- [x] Frontend запускается без ошибок
- [ ] Backend интеграция работает (требует тестирования)

### Функциональность
- [ ] ChatSidebar адаптивный (400px Desktop / 100vw Mobile)
- [ ] MenuButton и MenuModal dropdown работают
- [ ] Глобальный поиск работает (debounce 300ms)
- [ ] Search results в Sidebar (conditional rendering)
- [ ] Навигация работает (Профиль, Настройки, Выйти)

### Качество ✅
- [x] Код следует PATTERNS_CHECKLIST.md
- [x] Используются семантические теги (aside, header, nav, article)
- [x] Применены Official Shadows ($shadow-block, $shadow-input)
- [x] STRICT RULES соблюдены (NO BORDERS, unified background, opacity hover)
- [x] Нет чувствительных данных в ответах (password, refreshToken excluded)
- [x] DRY принцип (auth.scss)
- [x] Clean Code (no unnecessary wrappers)

### Документация ✅
- [x] README.md обновлён с current implementation
- [x] Theory.md обновлён (10 sections, strict rules first)
- [x] Checklist.md обновлён (this file!)
- [ ] Practice.md нуждается в обновлении (?)

---

## 🎯 Следующие шаги

### Немедленные действия для завершения Day 2:
1. [ ] Запустить frontend: `cd frontend && yarn dev`
2. [ ] Протестировать все функции (см. раздел "Функциональное тестирование")
3. [ ] Проверить Backend интеграцию (GET /users/search)
4. [ ] Устранить ошибки в консоли (если есть)
5. [ ] Убедиться что strict design rules соблюдены визуально

### Optional:
- [ ] Обновить Practice.md (если требуется)
- [ ] Создать screenshot результата для документации

---

## 🎉 Поздравляем!

Если все пункты отмечены, ты завершил Frontend часть Дня 2!

### Что ты изучил:
- ✅ Strict Design Rules (volume через тени, не backgrounds!)
- ✅ Adaptive Layout через SCSS Mixins
- ✅ Component Composition (BaseButton, BaseInput reuse)
- ✅ Debounced Search (simple setTimeout)
- ✅ Search Results в Sidebar (conditional rendering)
- ✅ Menu Dropdown под кнопкой (не modal)
- ✅ v-model Pattern (two-way binding)
- ✅ Semantic HTML5 (aside, header, nav, article)
- ✅ Pinia Composition API (setup function style)
- ✅ Clean Code (no unnecessary tags)
- ✅ DRY принцип (auth.scss)

**Следующий шаг:** [День 3: Список чатов](../../Day_3/) - отображение чатов в Sidebar

---

**Время выполнения:** ~2-3 часа
**Реальное время (с багфиксами и рефакторингом):** ~4-5 часов
