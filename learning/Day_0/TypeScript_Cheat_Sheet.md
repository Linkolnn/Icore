# 📖 TypeScript - Быстрая шпаргалка

> Краткая справка по основным концепциям. Подробности в `Day_0_TypeScript_Basics.md`

---

## 🎯 Базовые концепции

### Type Annotation (Аннотация типа)

**Что это**: Указываем тип переменной через двоеточие `:`

```typescript
const name: string = 'John'
const age: number = 25
const user: User = { ... }
//        ↑
//        Это type annotation
```

**Читается**: "переменная `name` имеет тип `string`"

---

## 📦 Interface (Интерфейс)

**Что это**: Контракт - описание структуры объекта

```typescript
// Описываем структуру
interface User {
  id: string
  name: string
  email: string
}

// Используем
const user: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com'
}
```

**Зачем**: 
- Контракт между модулями
- Type safety
- Документация в коде

---

## 🏷️ Type Alias (Псевдоним типа)

**Что это**: Даём имя любому типу

```typescript
// Union type
type Status = 'active' | 'inactive'

// Literal type
type Role = 'admin' | 'user'

// Использование
const status: Status = 'active'
```

**Когда использовать**:
- `type` для union types, literal types
- `interface` для объектов

---

## 📋 DTO (Data Transfer Object)

**Что это**: Объект только для передачи данных

```typescript
// Модель в БД
interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
}

// DTO для регистрации - только нужные поля
interface RegisterDto {
  name: string
  email: string
  password: string  // Открытый пароль
}
```

**Зачем**:
- Безопасность (не передаём лишнее)
- Валидация (только нужные поля)
- Ясность (понятно что требуется)

---

## 🔄 Promise

**Что это**: Обещание получить результат в будущем

```typescript
// Функция возвращает Promise
async function getUser(id: string): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) return null
  return await response.json()
}

// Использование
const user = await getUser('123')
```

**Когда использовать**: Всегда для async операций (API, БД)

---

## ⚙️ Методы в интерфейсе

**Что это**: Описание действий которые умеет делать объект

```typescript
// Интерфейс сервиса
interface IUserService {
  findById(id: string): Promise<User | null>
  create(dto: RegisterDto): Promise<User>
  delete(id: string): Promise<void>
}

// Реализация
class UserService implements IUserService {
  async findById(id: string): Promise<User | null> {
    // НАСТОЯЩИЙ код
    return await fetch(`/api/users/${id}`).then(r => r.json())
  }
  
  async create(dto: RegisterDto): Promise<User> {
    // НАСТОЯЩИЙ код
    return await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(dto)
    }).then(r => r.json())
  }
  
  async delete(id: string): Promise<void> {
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
  }
}
```

**Зачем методы в интерфейсе**:
- Контракт - что должен уметь класс
- Dependency Inversion (D в SOLID)
- Легко менять реализацию

---

## 📤 export

**Что это**: Делает тип/интерфейс доступным в других файлах

```typescript
// types/user.interface.ts
export interface User { ... }
export type UserStatus = '...'

// components/UserCard.vue
import { User, UserStatus } from '@/types/user.interface'
```

**Правило**: Всегда export всё что может понадобиться снаружи

---

## 🔧 Utility Types

### Partial<T>

**Что это**: Делает все поля необязательными

```typescript
interface User {
  id: string
  name: string
  email: string
}

// Partial<User> = все поля optional
function update(id: string, data: Partial<User>) {
  // data может содержать любые поля User
}

update('1', { name: 'New Name' })  // ✅ Только name
update('1', { email: 'new@email' }) // ✅ Только email
```

---

## 🎨 Optional и Readonly

### Optional (необязательное поле)

```typescript
interface User {
  id: string
  name: string
  avatar?: string  // ← Необязательное
}

const user: User = {
  id: '1',
  name: 'John'
  // avatar можно не указывать
}
```

### Readonly (только для чтения)

```typescript
interface User {
  readonly id: string  // ← Нельзя изменить
  name: string
}

const user: User = { id: '1', name: 'John' }
user.name = 'Jane'  // ✅ OK
user.id = '2'       // ❌ Error
```

---

## 📊 Union Types

**Что это**: Либо один тип, либо другой

```typescript
// User или null
function find(id: string): User | null {
  // ...
}

// Несколько вариантов
type Status = 'online' | 'offline' | 'away'
```

---

## ⏳ async/await

**Что это**: Современный синтаксис для Promise

```typescript
// async функция возвращает Promise
async function getUser(id: string): Promise<User> {
  // await ждёт выполнения Promise
  const response = await fetch(`/api/users/${id}`)
  const user = await response.json()
  return user
}

// Использование
const user = await getUser('123')
```

**Правило**: Всегда используйте async/await (не .then)

---

## 🏗️ Архитектура: Интерфейс → Класс → Использование

```typescript
// 1. Описываем контракт (интерфейс)
interface IUserService {
  findById(id: string): Promise<User | null>
}

// 2. Реализуем (класс)
class UserService implements IUserService {
  async findById(id: string): Promise<User | null> {
    return await fetch(`/api/users/${id}`).then(r => r.json())
  }
}

// 3. Используем
const userService = new UserService()
const user = await userService.findById('123')
```

**Аналогия**:
- Интерфейс = Чертёж
- Класс = Строители по чертежу
- Использование = Прораб даёт команды

---

## ✅ Чек-лист при создании типов

- [ ] Интерфейс для данных (User, Message, Chat)
- [ ] Type для union/literal (Status, Role)
- [ ] DTO для API (RegisterDto, CreateMessageDto)
- [ ] Интерфейс сервиса (IUserService)
- [ ] export для всех типов
- [ ] readonly для ID
- [ ] optional (?) для необязательных полей
- [ ] Promise для async методов
- [ ] Правильные имена (camelCase)

---

## 🎯 Шпаргалка по синтаксису

```typescript
// Аннотация типа
const name: string = 'John'

// Interface
interface User {
  id: string
  name: string
}

// Type alias
type Status = 'active' | 'inactive'

// Optional
avatar?: string

// Readonly
readonly id: string

// Promise
Promise<User | null>

// Partial
Partial<User>

// Union
User | null

// Array
User[]
string[]

// async/await
async function get(): Promise<User> {
  return await fetch('...').then(r => r.json())
}

// export
export interface User { }
export type Status = '...'

// import
import { User, Status } from '@/types/user.interface'
```

---

## 💡 Когда что использовать?

| Что | Когда использовать |
|-----|-------------------|
| `interface` | Для объектов (User, Message) |
| `type` | Для union/literal типов |
| `readonly` | Для ID и неизменяемых полей |
| `?` optional | Для необязательных полей |
| `Promise` | Для async методов |
| `Partial<T>` | Для update (частичные данные) |
| `export` | Всегда для типов/интерфейсов |
| `async/await` | Всегда для async кода |

---

## 📚 Если забыли деталь - смотрите:

- **Подробная теория**: `Day_0_TypeScript_Basics.md`
- **Решения заданий**: `Day_0_Solutions.md`
- **Эта шпаргалка**: Быстрое напоминание

---

**Во время работы над проектом я буду напоминать эти концепции когда они понадобятся! 🚀**
