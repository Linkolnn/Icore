# 📑 День 2: Индекс всех материалов

> Быстрый доступ ко всем файлам и разделам Sidebar UI и Глобального Поиска

---

## 🎯 Главные файлы

| Файл | Описание | Время |
|------|----------|-------|
| **[README.md](./README.md)** | Главный обзор дня | 10 мин |
| **[QUICK_START.md](./QUICK_START.md)** | Быстрый старт | 5 мин |
| **[OVERVIEW.md](./OVERVIEW.md)** | Карта материалов | 15 мин |
| **[INDEX.md](./INDEX.md)** | Этот файл | - |

---

## ⚙️ Backend Implementation

### Навигация
- **[Backend/README.md](./Backend_Implementation/README.md)** - Обзор Backend

### Обучающие материалы
| Файл | Содержание | Время |
|------|-----------|-------|
| **[Theory.md](./Backend_Implementation/Theory.md)** | MongoDB Query, Indexes, Pagination | 1-2 ч |
| **[Practice.md](./Backend_Implementation/Practice.md)** | User Search API | 2-3 ч |
| **[Checklist.md](./Backend_Implementation/Checklist.md)** | Чек-лист | - |

### Темы в Theory.md
1. MongoDB Query Builder ($regex, $or, $ne)
2. MongoDB Text Indexes
3. Pagination (offset-based)
4. DTO Validation (query parameters)
5. Service Layer Pattern
6. Error Handling

### Шаги в Practice.md
1. SearchUsersDto (DTO)
2. searchUsers() метод в UsersService
3. GET /users/search endpoint в UsersController
4. MongoDB text indexes настройка
5. Тестирование API

---

## 🎨 Frontend Implementation

### Навигация
- **[Frontend/README.md](./Frontend_Implementation/README.md)** - Обзор Frontend

### Обучающие материалы
| Файл | Содержание | Время |
|------|-----------|-------|
| **[Theory.md](./Frontend_Implementation/Theory.md)** | Components, Layout, Debouncing | 1-2 ч |
| **[Practice.md](./Frontend_Implementation/Practice.md)** | Sidebar + AppHeader + Menu | 2-3 ч |
| **[Checklist.md](./Frontend_Implementation/Checklist.md)** | Чек-лист | - |

### Темы в Theory.md
1. Адаптивный Layout (450px / 100vw)
2. Component Composition
3. Debouncing (useDebounceFn)
4. Dropdown UI patterns
5. Modal patterns (v-model, Teleport)
6. Семантический HTML5
7. Official Shadows ($shadow-block, $shadow-input)
8. Store Pattern (Pinia)

### Шаги в Practice.md
1. user.types.ts (SearchUsersParams, SearchUsersResponse)
2. user.service.ts (searchUsers функция)
3. users.ts store (searchUsers action)
4. MenuButton.vue компонент
5. MenuModal.vue компонент
6. ChatList.vue (Sidebar)
7. Интеграция в app.vue
8. Тестирование

---

## 📊 Статистика материалов

### Объем контента
- **Всего файлов:** 12 markdown файлов
- **Backend материалы:** 4 файла
- **Frontend материалы:** 4 файла
- **Общие материалы:** 4 файла

### Временные затраты
- **Теория:** 2-4 часа
- **Практика:** 4-6 часов
- **Тестирование:** 1 час
- **Итого:** 7-11 часов

---

## 🎯 Быстрый поиск по темам

### Backend Topics

#### MongoDB Query
- Query Builder: [Backend/Theory.md#1](./Backend_Implementation/Theory.md)
- $regex, $or, $ne: [Backend/Theory.md#1](./Backend_Implementation/Theory.md)
- Text Indexes: [Backend/Theory.md#2](./Backend_Implementation/Theory.md)

#### API Implementation
- SearchUsersDto: [Backend/Practice.md#1](./Backend_Implementation/Practice.md)
- UsersService: [Backend/Practice.md#2](./Backend_Implementation/Practice.md)
- UsersController: [Backend/Practice.md#3](./Backend_Implementation/Practice.md)

#### Patterns
- Service Layer: [Backend/Theory.md#5](./Backend_Implementation/Theory.md)
- DTO Pattern: [Backend/Theory.md#4](./Backend_Implementation/Theory.md)
- Pagination: [Backend/Theory.md#3](./Backend_Implementation/Theory.md)

### Frontend Topics

#### Layout & Design
- Адаптивный Layout: [Frontend/Theory.md#1](./Frontend_Implementation/Theory.md)
- Semantic HTML5: [Frontend/Theory.md#6](./Frontend_Implementation/Theory.md)
- Official Shadows: [Frontend/Theory.md#7](./Frontend_Implementation/Theory.md)

#### Components
- Component Composition: [Frontend/Theory.md#2](./Frontend_Implementation/Theory.md)
- MenuButton: [Frontend/Practice.md#4](./Frontend_Implementation/Practice.md)
- MenuModal: [Frontend/Practice.md#5](./Frontend_Implementation/Practice.md)
- ChatList: [Frontend/Practice.md#6](./Frontend_Implementation/Practice.md)

#### Optimization
- Debouncing: [Frontend/Theory.md#3](./Frontend_Implementation/Theory.md)
- Dropdown UI: [Frontend/Theory.md#4](./Frontend_Implementation/Theory.md)

#### State Management
- Pinia Store: [Frontend/Theory.md#8](./Frontend_Implementation/Theory.md)
- users.ts store: [Frontend/Practice.md#3](./Frontend_Implementation/Practice.md)

---

## 📖 Рекомендуемый порядок

### Для новичков (полное погружение)
```
1. README.md                        (10 мин)
2. OVERVIEW.md                      (15 мин)
3. Backend/Theory.md                (1-2 ч)
4. Backend/Practice.md              (2-3 ч)
5. Backend/Checklist.md             (проверка)
6. Frontend/Theory.md               (1-2 ч)
7. Frontend/Practice.md             (2-3 ч)
8. Frontend/Checklist.md            (проверка)
```

### Для опытных (быстрый путь)
```
1. QUICK_START.md                   (5 мин)
2. Backend/Practice.md              (2 ч)
3. Frontend/Practice.md             (2 ч)
4. Тестирование                     (30 мин)
```

### UI-first подход
```
1. OVERVIEW.md                      (15 мин)
2. Frontend/Practice.md             (2-3 ч)
3. Backend/Practice.md              (2-3 ч)
4. Интеграция                       (30 мин)
```

---

## 🎓 Учебные цели

### После Backend/Theory.md
- [ ] Понимаю MongoDB Query Builder ($regex, $or, $ne)
- [ ] Знаю как настраивать text indexes
- [ ] Понимаю offset-based pagination
- [ ] Знаю DTO Pattern для валидации

### После Backend/Practice.md
- [ ] Могу создать SearchUsersDto
- [ ] Могу реализовать searchUsers() в сервисе
- [ ] Могу создать GET /users/search endpoint
- [ ] Могу настроить MongoDB indexes
- [ ] Могу тестировать API через curl

### После Frontend/Theory.md
- [ ] Понимаю адаптивный layout (450px/100vw)
- [ ] Знаю Component Composition
- [ ] Понимаю Debouncing (useDebounceFn)
- [ ] Знаю Dropdown UI patterns
- [ ] Понимаю Modal patterns (v-model, Teleport)
- [ ] Знаю семантический HTML5

### После Frontend/Practice.md
- [ ] Могу создать адаптивный Sidebar
- [ ] Могу реализовать AppHeader с поиском
- [ ] Могу создать MenuButton и MenuModal
- [ ] Могу использовать Debouncing
- [ ] Могу работать с Pinia Store
- [ ] Могу применять официальные тени

---

## 🔗 Связь с другими днями

### Зависимости
- **День 1: Аутентификация** - User schema, Auth API, Auth pages (обязательно)

### Следующие шаги
- **День 3: Список чатов** - отображение чатов в Sidebar
- **День 4: Окно чата** - сообщения, MessageInput
- **День 5: WebSocket** - real-time обновления

---

## 🧩 Компоненты которые создаём

### Backend
1. **SearchUsersDto** - валидация query параметров (query, limit, skip)
2. **UsersService.searchUsers()** - метод поиска пользователей
3. **UsersController** - endpoint GET /users/search

### Frontend
1. **types/user.types.ts** - типы User, SearchParams, SearchResponse
2. **services/api/user.service.ts** - функция searchUsers()
3. **stores/users.ts** - Pinia store для поиска
4. **MenuButton.vue** - кнопка открытия меню
5. **MenuModal.vue** - модальное окно меню
6. **ChatList.vue** - Sidebar компонент (aside)
7. **app.vue** - интеграция Sidebar в layout

---

## ⚠️ ВАЖНО: НЕТ СИСТЕМЫ ДРУЗЕЙ!

**Этот день НЕ содержит:**
- ❌ Friend Request schema
- ❌ Friends API endpoints
- ❌ Список друзей
- ❌ Запросы в друзья

**Этот день СОДЕРЖИТ:**
- ✅ Глобальный поиск пользователей
- ✅ Sidebar UI (ChatList)
- ✅ AppHeader с меню и поиском
- ✅ Адаптивный layout

**iCore работает как Telegram** - можно писать любому пользователю напрямую!

---

## 🎨 Визуальная структура

### Desktop Layout (>1364px)
```
┌────────────────────┬──────────────────────────┐
│   SIDEBAR (450px)  │   CHAT WINDOW (flex: 1) │
├────────────────────┼──────────────────────────┤
│  ┌──────────────┐  │                          │
│  │ [☰] [ПОИСК🔍]│  │    "Выберите чат"        │
│  └──────────────┘  │                          │
│                    │      (placeholder)       │
│  (список чатов)    │                          │
└────────────────────┴──────────────────────────┘
```

### Tablet/Mobile Layout (≤1364px)
```
Sidebar (100vw):
┌──────────────────────┐
│  ┌────────────────┐  │
│  │ [☰] [ПОИСК 🔍] │  │
│  └────────────────┘  │
│                      │
│  (список чатов)      │
└──────────────────────┘
```

---

## ✅ Критерии завершения

День 2 завершён когда:

### Backend ✓
- [x] GET /users/search работает
- [x] Можно искать по name, userId, email
- [x] Pagination возвращает {users, total, hasMore}
- [x] Text indexes настроены (name, userId, email)
- [x] DTO валидация: минимум 2 символа
- [x] Исключается текущий пользователь ($ne)

### Frontend ✓
- [x] ChatList Sidebar адаптивный (450px / 100vw)
- [x] AppHeader с MenuButton + SearchInput
- [x] MenuModal открывается/закрывается
- [x] SearchInput с debounce 300ms
- [x] Dropdown показывает результаты
- [x] Закрытие по Escape / клик вне overlay
- [x] Семантические теги (aside, header, nav)
- [x] Официальные тени применены

### Интеграция ✓
- [x] Frontend вызывает Backend API
- [x] Результаты отображаются в dropdown
- [x] Нет ошибок в консоли
- [x] Все чек-листы заполнены

---

**Этот индекс создан для быстрой навигации по всем материалам Дня 2.**

*Используй Ctrl+F для поиска по ключевым словам.*
