# 🧠 CLAUDE AI MEMORY - iCore Messenger

Полная документация проекта для работы с Claude AI.

---

## 📋 СОДЕРЖАНИЕ

1. [Обзор Проекта](#обзор-проекта)  
2. [Технологический Стек](#технологический-стек)  
3. [Архитектура](#архитектура)  
4. [Дизайн-система](#дизайн-система)  
5. [Backend Реализация](#backend-реализация)  
6. [Frontend Реализация](#frontend-реализация)  
7. [Real-time и WebSocket](#real-time-и-websocket)  
8. [Virtual Scrolling](#virtual-scrolling)  
9. [Паттерны и Правила](#паттерны-и-правила)  
10. [Важные Решения](#важные-решения)

---

## 🎯 ОБЗОР ПРОЕКТА

### Концепция
**iCore Messenger** - современный real-time мессенджер с упором на производительность и минималистичный дизайн.

### Ключевые Принципы
- **Modular Monolith** архитектура
- **Component Composition** - переиспользование компонентов
- **DRY** - минимизация дублирования кода
- **SOLID** - разделение ответственности
- **Learning-driven** - обучение через практику

### Особенности Реализации
- Кастомный Virtual Scrolling (без библиотек)
- Real-time через WebSocket (Socket.io)
- Composition API везде (Vue 3, Pinia)
- Полная TypeScript типизация
- Semantic HTML5 обязательно

---

## 💻 ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Backend
- **NestJS 10** - основной фреймворк
- **MongoDB** - база данных
- **Redis** - кеширование и сессии
- **Socket.io** - WebSocket сервер
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей
- **class-validator** - DTO валидация
- **DOMPurify** - санитизация контента

### Frontend  
- **Nuxt 4 Alpha** - мета-фреймворк
- **Vue 3.5** - UI фреймворк
- **Pinia** - state management
- **SCSS** - стилизация
- **TypeScript 5** - типизация
- **socket.io-client** - WebSocket клиент
- **nuxt-svgo** - работа с SVG

### DevOps
- **Docker** - контейнеризация
- **Docker Compose** - оркестрация

---

## 🏗️ АРХИТЕКТУРА

### Backend (Modular Monolith)
```
backend/src/
├── modules/
│   ├── auth/         # JWT аутентификация
│   ├── users/        # Управление пользователями  
│   ├── chats/        # Чаты и комнаты
│   ├── messages/     # Сообщения
│   ├── websocket/    # WebSocket Gateway
│   └── webrtc/       # Видео/аудио (будущее)
│
├── common/
│   ├── decorators/   # @User, @Public
│   ├── guards/       # JwtAuthGuard
│   ├── filters/      # Exception filters
│   └── utils/        # id.utils, hash.utils
│
└── config/           # Конфигурация
```

### Frontend (Feature-Based)
```
frontend/app/
├── pages/            # Авто-роутинг
├── components/       # UI компоненты
│   ├── layout/      # Лейаут
│   ├── ui/          # Базовые UI
│   └── chat/        # Чат компоненты
│       └── message/ # Сообщения
│
├── composables/      # Реактивная логика
├── stores/           # Pinia stores
├── services/         # API сервисы
├── types/            # TypeScript типы
├── utils/            # Утилиты
├── directives/       # Vue директивы
└── assets/
    ├── styles/       # SCSS
    ├── fonts/        # Шрифты
    └── icons/        # SVG
```

---

## 🎨 ДИЗАЙН-СИСТЕМА

### Главное Правило
**ОБЪЁМ ЧЕРЕЗ ТЕНИ, А НЕ ЧЕРЕЗ ФОНЫ!**

Все элементы имеют единый фон `$bg-primary` (#212121) и различаются ТОЛЬКО тенями.

### Цветовая Палитра
```scss
$bg-primary: #212121;       // Единый фон для ВСЕХ
$accent-primary: #FFC700;   // Жёлтый акцент
$text-primary: #FFFFFF;     // Основной текст
$text-secondary: #999999;   // Вторичный текст
$bg-input: #1a1a1a;        // Только для инпутов
```

### Система Теней (ТОЛЬКО ДВЕ!)
```scss
// Для всех блоков кроме инпутов
$shadow-block: 
  0 0 4px 0 rgba(0, 0, 0, 0.05),
  inset 0 0 15px 0 rgba(255, 255, 255, 0.05);

// Только для инпутов
$shadow-input: 
  0 0 4px 0 rgba(255, 255, 255, 0.05),
  inset 0 0 15px 0 rgba(0, 0, 0, 0.05);
```

### Глобальные Стили
```scss
// Единый радиус
$radius: 28px;

// Глобальный скроллбар
*::-webkit-scrollbar {
  width: 6px;
}

*::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
```

### Responsive
```scss
@mixin mobile  { @media (max-width: 859px)  { @content; } }
@mixin tablet  { @media (max-width: 1364px) { @content; } }
@mixin laptop  { @media (max-width: 1919px) { @content; } }
```

---

## 🔧 BACKEND РЕАЛИЗАЦИЯ

### Ключевые Модули

#### Auth Module
- JWT токены (access 15m + refresh 7d)
- Refresh токен в httpOnly cookie
- bcrypt для паролей (salt 10)
- Guards для защиты endpoints

#### Users Module  
- Поиск по name/username/email (regex)
- Валидация уникальности
- Профили пользователей

#### Chats Module
- Types: personal, group, channel
- unreadCount как Map в схеме
- lastMessage для preview
- Авторизация участников

#### Messages Module
- Санитизация DOMPurify
- Rate limiting (10 msg/min)
- Статусы: sent, delivered, read
- Связь с чатом через populate

#### WebSocket Gateway
```typescript
// Автоматическое присоединение к персональной комнате
handleConnection(client: Socket) {
  const userId = client.data.userId;
  client.join(`user-${userId}`);
}

// Отправка в несколько комнат
handleMessage(dto: SendMessageDto) {
  // В комнату чата
  this.server.to(`chat-${chatId}`).emit('message:new', message);
  
  // В персональные комнаты участников
  participants.forEach(id => {
    this.server.to(`user-${id}`).emit('message:new', message);
  });
}
```

### Утилиты
```typescript
// ID сравнение (ObjectId vs string)
export function compareIds(id1: any, id2: any): boolean {
  return toStringId(id1) === toStringId(id2);
}

export function toStringId(id: any): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (id._id) return String(id._id);
  return id.toString();
}
```

---

## 🎨 FRONTEND РЕАЛИЗАЦИЯ

### Pinia Stores (Composition API)
```typescript
export const useChatsStore = defineStore('chats', () => {
  const chats = ref<Chat[]>([]);
  const currentChat = ref<Chat | null>(null);
  
  // Реактивное обновление списка
  function updateLastMessageInList(chatId: string, message: any) {
    const chatIndex = chats.value.findIndex(c => c._id === chatId);
    
    // Создаем новый объект для реактивности Vue
    const updatedChat = {
      ...chat,
      lastMessage: message,
      unreadCount: currentUnreadCount + 1
    };
    
    // Перемещаем наверх
    chats.value.splice(chatIndex, 1);
    chats.value.unshift(updatedChat);
  }
  
  return { chats, currentChat, updateLastMessageInList };
});
```

### Composables
```typescript
// MaybeRef паттерн для универсальности
export function useChatName(
  chat: MaybeRef<Chat | null>
): ComputedRef<string> {
  const chatRef = toRef(chat);
  
  return computed(() => {
    const chatValue = chatRef.value;
    if (!chatValue) return 'Чат';
    
    // Логика определения имени
    return chatValue.name || 'Новый чат';
  });
}
```

### Компоненты

#### BaseButton
- Variants: primary, secondary, ghost, icon
- Loading state
- Disabled state
- Slot для контента

#### BaseInput
- v-model поддержка
- Валидация и ошибки
- Label и placeholder
- Password toggle

#### VirtualList
- Кастомный Virtual Scrolling
- Динамические высоты через v-measure
- Буфер в 5 элементов
- Автоскролл вниз

---

## 🚀 REAL-TIME И WEBSOCKET

### События WebSocket

#### Клиент → Сервер
```typescript
socket.emit('chat:join', { chatId });
socket.emit('message:send', { chatId, text });
socket.emit('typing:start', { chatId });
```

#### Сервер → Клиент  
```typescript
socket.on('message:new', (message) => {});
socket.on('chat:created', (chat) => {});
socket.on('message:updated', (message) => {});
```

### Комнаты (Rooms)
- `user-${userId}` - персональная комната
- `chat-${chatId}` - комната чата

### Optimistic UI
1. Создаём временное сообщение
2. Сразу показываем в UI
3. Отправляем на сервер
4. Заменяем на реальное

---

## 📜 VIRTUAL SCROLLING

### Кастомная Реализация

#### Метрики
- **DOM**: 20 элементов вместо 1000
- **Память**: 20MB вместо 200MB
- **FPS**: 60 вместо 15-25

#### Архитектура
```
Container
├── Spacer (totalHeight)
└── Viewport (absolute)
    ├── Message 1 (visible)
    ├── Message 2 (visible)
    └── Message N (visible)
```

#### Директива v-measure
```typescript
// Измерение высоты элементов
v-measure.resize="(height) => updateItemHeight(id, height)"
```

---

## 📐 ПАТТЕРНЫ И ПРАВИЛА

### Backend Паттерны

1. **Layered Architecture**
   - Controller → Service → Repository
   - Guards для auth
   - DTOs для валидации

2. **Error Handling**
   - Custom exceptions
   - Global exception filter
   - Proper HTTP статусы

### Frontend Паттерны

1. **Composition API везде**
   ```typescript
   // ✅ Правильно
   defineStore('auth', () => {
     const user = ref(null);
     return { user };
   });
   
   // ❌ Неправильно
   defineStore('auth', {
     state: () => ({ user: null })
   });
   ```

2. **SCSS с правильной вложенностью**
   ```scss
   // ✅ Правильно
   .button {
     &__text { }
     &--primary { }
   }
   
   // ❌ Неправильно  
   .button { }
   .button__text { }
   .button--primary { }
   ```

3. **v-model Pattern**
   ```vue
   <!-- Parent -->
   <Component v-model:value="data" />
   
   <!-- Child -->
   emit('update:value', newValue)
   ```

---

## 💡 ВАЖНЫЕ РЕШЕНИЯ

### 1. Почему Кастомный Virtual Scrolling?
- Библиотеки несовместимы с Nuxt 4
- Полный контроль над рендерингом
- Оптимизация под мессенджер
- Минимальный размер (~200 строк)

### 2. Почему Composition API везде?
- Лучшая типизация TypeScript
- Переиспользование логики
- Единообразие кода
- Современный подход

### 3. Почему Объём через Тени?
- Уникальный визуальный стиль
- Минималистичный дизайн
- Единообразие элементов
- Простота поддержки

### 4. Почему WebSocket для Real-time?
- Двусторонняя связь
- Минимальная задержка
- Комнаты и события
- Масштабируемость

### 5. Почему TypeScript?
- Типобезопасность
- Автодополнение
- Рефакторинг
- Документация в коде

---

## 📝 КОМАНДЫ

### Backend
```bash
cd backend
yarn start:dev     # Development
yarn build          # Production build
yarn test           # Tests
```

### Frontend
```bash
cd frontend
yarn dev            # Development
yarn build          # Production build
```

### Docker
```bash
docker-compose up -d    # Start all
docker-compose logs -f  # View logs
docker-compose down     # Stop all
```

---

## 🎯 СТАТУС ПРОЕКТА

### ✅ Реализовано
- Аутентификация (JWT)
- Регистрация и вход
- Поиск пользователей
- Создание чатов
- Real-time сообщения
- Virtual Scrolling
- Unread счетчики
- Preview режим
- Автоскролл

### 🚧 В разработке
- Индикаторы набора
- Статусы прочтения
- Редактирование сообщений
- Удаление сообщений

### 📅 Планируется
- WebRTC звонки
- E2E шифрование
- Файлы и медиа
- Push уведомления
- Группы и каналы
