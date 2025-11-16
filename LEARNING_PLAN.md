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
- 🏗️ **Семантическая HTML5 верстка** (main, section, article, header, footer)
- 🧩 **Компонентная архитектура** (переиспользуемые UI компоненты)
- 📦 **DRY принцип** (нет дублирования кода, типов, стилей)

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

**4. Семантичным (Semantic)**
- 🏗️ Правильные HTML5 теги (main, section, article)
- ♿ Доступность (a11y) - label связан с input
- 🔍 SEO оптимизация
- 📖 Читаемый код - структура понятна без CSS

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
// API запросы в отдельных сервисах (функции, НЕ классы!)
// Используем $fetch из Nuxt (НЕ axios!)
export async function getMessages(chatId: string) {
  return await $fetch(`/api/chats/${chatId}/messages`)
}
```
**Зачем**: Переиспользование, тестирование, простота

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
# Запустим проект через Docker Compose
docker-compose up -d

# Проверим что всё работает
# Backend API
curl http://localhost:3001

# Frontend
curl http://localhost:3000

# MongoDB
docker exec -it icore-mongodb mongosh -u admin -p password123

# Redis
docker exec -it icore-redis redis-cli
```

**Важно:** Проект запускается через Docker Compose! Все сервисы (MongoDB, Redis, Backend, Frontend) в контейнерах с hot-reload.

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
frontend/app/types/auth.types.ts                    # Централизованные типы
frontend/app/components/ui/BaseInput.vue            # Переиспользуемый input
frontend/app/components/ui/BaseButton.vue           # Переиспользуемая кнопка
frontend/app/components/auth/Form.vue               # Обертка для форм (тег: <AuthForm>)
frontend/app/composables/useFormValidation.ts       # Логика валидации
frontend/app/services/api/auth.service.ts           # API функции
frontend/app/stores/auth.ts                         # Pinia store
frontend/app/composables/useAuth.ts                 # Facade над store
frontend/app/pages/login.vue                        # Страница входа
frontend/app/pages/register.vue                     # Страница регистрации
frontend/app/middleware/auth.ts                     # Защита маршрутов
frontend/app/middleware/guest.ts                    # Для неавторизованных
```

**Концепции:**

1. **Компонентная архитектура** (60 мин) ⭐ НОВОЕ!
   - **Принцип DRY**: один компонент для всех input/button
   - **BaseInput.vue**: переиспользуемый input с валидацией
   - **BaseButton.vue**: кнопка с вариантами (primary/secondary/ghost)
   - **Form.vue**: обертка для auth форм (в папке auth/)
   - **Именование**: `components/auth/Form.vue` → тег `<AuthForm>`
   - **Props & Events**: двустороннее связывание через v-model
   - **Slots**: гибкость через слоты (header, footer)

2. **Централизованные типы** (30 мин) ⭐ НОВОЕ!
   - **types/auth.types.ts**: все типы в одном месте
   - User, LoginCredentials, RegisterData, AuthResponse
   - **Принцип DRY**: типы переиспользуются везде
   - Нет дублирования интерфейсов

3. **Переиспользуемая валидация** (45 мин) ⭐ НОВОЕ!
   - **composables/useFormValidation.ts**: логика валидации
   - Функции: validateEmail(), validatePassword(), validateUsername()
   - Экспорт в компоненты и страницы
   - **Принцип DRY**: валидация не дублируется

4. **Vue 3 Composition API** (45 мин)
   - `ref` vs `reactive`
   - `computed`, `watch`
   - lifecycle hooks (`onMounted`, `onUnmounted`)
   - `<script setup>` синтаксис

5. **Pinia Store** (45 мин)
   - State management
   - Почему Pinia вместо Vuex
   - Композиция stores
   - Персистентность (localStorage)

6. **Service Layer** (30 мин)
   - **auth.service.ts**: функции вместо класса (Nuxt 4)
   - register(), login(), getProfile()
   - Использование $fetch (встроенный в Nuxt, НЕ axios!)
   - Использование типов из auth.types.ts
   - Обработка ошибок

7. **Composable Facade** (30 мин)
   - **useAuth.ts**: удобный доступ к store
   - Методы с редиректами
   - Computed для реактивности

8. **Семантическая верстка HTML5** (30 мин) ⭐ ВАЖНО!
   - **Правильные теги вместо div**:
     - `<main>` - основной контент страницы
     - `<section>` - логические разделы
     - `<article>` - независимый контент (карточки, формы)
     - `<header>` - шапка секции/страницы
     - `<footer>` - подвал секции/страницы
     - `<nav>` - навигация
   - **Зачем**: SEO, доступность (a11y), читаемость кода
   - **Пример структуры**:
     ```vue
     <template>
       <main class="login-page">
         <article class="auth-form">
           <header class="auth-form__header">
             <h1>Вход</h1>
           </header>
           <form><!-- поля --></form>
           <footer class="auth-form__footer">
             <!-- ссылки -->
           </footer>
         </article>
       </main>
     </template>
     ```
   - **Связь label и input**: обязательно через `for` и `id`
   - **button type**: всегда указывать `type="submit"` или `type="button"`

**🎨 Дизайн:**
- Темная тема (#212121 фон, #FFC700 акцент)
- Компоненты с официальными тенями ($shadow-block, $shadow-input)
- Семантическая верстка (main, section, article, header, footer)
- **Типографика**: 
  - **Шрифт '5mal6Lampen'** (пиксельный/ретро стиль) применяется ко ВСЕМ элементам:
    - Заголовки (h1-h6): UPPERCASE, letter-spacing: 1-2px
    - Labels, inputs, buttons: обычный регистр
    - Весь текст использует этот шрифт
  - Использовать @include font-styles(size, weight, line-height)
- Адаптивность через mixins (@include mobile, @include tablet)

---

### 📅 День 2: User Search API + Sidebar UI (БЕЗ системы друзей!)

**ВАЖНО:** В iCore Messenger НЕТ системы друзей! Как в Telegram - можно писать любому пользователю напрямую через глобальный поиск.

**Обучающие материалы:**
- `learning/Day_2/README.md` - общий обзор
- `learning/Day_2/OVERVIEW.md` - детальный обзор
- `learning/Day_2/QUICK_START.md` - быстрый старт
- `learning/Day_2/INDEX.md` - навигация по материалам
- `learning/Day_2/Backend_Implementation/` - Backend теория/практика/чеклист
- `learning/Day_2/Frontend_Implementation/` - Frontend теория/практика/чеклист

---

#### Backend: User Search API (4-5 часов)

**Цель:** Реализовать глобальный поиск пользователей через MongoDB Query Builder с text indexes

**Что сделаем:**
1. **SearchUsersDto** - валидация query параметров (query, limit, skip)
2. **UsersService.searchUsers()** - поиск через $regex, $or, $ne
3. **GET /users/search** endpoint с JWT защитой
4. **MongoDB Text Indexes** для оптимизации (name, userId, email)
5. **Offset-based Pagination** с hasMore индикатором

**Новые концепции:**
- **MongoDB Query Builder**: $regex (pattern matching), $or (logical OR), $ne (exclude current user)
- **MongoDB Text Indexes**: O(log n) performance для full-text search
- **Offset-based Pagination**: limit (количество), skip (offset), total (всего), hasMore (есть ещё)
- **DTO Validation**: @IsString, @MinLength(2), @IsOptional, @Type(() => Number), @IsInt, @Min
- **Service Layer Pattern**: разделение Controller / Service / Repository

**Файлы:**
- `backend/src/modules/users/dto/search-users.dto.ts` ✅ создаём
- `backend/src/modules/users/users.service.ts` ✏️ добавляем searchUsers()
- `backend/src/modules/users/users.controller.ts` ✏️ добавляем GET /users/search
- `backend/src/modules/users/schemas/user.schema.ts` ✏️ добавляем text indexes

**API Endpoint:**
```
GET /users/search?query=john&limit=10&skip=0
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "users": [{ _id, userId, name, email, avatar, createdAt, updatedAt }],
  "total": 42,
  "hasMore": true
}
```

**Применяем паттерны:**
- Service Layer Pattern (UsersService.searchUsers)
- DTO Pattern (SearchUsersDto)
- Repository Pattern (MongoDB queries)

**Обучающие материалы:**
- `learning/Day_2/Backend_Implementation/README.md` - обзор Backend части
- `learning/Day_2/Backend_Implementation/Theory.md` - теория (MongoDB Query Builder, Indexes, Pagination, DTO, Service Layer)
- `learning/Day_2/Backend_Implementation/Practice.md` - пошаговая практика (6 шагов)
- `learning/Day_2/Backend_Implementation/Checklist.md` - чеклист для отслеживания прогресса

---

#### Frontend: Sidebar UI + Global Search (4-5 часов)

**Цель:** Создать адаптивный Sidebar с AppHeader, MenuModal и глобальным поиском пользователей

**Что сделаем:**
1. **ChatList.vue (Sidebar)** - адаптивный (Desktop: 450px, Mobile: 100vw)
2. **AppHeader.vue** - MenuButton + SearchInput с debouncing
3. **MenuButton.vue** - иконка гамбургер-меню
4. **MenuModal.vue** - Профиль, Настройки, Выйти (Teleport to body)
5. **SearchInput.vue** - поиск с debounce 300ms + dropdown результатов
6. **user.service.ts** - интеграция с Backend API (fetch)
7. **users.ts store** - состояние поиска (searchResults, searchLoading, searchError)
8. **user.types.ts** - типы (User, SearchUsersParams, SearchUsersResponse)

**Новые концепции:**
- **Adaptive Layout**: 450px (Desktop), 100vw (Mobile), breakpoint 1024px
- **Component Composition**: MenuButton + SearchInput → AppHeader
- **Debouncing**: useDebounceFn от @vueuse/core (300ms delay)
- **Dropdown UI Patterns**: закрытие по Escape, onClickOutside от @vueuse/core
- **Modal Patterns**: v-model для open/close, Teleport to="body", @click.stop
- **Semantic HTML5**: aside (sidebar), header (app header), nav (navigation), main (content)
- **Official Shadows**: $shadow-block (для блоков), $shadow-input (ТОЛЬКО для input)
- **Store Pattern**: Pinia store для глобального состояния

**Файлы:**
- `frontend/app/types/user.types.ts` ✅ создаём
- `frontend/app/services/api/user.service.ts` ✅ создаём
- `frontend/app/stores/users.ts` ✅ создаём
- `frontend/app/components/MenuButton.vue` ✅ создаём
- `frontend/app/components/MenuModal.vue` ✅ создаём
- `frontend/app/components/SearchInput.vue` ✅ создаём
- `frontend/app/components/AppHeader.vue` ✅ создаём
- `frontend/app/components/ChatList.vue` ✅ создаём
- `frontend/app/app.vue` ✏️ интегрируем ChatList

**Layout Structure:**
```
Desktop (≥1024px):
┌────────────────────┬──────────────────────────┐
│   SIDEBAR (450px)  │   CHAT WINDOW (flex: 1) │
├────────────────────┼──────────────────────────┤
│  ┌──────────────┐  │                          │
│  │ [☰] [ПОИСК🔍]│  │    "Выберите чат"        │
│  └──────────────┘  │                          │
│                    │      (placeholder)       │
│  (список чатов)    │                          │
└────────────────────┴──────────────────────────┘

Mobile (<1024px):
┌──────────────────────┐
│  ┌────────────────┐  │
│  │ [☰] [ПОИСК 🔍] │  │
│  └────────────────┘  │
│                      │
│  (список чатов)      │
└──────────────────────┘
```

**Применяем паттерны:**
- Component Composition Pattern (MenuButton + SearchInput → AppHeader)
- Store Pattern (Pinia users.ts store)
- Debouncing Pattern (useDebounceFn)
- Modal Pattern (v-model + Teleport)
- Dropdown Pattern (Escape + click outside)

**Design Rules:**
- Single background: $bg-primary (#212121)
- NO borders - separation only through shadows
- Font: '5mal6Lampen'
- Official Shadows: $shadow-block (blocks), $shadow-input (inputs only)

**Обучающие материалы:**
- `learning/Day_2/Frontend_Implementation/README.md` - обзор Frontend части
- `learning/Day_2/Frontend_Implementation/Theory.md` - теория (Adaptive Layout, Component Composition, Debouncing, Dropdown UI, Modal patterns, Semantic HTML5, Official Shadows, Store Pattern)
- `learning/Day_2/Frontend_Implementation/Practice.md` - пошаговая практика (8 шагов)
- `learning/Day_2/Frontend_Implementation/Checklist.md` - чеклист для отслеживания прогресса

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
