# ⚡ День 2: Быстрый старт (5 минут)

> Минимальный план действий для быстрого старта Sidebar UI и Глобального Поиска

**Полная документация:** [README.md](./README.md) | [OVERVIEW.md](./OVERVIEW.md) | [INDEX.md](./INDEX.md)

---

## ⚠️ КРИТИЧНО: НЕТ СИСТЕМЫ ДРУЗЕЙ!

**iCore Messenger = Telegram:**
- ❌ НЕТ запросов в друзья
- ❌ НЕТ списка друзей
- ✅ Можно писать ЛЮБОМУ пользователю
- ✅ Глобальный поиск → начать чат

---

## 🎯 Что делаем за День 2?

### Backend (2-3 часа)
```
GET /users/search
├─ Поиск по name, userId, email
├─ Pagination (skip, limit, total)
├─ MongoDB text indexes
└─ Исключение текущего пользователя
```

### Frontend (2-3 часа)
```
Sidebar (ChatList)
├─ AppHeader
│   ├─ MenuButton → MenuModal
│   └─ SearchInput → Dropdown
├─ Адаптивный (450px / 100vw)
└─ Семантические теги (aside, header)
```

---

## 🚀 Быстрый план (минимум)

### 1️⃣ Backend: User Search API (2 часа)

#### Шаг 1: DTO для валидации
```bash
# Создай файл: backend/src/modules/users/dto/search-users.dto.ts
```

```typescript
import { IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchUsersDto {
  @IsString()
  @MinLength(2, { message: 'Минимум 2 символа' })
  query: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  limit?: number = 10

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0
}
```

#### Шаг 2: Метод в UsersService
```typescript
// backend/src/modules/users/users.service.ts

async searchUsers(
  currentUserId: string,
  dto: SearchUsersDto
) {
  const { query, limit = 10, skip = 0 } = dto

  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { userId: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
    _id: { $ne: currentUserId }, // Исключаем себя
  }

  const [users, total] = await Promise.all([
    this.userModel
      .find(searchQuery)
      .select('-password -refreshToken')
      .limit(limit)
      .skip(skip)
      .lean()
      .exec(),
    this.userModel.countDocuments(searchQuery),
  ])

  return {
    users,
    total,
    hasMore: skip + users.length < total,
  }
}
```

#### Шаг 3: Endpoint в UsersController
```typescript
// backend/src/modules/users/users.controller.ts

@Get('search')
@UseGuards(JwtAuthGuard)
async searchUsers(
  @CurrentUser('userId') userId: string,
  @Query() dto: SearchUsersDto,
) {
  return this.usersService.searchUsers(userId, dto)
}
```

#### Шаг 4: MongoDB Text Index (ВАЖНО!)
```typescript
// backend/src/modules/users/schemas/user.schema.ts

@Schema()
export class User {
  // ... поля

  // НЕ ЗАБУДЬ добавить индекс:
}

UserSchema.index({ name: 'text', userId: 'text', email: 'text' })
```

#### ✅ Тест Backend
```bash
curl "http://localhost:4000/api/users/search?query=test" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2️⃣ Frontend: Sidebar + AppHeader (2 часа)

#### Шаг 1: Типы
```bash
# Создай файл: frontend/app/types/user.types.ts
```

```typescript
import type { User } from './auth.types'

export interface SearchUsersParams {
  query: string
  limit?: number
  skip?: number
}

export interface SearchUsersResponse {
  users: User[]
  total: number
  hasMore: boolean
}
```

#### Шаг 2: API Service
```bash
# Уже есть: frontend/app/services/api/user.service.ts
```

Добавь функцию:
```typescript
export async function searchUsers(params: SearchUsersParams) {
  return $fetch<SearchUsersResponse>('/api/users/search', {
    method: 'GET',
    params,
  })
}
```

#### Шаг 3: Pinia Store
```bash
# Уже есть: frontend/app/stores/users.ts
```

Добавь actions:
```typescript
export const useUsersStore = defineStore('users', () => {
  const searchResults = ref<User[]>([])
  const searchLoading = ref(false)

  async function searchUsers(params: SearchUsersParams) {
    searchLoading.value = true
    try {
      const data = await userService.searchUsers(params)
      searchResults.value = data.users
    } finally {
      searchLoading.value = false
    }
  }

  function clearSearch() {
    searchResults.value = []
  }

  return { searchResults, searchLoading, searchUsers, clearSearch }
})
```

#### Шаг 4: Компоненты (УЖЕ СУЩЕСТВУЮТ!)

**AppHeader.vue** - ✅ УЖЕ ГОТОВ!
- `/home/linkoln/Projects/Icore/frontend/app/components/AppHeader.vue`
- Уже содержит: SearchInput, Debouncing (300ms), Dropdown, Escape closing

**MenuButton.vue** - СОЗДАЙ
```vue
<template>
  <button class="menu-button" @click="emit('click')">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: []
}>()
</script>

<style lang="scss" scoped>
.menu-button {
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  color: $text-primary;
  cursor: pointer;
  @include transition;

  @include hover {
    color: $yellow;
  }
}
</style>
```

**MenuModal.vue** - СОЗДАЙ
```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="menu-modal">
      <div class="menu-modal__overlay" @click="emit('update:modelValue', false)"></div>
      <nav class="menu-modal__content">
        <button class="menu-item">Профиль</button>
        <button class="menu-item">Настройки</button>
        <button class="menu-item">Выйти</button>
      </nav>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style lang="scss" scoped>
.menu-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.menu-modal__content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: $bg-primary;
  border-radius: $radius;
  box-shadow: $shadow-block;
  padding: 20px;
  z-index: 1001;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  color: $text-primary;
  text-align: left;
  cursor: pointer;
  @include transition;

  @include hover {
    background: rgba(255, 255, 255, 0.05);
  }
}
</style>
```

**ChatList.vue (Sidebar)** - СОЗДАЙ
```vue
<template>
  <aside class="chat-list">
    <AppHeader />

    <!-- Placeholder пока нет чатов -->
    <div class="chat-list__empty">
      <p>Чаты появятся на День 3</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
</script>

<style lang="scss" scoped>
.chat-list {
  width: 100%;
  max-width: 450px; // Desktop
  height: 100vh;
  background: $bg-primary;
  box-shadow: $shadow-block;
  display: flex;
  flex-direction: column;

  @include tablet {
    max-width: 100vw;
  }

  @include mobile {
    max-width: 100vw;
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
  }
}
</style>
```

#### Шаг 5: Добавь в Layout
```vue
<!-- frontend/app/app.vue -->
<template>
  <div class="app">
    <ChatList v-if="isAuthenticated" />
    <main class="app__content">
      <NuxtPage />
    </main>
  </div>
</template>

<style lang="scss">
.app {
  display: flex;
  height: 100vh;
  background: $bg-primary;

  &__content {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
```

---

## ✅ Тестирование (10 минут)

### Backend
```bash
# 1. Проверь что MongoDB запущен
docker ps | grep mongo

# 2. Проверь индексы
# MongoDB Compass → Indexes → должны быть text indexes

# 3. Тест запроса
curl "http://localhost:4000/api/users/search?query=te&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend
```bash
# 1. Запусти dev server
cd frontend && yarn dev

# 2. Открой http://localhost:3000

# 3. Проверь:
# - Sidebar 450px слева (desktop)
# - AppHeader с кнопкой меню и поиском
# - Введи 2+ символа → увидишь результаты через 300ms
# - Нажми Escape → dropdown закроется
```

---

## 🎯 Критерии "Готово"

### Backend ✓
- [ ] GET /users/search работает
- [ ] Поиск по name, userId, email
- [ ] Pagination (skip, limit, total, hasMore)
- [ ] Text indexes настроены
- [ ] DTO валидация (минимум 2 символа)

### Frontend ✓
- [ ] Sidebar адаптивный (450px / 100vw)
- [ ] AppHeader с MenuButton + SearchInput
- [ ] MenuModal открывается/закрывается
- [ ] Поиск с debounce 300ms
- [ ] Dropdown показывает результаты
- [ ] Закрытие по Escape / клик вне

---

## 📚 Дальше

### Если хочешь глубже:
1. **Backend:** [Backend_Implementation/Theory.md](./Backend_Implementation/Theory.md)
2. **Frontend:** [Frontend_Implementation/Theory.md](./Frontend_Implementation/Theory.md)

### Следующий день:
- **День 3:** Список чатов в Sidebar
- **День 4:** Окно чата и сообщения
- **День 5:** WebSocket real-time

---

## 🐛 Частые проблемы

| Проблема | Решение |
|----------|---------|
| "Cannot find users" | Проверь text indexes в MongoDB |
| "Dropdown не показывается" | Проверь Network tab, debounce 300ms |
| "Sidebar не адаптивный" | Проверь @include tablet, @include mobile |
| "CORS ошибка" | Проверь backend/main.ts → enableCors() |

---

**Удачи! 🚀**
