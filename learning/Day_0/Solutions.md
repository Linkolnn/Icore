# 📝 День 0: Решения заданий

> **Важно**: Сначала попробуйте решить самостоятельно, потом сверьте с этими решениями!

---

## ✅ Решение Задания 1: User interfaces

### frontend/types/user.interface.ts

```typescript
// ===================================
// 🎯 РЕШЕНИЕ: Интерфейсы для User
// ===================================

/**
 * Статус пользователя
 * 
 * Type alias для union type - ограничивает возможные значения
 */
export type UserStatus = 'online' | 'offline' | 'away' | 'dnd'

/**
 * Интерфейс пользователя
 */
export interface User {
  readonly id: string       // readonly - нельзя изменить после создания
  name: string
  email: string
  avatar?: string           // ? - необязательное поле
  status: UserStatus        // Используем созданный type
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO для регистрации нового пользователя
 * 
 * DTO (Data Transfer Object) - объект для передачи данных между слоями
 */
export interface RegisterDto {
  name: string
  email: string
  password: string          // Будет захеширован на сервере
}

/**
 * DTO для входа пользователя
 */
export interface LoginDto {
  email: string
  password: string
}

/**
 * Response после успешной авторизации
 * 
 * Сервер возвращает пользователя + JWT токен
 */
export interface AuthResponse {
  user: User                // Объект пользователя
  token: string             // JWT токен для авторизации
}
```

### Почему именно так?

**1. Type alias для UserStatus:**
```typescript
// ✅ Хорошо - переиспользуемый тип
type UserStatus = 'online' | 'offline' | 'away' | 'dnd'
status: UserStatus

// ❌ Плохо - дублирование
status: 'online' | 'offline' | 'away' | 'dnd'
```

**2. Readonly для id:**
```typescript
// ✅ Защита от изменения ID
readonly id: string

const user: User = { id: '1', ... }
user.id = '2'  // ❌ Error: Cannot assign to 'id' because it is a read-only property
```

**3. Optional для avatar:**
```typescript
// ✅ Не все пользователи имеют аватар
avatar?: string

// Можно создать без avatar
const user: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com',
  status: 'online',
  createdAt: new Date(),
  updatedAt: new Date()
  // avatar пропущен - это OK
}
```

**4. Отдельные DTO для разных операций:**
```typescript
// ✅ RegisterDto - только для регистрации
// ✅ LoginDto - только для входа
// ✅ Каждый DTO содержит только нужные поля

// ❌ Плохо - один интерфейс для всего:
interface AuthDto {
  name?: string
  email: string
  password: string
}
// Непонятно какие поля обязательны для какой операции
```

---

## ✅ Решение Задания 2: Message interfaces

### frontend/types/message.interface.ts

```typescript
// ===================================
// 🎯 РЕШЕНИЕ: Интерфейсы для Message
// ===================================

/**
 * Статус отправки сообщения
 * 
 * Жизненный цикл сообщения:
 * sending → sent → delivered → read
 *        ↓
 *      failed (если ошибка)
 */
export type MessageStatus = 
  | 'sending'    // Отправляется
  | 'sent'       // Отправлено на сервер
  | 'delivered'  // Доставлено получателю
  | 'read'       // Прочитано
  | 'failed'     // Ошибка

/**
 * Интерфейс сообщения
 */
export interface Message {
  readonly id: string        // Уникальный ID сообщения
  readonly chatId: string    // ID чата (сообщение не может "переехать")
  readonly senderId: string  // ID отправителя (автор не меняется)
  content: string            // Текст сообщения (можно редактировать)
  status: MessageStatus      // Статус отправки
  attachments?: string[]     // Ссылки на файлы (необязательно)
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO для создания нового сообщения
 * 
 * Примечание: senderId устанавливается из токена пользователя
 * Примечание: status устанавливается автоматически ('sending')
 */
export interface CreateMessageDto {
  chatId: string
  content: string
  attachments?: string[]
}

/**
 * DTO для обновления сообщения (редактирование)
 * 
 * Можно редактировать только текст сообщения
 */
export interface UpdateMessageDto {
  content: string
}
```

### Почему именно так?

**1. Readonly для chatId и senderId:**
```typescript
// Сообщение не может:
// - "переехать" в другой чат → readonly chatId
// - сменить автора → readonly senderId

readonly chatId: string
readonly senderId: string
```

**2. Content не readonly:**
```typescript
// Пользователь может редактировать текст сообщения
content: string  // НЕ readonly
```

**3. Attachments как массив строк:**
```typescript
// Храним URL или file paths
attachments?: string[]

// Пример:
const message: Message = {
  ...
  attachments: [
    'https://cdn.example.com/file1.pdf',
    'https://cdn.example.com/image.jpg'
  ]
}
```

**4. CreateMessageDto не содержит все поля:**
```typescript
// ✅ Минимальный DTO - только то что передает клиент
interface CreateMessageDto {
  chatId: string
  content: string
  attachments?: string[]
}

// ❌ Плохо - избыточные поля
interface CreateMessageDto {
  id: string              // Генерируется на сервере!
  senderId: string        // Берется из токена!
  status: MessageStatus   // Устанавливается автоматически!
  chatId: string
  content: string
}
```

---

## ✅ Решение Задания 3: UserService interface

### frontend/services/user.service.interface.ts

```typescript
// ===================================
// 🎯 РЕШЕНИЕ: Интерфейс UserService
// ===================================

import { User, RegisterDto, LoginDto, AuthResponse } from '@/types/user.interface'

/**
 * Интерфейс сервиса для работы с пользователями
 * 
 * Паттерн: Service Layer + Interface (для Dependency Inversion)
 * 
 * Преимущества:
 * 1. Зависимость от абстракции (интерфейса), а не от реализации
 * 2. Легко создавать mock для тестов
 * 3. Можно менять реализацию без изменения кода клиентов
 */
export interface IUserService {
  /**
   * Найти пользователя по ID
   * 
   * @param id - ID пользователя
   * @returns User или null если не найден
   */
  findById(id: string): Promise<User | null>
  
  /**
   * Найти пользователя по email
   * 
   * @param email - Email пользователя
   * @returns User или null если не найден
   */
  findByEmail(email: string): Promise<User | null>
  
  /**
   * Создать нового пользователя (регистрация)
   * 
   * @param dto - Данные для регистрации
   * @returns Созданный пользователь
   */
  create(dto: RegisterDto): Promise<User>
  
  /**
   * Обновить данные пользователя
   * 
   * @param id - ID пользователя
   * @param data - Частичные данные для обновления
   * @returns Обновленный пользователь
   */
  update(id: string, data: Partial<User>): Promise<User>
  
  /**
   * Удалить пользователя
   * 
   * @param id - ID пользователя
   */
  delete(id: string): Promise<void>
  
  /**
   * Вход пользователя
   * 
   * @param dto - Данные для входа
   * @returns Пользователь и токен
   */
  login(dto: LoginDto): Promise<AuthResponse>
}
```

### Почему именно так?

**1. Интерфейс, а не класс:**
```typescript
// ✅ Зависимость от абстракции (D в SOLID)
interface IUserService { ... }

// Любая реализация, которая follows интерфейс
class ApiUserService implements IUserService { }
class MockUserService implements IUserService { }
class LocalStorageUserService implements IUserService { }

// Можно подставить любую:
const service: IUserService = new ApiUserService()
// или
const service: IUserService = new MockUserService()
```

**2. Promise для async операций:**
```typescript
// Все операции с API асинхронные
findById(id: string): Promise<User | null>

// Использование:
const user = await userService.findById('123')
```

**3. User | null для методов поиска:**
```typescript
// Пользователь может не существовать
findById(id: string): Promise<User | null>

// Использование:
const user = await userService.findById('123')
if (user) {
  console.log(user.name)
} else {
  console.log('User not found')
}
```

**4. Partial<User> для update:**
```typescript
// Позволяет обновить только нужные поля
update(id: string, data: Partial<User>): Promise<User>

// Использование:
await userService.update('123', { name: 'New Name' })
// Обновили только name, остальные поля не тронули

// Partial<User> превращает:
// interface User {
//   id: string
//   name: string
//   email: string
// }
// В:
// interface Partial<User> {
//   id?: string
//   name?: string
//   email?: string
// }
```

**5. Promise<void> для delete:**
```typescript
// Метод ничего не возвращает
delete(id: string): Promise<void>

// Использование:
await userService.delete('123')
// Просто удалили, ничего не вернули
```

---

## 🎯 Использование созданных типов

### Пример: Реализация UserService

```typescript
// services/user.service.ts
import { IUserService } from './user.service.interface'
import { User, RegisterDto, LoginDto, AuthResponse } from '@/types/user.interface'

/**
 * Реализация сервиса через API
 */
export class UserService implements IUserService {
  private apiUrl = '/api/users'
  
  async findById(id: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.apiUrl}/${id}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }
  
  async findByEmail(email: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.apiUrl}?email=${email}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }
  
  async create(dto: RegisterDto): Promise<User> {
    const response = await fetch(`${this.apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create user')
    }
    
    return await response.json()
  }
  
  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update user')
    }
    
    return await response.json()
  }
  
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete user')
    }
  }
  
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    })
    
    if (!response.ok) {
      throw new Error('Login failed')
    }
    
    return await response.json()
  }
}
```

### Пример: Mock для тестов

```typescript
// services/user.service.mock.ts
import { IUserService } from './user.service.interface'
import { User, RegisterDto, LoginDto, AuthResponse } from '@/types/user.interface'

/**
 * Mock реализация для тестов
 */
export class MockUserService implements IUserService {
  private users: User[] = [
    {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) ?? null
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) ?? null
  }
  
  async create(dto: RegisterDto): Promise<User> {
    const user: User = {
      id: String(this.users.length + 1),
      name: dto.name,
      email: dto.email,
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.users.push(user)
    return user
  }
  
  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id)
    if (!user) throw new Error('User not found')
    Object.assign(user, data, { updatedAt: new Date() })
    return user
  }
  
  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id)
  }
  
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.findByEmail(dto.email)
    if (!user) throw new Error('User not found')
    
    return {
      user,
      token: 'mock_jwt_token'
    }
  }
}
```

---

## 💡 Ключевые выводы

### 1. Type Safety (Безопасность типов)

```typescript
// ✅ TypeScript не даст передать неправильный тип
const dto: RegisterDto = {
  name: 'John',
  email: 'john@example.com',
  password: 123  // ❌ Error: Type 'number' is not assignable to type 'string'
}
```

### 2. Автодополнение (Intellisense)

```typescript
// IDE знает все поля и методы
const user: User = { ... }
user.  // ← IDE покажет: id, name, email, avatar, status, createdAt, updatedAt
```

### 3. Рефакторинг

```typescript
// Переименовали email → emailAddress в interface User
// TypeScript покажет ошибки во всех местах где используется email
// Можно безопасно переименовать везде
```

### 4. Документация

```typescript
// Типы = встроенная документация
function createUser(dto: RegisterDto): Promise<User>
// Ясно что принимает и что возвращает
```

### 5. Масштабируемость

```typescript
// Можно менять реализацию без изменения интерфейса
const service: IUserService = 
  isDevelopment 
    ? new MockUserService()  // В разработке - mock
    : new ApiUserService()   // В production - реальный API
```

---

## 📖 Дальнейшие шаги

Теперь вы знаете основы TypeScript! Следующие темы:

1. **Generics** - обобщенные типы
2. **Utility Types** - встроенные типы-помощники
3. **Decorators** - для NestJS
4. **Advanced Types** - mapped types, conditional types

**Готовы двигаться дальше? 🚀**
