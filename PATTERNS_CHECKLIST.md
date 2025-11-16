# ✅ Чек-лист Паттернов и Архитектуры

Быстрая справка для каждого дня разработки.

---

## 🎯 Перед написанием кода спросите себя:

### Масштабируемость (ВАЖНО!):
- [ ] **Легко ли добавить новую функцию?**
- [ ] **Не сломается ли при росте пользователей?**
- [ ] **Можно ли переиспользовать этот код?**
- [ ] **Легко ли будет поддерживать через год?**

### Качество кода:
- [ ] Логика в правильном слое архитектуры?
- [ ] Применяется ли подходящий паттерн?
- [ ] Код безопасен (пароли, данные)?
- [ ] Имена переменных понятны?
- [ ] Не дублируется ли логика? (DRY)
- [ ] Нет ли over-engineering? (KISS)
- [ ] **Применены ли официальные тени?** ⚠️

---

## � Коннцепция Дизайна iCore (КРИТИЧЕСКИ ВАЖНО!)

### Основные правила:

1. **Все элементы имеют ОДИНАКОВЫЙ фон** - $bg-primary (#212121)
2. **Разделение ТОЛЬКО через тени** - $shadow-block и $shadow-input
3. **НЕТ границ (borders)** - НИКОГДА! Только тени!
4. **Семантические HTML5 теги** - ОБЯЗАТЕЛЬНО использовать!
5. **НЕ додумывать** - делать строго по указаниям

```scss
// ✅ Правильно
.element {
  background: $bg-primary; // Единый фон
  box-shadow: $shadow-block; // Разделение через тень
  border-radius: $radius;
  padding: 10px;
  // НЕТ border!
}

// ❌ Неправильно
.element {
  background: $bg-secondary; // Другой фон
  border: 1px solid rgba(255, 255, 255, 0.1); // Границы
}
```

---

## 🏗️ Семантические HTML5 теги (ОБЯЗАТЕЛЬНО!)

### Правильные теги вместо div:

```vue
<!-- ✅ Правильно -->
<template>
  <aside class="sidebar">
    <header class="sidebar-header">
      <nav class="channels-nav">
        <!-- навигация -->
      </nav>
    </header>
    
    <main class="sidebar-content">
      <section class="folders-section">
        <!-- папки -->
      </section>
      
      <section class="chats-section">
        <article class="chat-item">
          <!-- чат -->
        </article>
      </section>
    </main>
  </aside>
</template>

<!-- ❌ Неправильно -->
<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="channels-nav">
        <!-- навигация -->
      </div>
    </div>
  </div>
</template>
```

### Когда использовать какой тег:

- `<header>` - шапка секции/страницы
- `<footer>` - подвал секции/страницы
- `<nav>` - навигация
- `<main>` - основной контент
- `<aside>` - боковая панель (sidebar)
- `<section>` - логический раздел
- `<article>` - независимый контент (карточки, элементы списка)

**Зачем:** SEO, доступность (a11y), читаемость кода

---

## 🎭 Тени - Быстрая Памятка

**ВАЖНО: Используем ТОЛЬКО официальные тени для темной темы!**

### Правило:
```
✅ ВСЕ блоки кроме input → $shadow-block
✅ Только input элементы → $shadow-input
✅ НЕТ границ (borders) - НИКОГДА!
```

### Что использует $shadow-block:
- Карточки чатов
- Сообщения
- Модальные окна
- Dropdown меню
- Badge (уведомления)
- Кнопки
- Headers
- Карточки пользователей
- Любые блочные элементы

### Что использует $shadow-input:
- `<input>`
- `<textarea>`
- `<select>`

### В коде:
```scss
// ✅ Правильно
.chat-item {
  box-shadow: $shadow-block;
}

input {
  box-shadow: $shadow-input;
  
  &:focus {
    box-shadow: $shadow-input, $shadow-focus; // Комбинация
  }
}

// ❌ Неправильно
.message {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); // Своя тень
}
```

---

## 📊 Архитектурные слои

### Backend (NestJS)

```
Запрос → Controller → Guard → Service → Repository → Database
                ↓
             DTO/Validation
```

**Правило**: Каждый слой отвечает за свою задачу!

### Frontend (Nuxt/Vue)

```
UI → Component → Composable → Store → API Service → Backend
                     ↓
                  Types/Interfaces
```

---

## 🎨 Паттерны по дням

### День 1-2: Auth (Backend)

**Применяем:**
- ✅ DTO Pattern (валидация)
- ✅ Service Layer (бизнес-логика)
- ✅ Strategy Pattern (JWT стратегия)
- ✅ Guard Pattern (защита endpoints)
- ✅ Repository Pattern (работа с User в БД)

**Проверка:**
```typescript
// ❌ Плохо: логика в контроллере
@Post('register')
async register(@Body() data) {
  const hash = await bcrypt.hash(data.password, 10)
  await this.db.save({ ...data, password: hash })
}

// ✅ Хорошо: логика в сервисе
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto)
}
```

### День 2: Auth (Frontend)

**Применяем:**
- ✅ Composition Pattern (useAuth composable)
- ✅ Store Pattern (authStore)
- ✅ Service Layer (API сервис)

**Проверка:**
```typescript
// ❌ Плохо: API запрос в компоненте
const login = async () => {
  const res = await fetch('/api/login', { ... })
}

// ✅ Хорошо: через сервис
const authService = useAuthService()
const login = async () => {
  await authService.login(credentials)
}
```

### День 3-4: Friends

**Применяем:**
- ✅ Repository Pattern (поиск пользователей)
- ✅ Query Builder (сложные запросы)
- ✅ Component Composition (UserCard переиспользуемый)

### День 5-7: Chats

**Применяем:**
- ✅ Repository Pattern (CRUD для чатов)
- ✅ Aggregation (сложные выборки)
- ✅ Component Composition (ChatWindow из меньших)
- ✅ Virtual Scrolling (производительность)

### День 8-9: WebSocket

**Применяем:**
- ✅ Gateway Pattern (WebSocket события)
- ✅ Pub/Sub Pattern (Redis)
- ✅ Observer Pattern (подписка на события)

### День 11-12: WebRTC

**Применяем:**
- ✅ Signaling Pattern (координация звонков)
- ✅ Observer Pattern (состояния звонка)

---

## 🔐 Безопасность Checklist

### Каждый endpoint должен иметь:

```typescript
// Backend
@UseGuards(JwtAuthGuard)        // ✅ Аутентификация
@Post('messages')
async create(
  @Body() dto: CreateMessageDto,  // ✅ Валидация
  @User() user: UserPayload       // ✅ Текущий пользователь
) {
  // ✅ Проверка прав
  if (!this.canAccess(user, chatId)) {
    throw new ForbiddenException()
  }
  
  // ✅ Санитизация данных
  const sanitized = this.sanitize(dto.content)
  
  return this.service.create(sanitized)
}
```

### Хранение паролей:

```typescript
// ✅ ОБЯЗАТЕЛЬНО
const hash = await bcrypt.hash(password, 10) // С солью!

// ❌ НИКОГДА
const hash = sha256(password) // Без соли - уязвимо!
```

### Конфиденциальные данные:

```typescript
// ✅ Шифруем перед сохранением
const encrypted = encryptionService.encrypt(sensitiveData)
await db.save({ data: encrypted.data, iv: encrypted.iv })

// ❌ Не храним в открытом виде
await db.save({ email: 'user@email.com' }) // Видно в БД!
```

---

## 📐 SOLID в практике

### Single Responsibility

```typescript
// ❌ Класс делает слишком много
class UserService {
  createUser() { }
  sendWelcomeEmail() { }
  logActivity() { }
  generateReport() { }
}

// ✅ Каждый класс - одна ответственность
class UserService {
  createUser() { }
}
class EmailService {
  sendWelcomeEmail() { }
}
class LoggerService {
  logActivity() { }
}
class ReportService {
  generateReport() { }
}
```

### Dependency Injection

```typescript
// ❌ Жесткая зависимость
class UserService {
  repository = new UserRepository() // Создаем внутри
}

// ✅ Внедрение зависимости
class UserService {
  constructor(
    private repository: UserRepository // Получаем извне
  ) {}
}
```

---

## 🔄 DRY в практике

### Общие функции:

```typescript
// ❌ Дублирование
// В auth.service.ts
const hash = await bcrypt.hash(password, 10)

// В users.service.ts
const hash = await bcrypt.hash(newPassword, 10)

// ✅ Переиспользование
// utils/hash.util.ts
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10)
}

// Везде
import { hashPassword } from '@/utils/hash.util'
const hash = await hashPassword(password)
```

### Общие компоненты:

```vue
<!-- ❌ Дублирование разметки -->
<!-- ChatItem.vue -->
<div class="user-avatar">
  <img :src="avatar" />
</div>

<!-- UserCard.vue -->
<div class="user-avatar">
  <img :src="avatar" />
</div>

<!-- ✅ Переиспользуемый компонент -->
<!-- Avatar.vue -->
<template>
  <div class="avatar">
    <img :src="src" />
  </div>
</template>

<!-- Везде -->
<Avatar :src="user.avatar" />
```

---

## 🧪 Тестируемость

### Хороший код легко тестировать:

```typescript
// ✅ Легко тестировать
class AuthService {
  constructor(
    private userRepo: IUserRepository, // Можно замокать
    private jwtService: IJwtService    // Можно замокать
  ) {}
  
  async login(credentials: LoginDto) {
    const user = await this.userRepo.findByEmail(credentials.email)
    // ...
  }
}

// Тест
const mockRepo = { findByEmail: jest.fn() }
const service = new AuthService(mockRepo, mockJwt)
```

---

## 📁 Структура файлов

### Backend модуль:

```
modules/auth/
├── dto/
│   ├── register.dto.ts      # Входные данные
│   └── login.dto.ts
├── interfaces/
│   └── jwt-payload.interface.ts
├── strategies/
│   └── jwt.strategy.ts      # Passport стратегии
├── guards/
│   └── jwt-auth.guard.ts    # Защита endpoints
├── auth.controller.ts        # HTTP endpoints
├── auth.service.ts           # Бизнес-логика
└── auth.module.ts            # DI контейнер
```

### Frontend feature:

```
features/chat/
├── components/
│   ├── ChatList.vue         # UI компоненты
│   └── ChatWindow.vue
├── composables/
│   └── useChat.ts           # Переиспользуемая логика
├── stores/
│   └── chat.store.ts        # Глобальное состояние
├── services/
│   └── chat.api.ts          # API запросы
├── types/
│   └── chat.types.ts        # TypeScript типы
└── utils/
    └── chat.utils.ts        # Утилиты
```

---

## 🚫 Анти-паттерны (НЕ делать!)

### 1. God Object

```typescript
// ❌ Один класс все делает
class Application {
  handleAuth() { }
  manageUsers() { }
  sendMessages() { }
  processPayments() { }
  generateReports() { }
}
```

### 2. Magic Numbers

```typescript
// ❌ Непонятные цифры
if (user.status === 3) { }
setTimeout(fn, 86400000)

// ✅ Константы с именами
const STATUS_ACTIVE = 3
if (user.status === STATUS_ACTIVE) { }

const ONE_DAY_MS = 24 * 60 * 60 * 1000
setTimeout(fn, ONE_DAY_MS)
```

### 3. Copy-Paste Programming

```typescript
// ❌ Копирование кода
function createPost() {
  validate()
  sanitize()
  save()
}
function createComment() {
  validate()
  sanitize()
  save()
}

// ✅ Абстракция
function create(type: 'post' | 'comment', data) {
  validate(data)
  sanitize(data)
  save(type, data)
}
```

### 4. Callback Hell

```typescript
// ❌ Вложенные коллбеки
getData((data) => {
  processData(data, (result) => {
    saveResult(result, (saved) => {
      notify(saved, () => {
        console.log('Done')
      })
    })
  })
})

// ✅ Async/Await
const data = await getData()
const result = await processData(data)
const saved = await saveResult(result)
await notify(saved)
console.log('Done')
```

---

## 💡 Золотые правила

1. **Пишите код для людей**, а не для машин
2. **Если копируете код дважды** - создайте функцию
3. **Файл > 200 строк?** - разбейте на модули
4. **Функция > 30 строк?** - разбейте на меньшие
5. **Не понятно что делает?** - добавьте комментарий
6. **Сложный алгоритм?** - объясните в комментарии
7. **Тестируйте сразу**, не откладывайте
8. **Рефакторьте постоянно**, не копите технический долг

---

## 📖 Используйте этот чеклист

Перед каждым коммитом:
- [ ] Код следует паттернам?
- [ ] Нет дублирования?
- [ ] Безопасность учтена?
- [ ] Имена понятны?
- [ ] Можно упростить?
- [ ] Легко тестировать?

---

**Качественный код = счастливое будущее! 🚀**
