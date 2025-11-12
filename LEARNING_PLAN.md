# 🎓 План Обучения и Разработки ИCore Messenger

**Продолжительность**: 13 дней  
**Подход**: Вы пишете код → Я объясняю концепции → Обсуждаем альтернативы

---

## 🎨 Важная информация о проекте

### Готовый макет дизайна:
📁 **Папка**: `/home/linkoln/Project/Icore/layout(img)/`
- **Страницы**: Chatlist, Chat, Chanel chatlist
- **Компоненты**: Сообщения, инпуты, хедеры, списки
- **Цветовая палитра**: `цветовая палитра.png` (официальные цвета)
  - `#212121` - темный фон 
  - `#FFC700` - желтый акцент (badge, уведомления)
  - `#FFFFFF` - светлый текст
- **Стиль**: Dark theme, минималистичный, современный

### Frontend требования:
- ✅ Использовать **только Composition API** (`<script setup>`)
- ❌ НЕ объяснять Options API (не используется)
- 🎨 Следовать готовому дизайну из макетов
- 💅 SASS для стилизации компонентов

---

## 📋 Принципы работы

### 🎯 Подход обучения

**Формат работы**:
1. **Я показываю Best Practices** - демонстрирую лучшую реализацию кода
2. **Объясняю что делает** - разбираем код построчно
3. **Объясняю почему именно так** - обосновываю выбор подхода
4. **Обсуждаем альтернативы** - рассматриваем другие варианты и trade-offs
5. **Вы пишете сами** - применяете знания на практике

**Акцент на масштабируемость**:
- ✅ Всегда показываю production-ready код
- ✅ Применяю Design Patterns с первого дня
- ✅ Код легко расширяется и поддерживается
- ✅ Думаем о будущем проекта

**Важно**: Я показываю как правильно, объясняю почему, вы реализуете. Так вы учитесь писать качественный, масштабируемый код.

---

## 🏗️ Принципы Качественной Разработки

### Код должен быть:

**1. Переиспользуемым (Reusable)**
- 🔄 Общие функции в `utils/`
- 🧩 Композируемые компоненты
- 📦 Модульная архитектура
- 🎯 Single Responsibility Principle

**2. Поддерживаемым (Maintainable)**
- 📝 Понятные имена переменных
- 💬 Комментарии для сложной логики
- 📊 Чистая архитектура (Clean Architecture)
- 🔍 Легко найти и исправить баги

**3. Масштабируемым (Scalable)**
- 📈 Готовность к росту функционала
- ⚡ Оптимизация производительности
- 🔌 Слабая связанность модулей
- 🎯 High cohesion, low coupling

---

## 🎨 Паттерны Проектирования

### Backend (NestJS):

**1. Dependency Injection (DI)**
```typescript
// Внедрение зависимостей через конструктор
constructor(
  private readonly userService: UserService,
  private readonly jwtService: JwtService
) {}
```
**Зачем**: Легко тестировать, заменять реализации

**2. Repository Pattern**
```typescript
// Абстракция работы с БД
class UserRepository {
  async findById(id: string): Promise<User> { }
  async create(data: CreateUserDto): Promise<User> { }
}
```
**Зачем**: Отделение бизнес-логики от БД

**3. Service Layer Pattern**
```typescript
// Бизнес-логика в сервисах
class AuthService {
  async login(credentials) { }
  async validateUser(userId) { }
}
```
**Зачем**: Переиспользование логики

**4. DTO Pattern**
```typescript
// Валидация и трансформация данных
class CreateUserDto {
  @IsString() username: string;
  @IsEmail() email: string;
}
```
**Зачем**: Безопасность и валидация

**5. Strategy Pattern**
```typescript
// Разные стратегии аутентификации
class JwtStrategy extends PassportStrategy(Strategy) { }
class LocalStrategy extends PassportStrategy(Strategy) { }
```
**Зачем**: Гибкость смены алгоритмов

### Frontend (Vue/Nuxt):

**1. Composition Pattern**
```typescript
// Переиспользуемая логика в composables
export function useAuth() {
  const login = () => { }
  const logout = () => { }
  return { login, logout }
}
```
**Зачем**: DRY (Don't Repeat Yourself)

**2. Store Pattern (Pinia)**
```typescript
// Централизованное состояние
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  return { user }
})
```
**Зачем**: Единственный источник правды

**3. Component Composition**
```typescript
// Маленькие компоненты → большие
<ChatWindow>
  <ChatHeader />
  <MessageList />
  <MessageInput />
</ChatWindow>
```
**Зачем**: Переиспользование, тестирование

**4. Props & Events Pattern**
```typescript
// Односторонний поток данных
defineProps<{ message: Message }>()
defineEmits<{ send: [text: string] }>()
```
**Зачем**: Предсказуемость

**5. Service Layer**
```typescript
// API запросы в отдельных сервисах
class ApiService {
  async getMessages(chatId: string) { }
}
```
**Зачем**: Переиспользование, тестирование

---

## 🔐 Безопасность

### 1. Пароли с "солью" (Salt)

```typescript
// Backend: Используем bcrypt
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Количество раундов

// При регистрации
async hashPassword(password: string): Promise<string> {
  // bcrypt автоматически генерирует соль
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash; // Сохраняем в БД
}

// При входе
async comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

**Что такое "соль"?**
- 🧂 Случайная строка, добавляемая к паролю
- 🔒 Защита от rainbow tables
- 🎲 Уникальна для каждого пользователя
- ✅ bcrypt делает это автоматически!

**Почему 10 раундов?**
- ⚡ Баланс между безопасностью и скоростью
- 🔢 2^10 = 1024 итерации хеширования
- ⏱️ ~50-100ms на хеширование
- 🛡️ Защита от brute-force атак

### 2. Шифрование конфиденциальных данных

#### A. Данные в БД (MongoDB)

```typescript
// Шифрование полей перед сохранением
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 байта
const IV_LENGTH = 16;

class EncryptionService {
  // Шифрование
  encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }
  
  // Расшифровка
  decrypt(encrypted: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

**Что шифруем:**
- 📧 Email (опционально)
- 📞 Номера телефонов
- 🔑 API ключи
- 📝 Личные данные

#### B. End-to-End шифрование сообщений

```typescript
// Frontend: Web Crypto API
class E2EEncryption {
  // Генерация ключа из passphrase
  async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  // Шифрование сообщения
  async encrypt(message: string, key: CryptoKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return { encrypted, iv };
  }
}
```

**Принцип E2E:**
- 🔐 Шифрование на клиенте
- 🚫 Сервер НЕ имеет ключей
- 🔑 Только получатель может расшифровать
- 💾 Сервер хранит только зашифрованные данные

### 3. JWT токены

```typescript
// Backend: Безопасная генерация JWT
{
  secret: process.env.JWT_SECRET, // Минимум 32 символа
  signOptions: {
    expiresIn: '15m',  // Access token: 15 минут
    algorithm: 'HS256'
  }
}

// Refresh token: 7 дней
{
  expiresIn: '7d'
}
```

**Где хранить на клиенте:**
- ✅ httpOnly cookies (лучший вариант)
- ⚠️ localStorage (уязвимо к XSS)
- ❌ sessionStorage (теряется при закрытии)

---

## 🏛️ Архитектура Проекта

### Clean Architecture (Чистая Архитектура)

```
┌─────────────────────────────────────┐
│       Presentation Layer            │  ← UI, Controllers
│   (Controllers, Pages, Components)  │
├─────────────────────────────────────┤
│       Application Layer             │  ← Use Cases, Services
│     (Services, Stores, Composables) │
├─────────────────────────────────────┤
│       Domain Layer                  │  ← Business Logic
│    (Entities, DTOs, Interfaces)     │
├─────────────────────────────────────┤
│       Infrastructure Layer          │  ← External Services
│   (Database, API, WebSocket, etc)   │
└─────────────────────────────────────┘
```

### Структура модуля (Backend):

```
modules/auth/
├── dto/                    # Data Transfer Objects
│   ├── register.dto.ts
│   └── login.dto.ts
├── strategies/             # Passport стратегии
│   └── jwt.strategy.ts
├── guards/                 # Guards для защиты
│   └── jwt-auth.guard.ts
├── interfaces/             # TypeScript интерфейсы
│   └── auth.interface.ts
├── auth.controller.ts      # HTTP endpoints
├── auth.service.ts         # Бизнес-логика
└── auth.module.ts          # Модуль NestJS
```

### Структура модуля (Frontend):

```
features/chat/
├── components/             # UI компоненты
│   ├── ChatList.vue
│   └── ChatWindow.vue
├── composables/            # Переиспользуемая логика
│   └── useChat.ts
├── stores/                 # State management
│   └── chat.store.ts
├── types/                  # TypeScript types
│   └── chat.types.ts
└── pages/                  # Страницы
    └── chat/
        └── [id].vue
```

---

## 📐 Методологии

### 1. SOLID Principles

**S - Single Responsibility**
```typescript
// ❌ Плохо
class UserService {
  createUser() { }
  sendEmail() { }     // Не его ответственность
  logActivity() { }   // Не его ответственность
}

// ✅ Хорошо
class UserService {
  createUser() { }
}
class EmailService {
  sendEmail() { }
}
class LoggerService {
  logActivity() { }
}
```

**O - Open/Closed**
```typescript
// Открыт для расширения, закрыт для изменения
abstract class PaymentProcessor {
  abstract process(amount: number): void;
}

class StripeProcessor extends PaymentProcessor {
  process(amount: number) { /* Stripe logic */ }
}
```

**L - Liskov Substitution**
```typescript
// Подклассы должны заменять родительский класс
class Bird {
  fly() { }
}
// Пингвин не может летать - нарушение LSP!
```

**I - Interface Segregation**
```typescript
// Много маленьких интерфейсов лучше одного большого
interface Readable {
  read(): void;
}
interface Writable {
  write(): void;
}
```

**D - Dependency Inversion**
```typescript
// Зависимость от абстракций, а не конкретных реализаций
class UserService {
  constructor(private repository: IUserRepository) { }
  // Не важно MongoDB или PostgreSQL - интерфейс одинаковый
}
```

### 2. DRY (Don't Repeat Yourself)

```typescript
// ❌ Плохо: дублирование кода
function createUser() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
}
function updatePassword() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
}

// ✅ Хорошо: переиспользование
async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}
```

### 3. KISS (Keep It Simple, Stupid)

```typescript
// ❌ Сложно
const result = arr.reduce((acc, item) => [...acc, item.value * 2], []);

// ✅ Просто
const result = arr.map(item => item.value * 2);
```

### 4. YAGNI (You Aren't Gonna Need It)

```
❌ Не пишите код "на будущее"
✅ Пишите то, что нужно сейчас
✅ Рефакторьте когда появится необходимость
```

---

## 📋 Применение в Плане

Каждый день будем изучать:
- 🎨 **Паттерн дня** - какой паттерн применяем
- 🏗️ **Архитектура** - как структурировать код
- 🔐 **Безопасность** - как защитить данные
- 🔄 **Переиспользование** - как избежать дублирования

---

## 🗓️ Детальный План (13 дней)

### 📅 День 0: Подготовка (1-2 часа)

#### Что изучим:
- **TypeScript основы** (типы, интерфейсы, классы)
- **Структура проекта**
- **Запуск окружения**

#### Практика:
```bash
# Запустим проект
docker-compose up -d

# Проверим что всё работает
curl http://localhost:3001
curl http://localhost:3000
```

#### Изучаемые концепции:
- Что такое TypeScript и зачем он нужен
- Структура NestJS и Nuxt проектов
- Docker и docker-compose
- Переменные окружения (.env)

---

### 📅 Дни 1-2: Аутентификация

#### День 1: Backend Auth (4-6 часов)

**Файлы для создания:**
```
backend/src/modules/users/schemas/user.schema.ts
backend/src/modules/auth/dto/register.dto.ts
backend/src/modules/auth/dto/login.dto.ts
backend/src/modules/auth/strategies/jwt.strategy.ts
backend/src/modules/auth/guards/jwt-auth.guard.ts
```

**Концепции:**

1. **Mongoose Schema** (45 мин)
   - Определение структуры данных в MongoDB
   - Валидация на уровне схемы
   - Индексы и уникальность

2. **DTO (Data Transfer Object)** (30 мин)
   - Валидация входящих данных
   - class-validator декораторы
   - Безопасность

3. **JWT Authentication** (60 мин)
   - Структура токена (Header, Payload, Signature)
   - Access vs Refresh токены
   - Где хранить токены

4. **Bcrypt** (25 мин)
   - Хеширование паролей
   - Salt и rounds
   - Сравнение паролей

#### День 2: Frontend Auth (4-6 часов)

**Файлы для создания:**
```
frontend/app/pages/login.vue
frontend/app/pages/register.vue
frontend/app/stores/auth.ts
frontend/app/services/api.ts
```

**Концепции:**

1. **Vue 3 Composition API** (60 мин)
   - `ref` vs `reactive`
   - `computed`, `watch`
   - lifecycle hooks (`onMounted`, `onUnmounted`)
   - `<script setup>` синтаксис

2. **Pinia Store** (45 мин)
   - State management
   - Почему Pinia вместо Vuex
   - Композиция stores
   - Персистентность

3. **HTTP запросы** (30 мин)
   - fetch vs axios vs $fetch
   - Обработка ошибок
   - TypeScript типизация

4. **Форма и валидация** (30 мин)
   - v-model
   - @submit.prevent
   - Клиентская валидация
   - UX для ошибок

**🎨 Дизайн:**
- Простая форма (пока без финального дизайна)
- Фокус на функциональности
- Стилизация по макетам придет в День 7-10

---

### 📅 Дни 3-4: Система Друзей

#### День 3: Backend Friends (4-5 часов)

**Файлы:**
```
backend/src/modules/users/schemas/friend-request.schema.ts
backend/src/modules/users/users.service.ts (дополнение)
```

**Концепции:**

1. **MongoDB Relations** (45 мин)
   - Embedded vs Referenced
   - Population
   - Производительность

2. **Query Builder** (30 мин)
   - find, findOne
   - Query operators ($or, $and)
   - Регулярные выражения
   - Индексы для поиска

3. **Статусы и состояния** (30 мин)
   - Enum для статусов
   - State machine логика
   - Валидация переходов

#### День 4: Frontend Friends (4-5 часов)

**Файлы:**
```
frontend/app/pages/friends.vue
frontend/app/components/UserCard.vue
frontend/app/stores/friends.ts
```

**Концепции:**

1. **Композиция компонентов** (45 мин)
   - Props и Events
   - Переиспользуемость
   - Slots

2. **Debouncing** (30 мин)
   - Оптимизация поиска
   - VueUse composables
   - Throttle vs Debounce

3. **Lists и keys** (20 мин)
   - v-for
   - :key важность
   - Performance

---

### 📅 Дни 5-7: Чаты и Сообщения

#### День 5: Backend Chats (5-6 часов)

**Концепции:**

1. **Schema для Chat** (60 мин)
   - Типы чатов (personal, group)
   - Participants array
   - Timestamps

2. **Schema для Message** (45 мин)
   - Связь с Chat
   - Метаданные
   - Типы контента

3. **CRUD операции** (60 мин)
   - Create, Read, Update, Delete
   - Error handling
   - Transactions

#### День 6: Backend Messages (5-6 часов)

**Концепции:**

1. **Pagination** (45 мин)
   - Offset-based
   - Cursor-based
   - Infinite scroll

2. **Aggregation** (60 мин)
   - Pipeline stages
   - $lookup для joins
   - $group, $sort

3. **Оптимизация** (30 мин)
   - Индексы
   - Проекции
   - Лимиты

#### День 7: Frontend Chats UI (6-8 часов)

**Файлы:**
```
frontend/app/pages/chat/index.vue        ← Главная страница (layout)
frontend/app/pages/chat/[id].vue         ← Динамический роут чата
frontend/app/components/ChatList.vue     ← Список чатов (sidebar)
frontend/app/components/ChatWindow.vue   ← Окно чата
frontend/app/components/MessageList.vue  ← Сообщения
frontend/app/components/MessageInput.vue ← Инпут (из макета)
frontend/app/components/EmptyState.vue   ← "Выберите чат" placeholder
```

**🎨 Используем макеты:**
- `pages/Chatlist.png` → список чатов с поиском
- `pages/Chat.png` → окно чата с правилами
- `components/чат.png` → элемент списка чатов
- `components/message.png` → сообщение
- `components/input block (в чате).png` → форма ввода
- `components/шапка (в чате).png` → хедер чата

**Концепции:**

1. **Адаптивный Layout** (90 мин) ⭐ ВАЖНО!
   - **Desktop (≥1024px)**: Grid двухколоночный
     - Sidebar 300px + Chat flex: 1
     - Оба компонента видимы одновременно
     - EmptyState когда чат не выбран ("Выберите чат")
   - **Mobile/Tablet (<1024px)**: Одноколоночный
     - По умолчанию: Sidebar на весь экран
     - При клике на чат: Chat плавно выезжает (transform)
     - Кнопка "назад" для возврата к списку
   - Responsive с window.innerWidth
   - Media queries и breakpoints

2. **State Management** (45 мин)
   - selectedChatId (ref)
   - isMobile (computed)
   - handleResize listener
   - Состояния: пустой / выбран чат

3. **Transitions & Animations** (45 мин)
   - Slide transition для mobile
   - transform: translateX() для плавности
   - Vue <Transition> компонент
   - Performance (transform vs margin)

4. **Virtual Scrolling** (60 мин)
   - Зачем нужен (тысячи сообщений)
   - VueUse virtual list
   - Performance оптимизация

5. **Optimistic Updates** (45 мин)
   - UX улучшение
   - Rollback при ошибке
   - Temporary IDs

6. **Auto-scroll** (30 мин)
   - nextTick
   - Smart scroll (не скроллить если читает старое)
   - Scroll to bottom

---

### 📅 Дни 8-9: Real-time WebSocket

#### День 8: Backend WebSocket (5-6 часов)

**Концепции:**

1. **Socket.io Gateway** (90 мин)
   - WebSocket vs HTTP
   - События и rooms
   - Broadcasting
   - Namespaces

2. **WS Authentication** (60 мин)
   - JWT в WebSocket
   - Guards
   - Connection validation

3. **Redis Pub/Sub** (70 мин)
   - Зачем Redis
   - Масштабирование
   - Pub/Sub паттерн

#### День 9: Frontend WebSocket (4-5 часов)

**Концепции:**

1. **Socket.io Client** (60 мин)
   - Composable pattern
   - Connection management
   - Reconnection

2. **Event Handling** (45 мин)
   - Event listeners
   - Cleanup
   - Memory leaks

3. **TypeScript типизация** (30 мин)
   - Typed events
   - Generic types
   - Shared types

---

### 📅 День 10: Поиск и UI (4-6 часов)

**🎨 Доводим UI до макета:**
- Реализуем все компоненты из `layout(img)/components/`
- Полируем стили под dark theme
- Добавляем анимации и transitions
- Адаптивность под разные экраны

**Компоненты из макетов:**
- `voice message.png` → голосовые сообщения
- `message-1.png, message-2.png, ...` → разные типы сообщений
- `Список Папок.png` → организация чатов
- `Список каналов.png` → список каналов
- `шапка-поиск.png` → поиск с фильтрами

**Концепции:**

1. **Full-text search** (50 мин)
   - MongoDB text indexes
   - Search optimization
   - UI поиска из макета

2. **Notifications** (40 мин)
   - Toast messages
   - Badge с счетчиками (желтые из макета)
   - UX patterns

3. **Loading/Error states** (50 мин)
   - Suspense
   - Skeleton screens
   - Error boundaries
   - "Пустой чат" блок из макета

---

### 📅 Дни 11-12: WebRTC Звонки

#### День 11: WebRTC Backend (5-6 часов)

**Концепции:**

1. **WebRTC Signaling** (90 мин)
   - Как работает WebRTC
   - Signaling server
   - STUN/TURN

2. **События для звонков** (60 мин)
   - offer/answer
   - ICE candidates
   - Call states

#### День 12: WebRTC Frontend (6-8 часов)

**Концепции:**

1. **Media Streams** (60 мин)
   - getUserMedia
   - Permissions
   - Constraints

2. **RTCPeerConnection** (130 мин)
   - Offer/Answer flow
   - ICE candidates
   - Connection states

3. **UI для звонков** (60 мин)
   - Video элементы
   - Call controls
   - Error handling

---

### 📅 День 13: Тестирование (весь день)

**Что сделаем:**
- Ручное тестирование
- Исправление багов
- Оптимизация
- Документация

**Концепции:**
- Browser DevTools
- Performance profiling
- Debugging техники

---

## 📚 TypeScript Основы

### Базовые типы:
```typescript
const name: string = 'John'
const age: number = 25
const isActive: boolean = true
const tags: string[] = ['vue', 'typescript']
```

### Interfaces:
```typescript
interface User {
  id: string
  username: string
  email: string
}
```

### Types:
```typescript
type Status = 'pending' | 'accepted' | 'rejected'
type ID = string | number
```

### Generics:
```typescript
interface ApiResponse<T> {
  data: T
  error?: string
}
```

---

## 🎯 Приоритеты по дням

**Обязательно (Core):**
- День 1-2: Auth ✅
- День 3-4: Friends ✅
- День 5-7: Chats ✅
- День 8-9: WebSocket ✅
- День 10: Search & UI ✅
- День 11-12: Voice Calls ✅

**Если останется время:**
- Видеозвонки (расширение WebRTC)
- Каналы (как групповые чаты)
- Папки (UI организация)
- End-to-end шифрование

---

## 💡 Полезные ресурсы

**Документация:**
- NestJS: https://docs.nestjs.com
- Vue 3: https://vuejs.org/guide
- Pinia: https://pinia.vuejs.org
- Socket.io: https://socket.io/docs

**Обучение:**
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- MDN Web Docs: https://developer.mozilla.org

---

## 📝 Как начать

1. **Прочитайте этот план**
2. **Ознакомьтесь с макетами**: `/home/linkoln/Project/Icore/layout(img)/`
3. **Посмотрите дизайн-справочник**: `DESIGN_REFERENCE.md`
4. **Запустите проект**: `docker-compose up -d`
5. **Скажите мне "Начинаем с Дня 0"**
6. Я объясню концепцию
7. Вы пишете код
8. Я объясняю каждую строку и альтернативы

---

## 📚 Дополнительные файлы

### Обучение и методология:
- `TEACHING_METHOD.md` - Методология обучения Best Practices (НОВЫЙ!)
- `PATTERNS_CHECKLIST.md` - Чек-лист паттернов и архитектуры
- `LEARNING_PLAN.md` - Этот файл (план на 13 дней)

### Дизайн и стили:
- `DESIGN_REFERENCE.md` - Полный справочник по дизайну с палитрой и тенями
- `SHADOWS_GUIDE.md` - Подробное руководство по теням
- `STYLES_SUMMARY.md` - Краткая справка по стилям
- `layout(img)/цветовая палитра.png` - Официальная палитра цветов
- `frontend/app/assets/styles/variables.scss` - Переменные (палитра + тени)
- `frontend/app/assets/styles/mixins.scss` - Mixins (адаптив + transitions)
- `frontend/app/assets/styles/main.scss` - Импорты + базовые стили

### Документация проекта:
- `PROJECT_SUMMARY.md` - Сводка проекта
- `PROJECT_STRUCTURE.md` - Структура папок
- `docs/ARCHITECTURE.md` - Архитектура
- `docs/DEVELOPMENT.md` - Руководство разработчика

---

**Готовы начать днём? Скажите "Начинаем День 0"! 🚀**
