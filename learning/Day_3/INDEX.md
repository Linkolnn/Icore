# 📑 День 3: Индекс Материалов

> Быстрая навигация по всем файлам и темам

---

## 📂 Структура Файлов

```
Day_3/
├── README.md                      ← Главный обзор дня
├── QUICK_START.md                 ← Быстрый старт (5 мин)
├── OVERVIEW.md                    ← Полная карта материалов
├── INDEX.md                       ← Этот файл (навигация)
│
├── Backend_Implementation/
│   ├── README.md                  ← Обзор Backend части
│   ├── Theory.md                  ← Теория (1.5-2 ч)
│   ├── Practice.md                ← Практика (2-3 ч)
│   └── Checklist.md               ← Чек-лист прогресса
│
└── Frontend_Implementation/
    ├── README.md                  ← Обзор Frontend части
    ├── Theory.md                  ← Теория (1.5-2 ч)
    ├── Practice.md                ← Практика (2-3 ч)
    └── Checklist.md               ← Чек-лист прогресса
```

---

## 🎯 Начальные Файлы

### Главный обзор
- **[README.md](./README.md)** - полное описание дня, цели, результаты
- **[QUICK_START.md](./QUICK_START.md)** - быстрый старт за 5 минут
- **[OVERVIEW.md](./OVERVIEW.md)** - визуальная карта всех материалов
- **[INDEX.md](./INDEX.md)** - этот файл (навигация)

---

## ⚙️ Backend Implementation

### Обзорные файлы
- **[Backend_Implementation/README.md](./Backend_Implementation/README.md)**
  - Краткий обзор Backend части
  - Список файлов для создания
  - API endpoints
  - Время выполнения

### Теория
- **[Backend_Implementation/Theory.md](./Backend_Implementation/Theory.md)**
  - **Mongoose Relations** (ObjectId, ref, populate)
  - **CRUD Operations** (Create, Read, Update, Delete)
  - **Soft Delete Pattern** (isDeleted flag)
  - **Authorization** (проверка участников чата)
  - **Aggregation** ($lookup для joins)
  - **Chat Schema Design**

### Практика
- **[Backend_Implementation/Practice.md](./Backend_Implementation/Practice.md)**
  - Шаг 1: Создание Chat Schema
  - Шаг 2: CreateChatDto и UpdateChatDto
  - Шаг 3: ChatsService (CRUD методы)
  - Шаг 4: ChatsController (REST endpoints)
  - Шаг 5: Регистрация ChatsModule
  - Шаг 6: Тестирование через Postman

### Чек-лист
- **[Backend_Implementation/Checklist.md](./Backend_Implementation/Checklist.md)**
  - Теория (концепции)
  - Практика (шаги)
  - Функциональное тестирование
  - Код review
  - Критерии завершения

---

## 🎨 Frontend Implementation

### Обзорные файлы
- **[Frontend_Implementation/README.md](./Frontend_Implementation/README.md)**
  - Краткий обзор Frontend части
  - Список файлов для создания
  - Component tree
  - Время выполнения

### Теория
- **[Frontend_Implementation/Theory.md](./Frontend_Implementation/Theory.md)**
  - **File-based Routing** (Nuxt 4)
  - **Dynamic Routes** (`[id].vue`)
  - **Route Params** (`route.params.id`)
  - **NuxtLink vs router.push**
  - **Chat Store Pattern** (Pinia)
  - **Active State Tracking**
  - **Empty State UI**
  - **User Search Integration**

### Практика
- **[Frontend_Implementation/Practice.md](./Frontend_Implementation/Practice.md)**
  - Шаг 1: Создание chat.types.ts
  - Шаг 2: Создание chat.service.ts
  - Шаг 3: Создание chats.ts store
  - Шаг 4: Создание ChatItem.vue
  - Шаг 5: Создание pages/index.vue
  - Шаг 6: Создание pages/chat/[id].vue
  - Шаг 7: Интеграция в ChatSidebar
  - Шаг 8: User Search → Create Chat
  - Шаг 9: Тестирование

### Чек-лист
- **[Frontend_Implementation/Checklist.md](./Frontend_Implementation/Checklist.md)**
  - Теория (концепции)
  - Практика (шаги)
  - Функциональное тестирование
  - Дизайн соответствие
  - Код review
  - Критерии завершения

---

## 📚 Концепции (A-Z)

### Backend Концепции

#### A-C
- **Aggregation** → [Backend Theory: Aggregation](./Backend_Implementation/Theory.md#5-aggregation-with-lookup)
- **Authorization** → [Backend Theory: Authorization](./Backend_Implementation/Theory.md#4-authorization-in-crud)
- **CRUD Operations** → [Backend Theory: CRUD](./Backend_Implementation/Theory.md#2-crud-operations)

#### D-M
- **DTOs** → [Backend Practice: CreateChatDto](./Backend_Implementation/Practice.md#шаг-2-createchatdto-и-updatechatdto)
- **Mongoose populate** → [Backend Theory: Relations](./Backend_Implementation/Theory.md#1-mongoose-relations)
- **Mongoose Relations** → [Backend Theory: Relations](./Backend_Implementation/Theory.md#1-mongoose-relations)

#### O-Z
- **ObjectId** → [Backend Theory: Relations](./Backend_Implementation/Theory.md#1-mongoose-relations)
- **Soft Delete** → [Backend Theory: Soft Delete](./Backend_Implementation/Theory.md#3-soft-delete-pattern)

### Frontend Концепции

#### A-D
- **Active State** → [Frontend Theory: Active State](./Frontend_Implementation/Theory.md#5-active-state-tracking)
- **Chat Store** → [Frontend Theory: Chat Store](./Frontend_Implementation/Theory.md#4-chat-store-pattern)
- **Dynamic Routes** → [Frontend Theory: Dynamic Routes](./Frontend_Implementation/Theory.md#2-dynamic-route-params)

#### E-N
- **Empty State** → [Frontend Theory: Empty State](./Frontend_Implementation/Theory.md#6-empty-state-ui-pattern)
- **File-based Routing** → [Frontend Theory: File-based Routing](./Frontend_Implementation/Theory.md#1-file-based-routing-nuxt-4)
- **NuxtLink** → [Frontend Theory: NuxtLink](./Frontend_Implementation/Theory.md#3-nuxtlink-vs-routerpush)

#### R-Z
- **Route Params** → [Frontend Theory: Route Params](./Frontend_Implementation/Theory.md#2-dynamic-route-params)
- **router.push** → [Frontend Theory: NuxtLink](./Frontend_Implementation/Theory.md#3-nuxtlink-vs-routerpush)
- **User Search Integration** → [Frontend Theory: Integration](./Frontend_Implementation/Theory.md#7-user-search-integration)

---

## 🔍 Поиск по Темам

### Хочу узнать про...

#### Chat Schema
- [Backend Theory: Chat Schema Design](./Backend_Implementation/Theory.md#chat-schema-design)
- [Backend Practice: Создание Chat Schema](./Backend_Implementation/Practice.md#шаг-1-создание-chat-schema)

#### CRUD API
- [Backend Theory: CRUD Operations](./Backend_Implementation/Theory.md#2-crud-operations)
- [Backend Practice: ChatsService](./Backend_Implementation/Practice.md#шаг-3-chatsservice)
- [Backend Practice: ChatsController](./Backend_Implementation/Practice.md#шаг-4-chatscontroller)

#### Routing в Nuxt
- [Frontend Theory: File-based Routing](./Frontend_Implementation/Theory.md#1-file-based-routing-nuxt-4)
- [Frontend Theory: Dynamic Routes](./Frontend_Implementation/Theory.md#2-dynamic-route-params)
- [Frontend Practice: pages/index.vue](./Frontend_Implementation/Practice.md#шаг-5-создание-pagesindexvue)
- [Frontend Practice: pages/chat/[id].vue](./Frontend_Implementation/Practice.md#шаг-6-создание-pageschatidvue)

#### ChatItem Component
- [Frontend Practice: ChatItem.vue](./Frontend_Implementation/Practice.md#шаг-4-создание-chatitemvue)
- [OVERVIEW: ChatItem Structure](./OVERVIEW.md#chatitem-component-structure)

#### User Search → Create Chat
- [Frontend Theory: User Search Integration](./Frontend_Implementation/Theory.md#7-user-search-integration)
- [Frontend Practice: User Search Integration](./Frontend_Implementation/Practice.md#шаг-8-user-search--create-chat)
- [OVERVIEW: User Search Flow](./OVERVIEW.md#user-search--create-chat-flow)

#### Тестирование
- [Backend Practice: Тестирование](./Backend_Implementation/Practice.md#шаг-6-тестирование)
- [Backend Checklist: Testing](./Backend_Implementation/Checklist.md#функциональное-тестирование)
- [Frontend Practice: Тестирование](./Frontend_Implementation/Practice.md#шаг-9-тестирование)
- [Frontend Checklist: Testing](./Frontend_Implementation/Checklist.md#функциональное-тестирование)

---

## 🛣️ Рекомендуемые Пути

### Путь 1: Полное Погружение (7-11 часов)

**Для тех кто хочет глубоко разобраться**

1. [README.md](./README.md) - обзор дня (15 мин)
2. [Backend Theory](./Backend_Implementation/Theory.md) - теория Backend (1.5 ч)
3. [Backend Practice](./Backend_Implementation/Practice.md) - практика Backend (2.5 ч)
4. Тестирование Backend через Postman (30 мин)
5. [Frontend Theory](./Frontend_Implementation/Theory.md) - теория Frontend (1.5 ч)
6. [Frontend Practice](./Frontend_Implementation/Practice.md) - практика Frontend (2.5 ч)
7. Тестирование Frontend в браузере (30 мин)
8. Интеграционное тестирование (30 мин)

**Заполняй чек-листы по ходу:**
- [Backend Checklist](./Backend_Implementation/Checklist.md)
- [Frontend Checklist](./Frontend_Implementation/Checklist.md)

---

### Путь 2: Быстрый Старт (5-7 часов)

**Для тех кто хочет быстро получить результат**

1. [QUICK_START.md](./QUICK_START.md) - быстрый обзор (5 мин)
2. [Backend Practice](./Backend_Implementation/Practice.md) - только практика (2 ч)
3. Тестирование Backend (20 мин)
4. [Frontend Practice](./Frontend_Implementation/Practice.md) - только практика (2 ч)
5. Тестирование Frontend (20 мин)
6. Интеграция (20 мин)

**Обращайся к теории только при необходимости:**
- [Backend Theory](./Backend_Implementation/Theory.md)
- [Frontend Theory](./Frontend_Implementation/Theory.md)

---

### Путь 3: Только Backend (3-4 часа)

**Для тех кто фокусируется на Backend**

1. [Backend README](./Backend_Implementation/README.md) - обзор (10 мин)
2. [Backend Theory](./Backend_Implementation/Theory.md) - теория (1.5 ч)
3. [Backend Practice](./Backend_Implementation/Practice.md) - практика (2 ч)
4. [Backend Checklist](./Backend_Implementation/Checklist.md) - проверка (30 мин)

---

### Путь 4: Только Frontend (3-4 часа)

**Для тех кто фокусируется на Frontend**

**Требование:** Backend API уже готов (или используешь mock данные)

1. [Frontend README](./Frontend_Implementation/README.md) - обзор (10 мин)
2. [Frontend Theory](./Frontend_Implementation/Theory.md) - теория (1.5 ч)
3. [Frontend Practice](./Frontend_Implementation/Practice.md) - практика (2 ч)
4. [Frontend Checklist](./Frontend_Implementation/Checklist.md) - проверка (30 мин)

---

## 🔖 Быстрые Ссылки

### Обзорные материалы
- [README.md](./README.md) - главный обзор
- [QUICK_START.md](./QUICK_START.md) - быстрый старт
- [OVERVIEW.md](./OVERVIEW.md) - полная карта

### Backend
- [Backend README](./Backend_Implementation/README.md)
- [Backend Theory](./Backend_Implementation/Theory.md)
- [Backend Practice](./Backend_Implementation/Practice.md)
- [Backend Checklist](./Backend_Implementation/Checklist.md)

### Frontend
- [Frontend README](./Frontend_Implementation/README.md)
- [Frontend Theory](./Frontend_Implementation/Theory.md)
- [Frontend Practice](./Frontend_Implementation/Practice.md)
- [Frontend Checklist](./Frontend_Implementation/Checklist.md)

### Дизайн
- Макеты: `/home/linkoln/Projects/Icore/layout(img)/`
- [DESIGN_REFERENCE.md](../../DESIGN_REFERENCE.md)
- [PATTERNS_CHECKLIST.md](../../PATTERNS_CHECKLIST.md)

---

## 📞 Нужна Помощь?

### Не понимаю концепцию
→ Читай соответствующий раздел в Theory.md

### Не получается реализовать
→ Следуй Practice.md пошагово

### Код не работает
→ Проверь Checklist.md → раздел "Troubleshooting"

### Застрял на Backend
→ [Backend Checklist: Troubleshooting](./Backend_Implementation/Checklist.md#troubleshooting)

### Застрял на Frontend
→ [Frontend Checklist: Troubleshooting](./Frontend_Implementation/Checklist.md#troubleshooting)

---

## 🎯 Прогресс

**Отслеживай свой прогресс через чек-листы:**

- [ ] [Backend Checklist](./Backend_Implementation/Checklist.md) - Backend прогресс
- [ ] [Frontend Checklist](./Frontend_Implementation/Checklist.md) - Frontend прогресс

**Когда все галочки отмечены → День 3 завершён! 🎉**

---

## 🚀 Готов Начать?

**Выбери свой путь и вперёд!**

- 📖 [Полная теория Backend](./Backend_Implementation/Theory.md)
- 🛠️ [Практика Backend](./Backend_Implementation/Practice.md)
- 📖 [Полная теория Frontend](./Frontend_Implementation/Theory.md)
- 🛠️ [Практика Frontend](./Frontend_Implementation/Practice.md)
- ⚡ [Быстрый старт](./QUICK_START.md)

**Удачи в обучении! 🎓**
