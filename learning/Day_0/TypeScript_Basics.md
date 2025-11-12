# 📘 День 0: TypeScript - Основы и Best Practices

> **Официальная документация**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

## 🎯 Цель дня

Изучить основы TypeScript, необходимые для разработки масштабируемого приложения:
- Типы данных и type safety
- Interfaces и Types
- Generics и utility types
- Best practices для enterprise разработки

**Время**: 4-6 часов

---

## 📚 Часть 1: Что такое TypeScript?

### Термин: TypeScript

**Определение** (из официальной документации):
> TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

**Простыми словами**:
TypeScript = JavaScript + система типов. Это надстройка над JS, которая проверяет типы **до запуска кода**.

### Зачем нужен TypeScript?

**Проблема с JavaScript**:
```javascript
// JavaScript - ошибка только в runtime (когда код запустится)
function greet(name) {
  return `Hello, ${name.toUpperCase()}`
}

greet(123) // ❌ Runtime error: name.toUpperCase is not a function
```

**Решение с TypeScript**:
```typescript
// TypeScript - ошибка сразу при написании
function greet(name: string): string {
  return `Hello, ${name.toUpperCase()}`
}

greet(123) // ❌ Compile error: Argument of type 'number' is not assignable to parameter of type 'string'
```

### Преимущества для масштабируемости:

1. **Раннее обнаружение ошибок** - IDE подсвечивает проблемы сразу
2. **Автодополнение** - IDE знает все методы и свойства
3. **Рефакторинг** - безопасное переименование и изменение структуры
4. **Документация** - типы = встроенная документация кода

---

## 📚 Часть 2: Базовые типы данных

> **Документация**: [Basic Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

### Термин: Type Annotation (Аннотация типов)

**Определение**:
Явное указание типа переменной, параметра или возвращаемого значения.

**Синтаксис**:
```typescript
let variableName: type = value
```

### Примитивные типы:

```typescript
// === String (строка) ===
let username: string = 'John'
let email: string = "user@example.com"
let template: string = `Hello, ${username}`

// === Number (число) ===
let age: number = 25
let price: number = 99.99
let hex: number = 0xf00d
let binary: number = 0b1010

// === Boolean (логический) ===
let isActive: boolean = true
let hasAccess: boolean = false

// === Null и Undefined ===
let nothing: null = null
let notDefined: undefined = undefined

// === Any (любой тип) - ИЗБЕГАЙТЕ! ===
let anything: any = 'string'
anything = 123 // OK, но теряем type safety
anything = true // OK, но это плохая практика
```

### ⚠️ Best Practice: Избегайте `any`

**Почему `any` плохо**:
```typescript
// ❌ Плохо - теряем все преимущества TypeScript
function process(data: any) {
  return data.toUpperCase() // Нет проверки, может упасть в runtime
}

// ✅ Хорошо - явно указываем тип
function process(data: string): string {
  return data.toUpperCase() // TypeScript проверяет что data это string
}
```

### Применение в проекте:

```typescript
// ❌ Без типов (как в JavaScript)
function createUser(name, email, age) {
  return {
    id: Math.random().toString(),
    name: name,
    email: email,
    age: age,
    createdAt: new Date()
  }
}

// ✅ С типами (TypeScript best practice)
function createUser(
  name: string,
  email: string,
  age: number
): { id: string; name: string; email: string; age: number; createdAt: Date } {
  return {
    id: Math.random().toString(),
    name,
    email,
    age,
    createdAt: new Date()
  }
}
```

---

## 📚 Часть 3: Interface (Интерфейс)

> **Документация**: [Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)

### Термин: Interface

**Определение** (из официальной документации):
> An interface declaration is another way to name an object type.

**Простыми словами**:
Interface — это **контракт**, описывающий структуру объекта. Он говорит "объект должен иметь эти свойства с этими типами".

### Синтаксис:

```typescript
interface InterfaceName {
  propertyName: type
  methodName(): returnType
}
```

### Базовый пример:

```typescript
// === Определяем интерфейс ===
interface User {
  id: string
  name: string
  email: string
  age: number
  isActive: boolean
}

// === Используем интерфейс ===
const user: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  isActive: true
}

// ❌ Ошибка - не хватает полей
const invalidUser: User = {
  id: '2',
  name: 'Jane'
  // TypeScript error: Property 'email' is missing
}

// ❌ Ошибка - неправильный тип
const wrongType: User = {
  id: '3',
  name: 'Bob',
  email: 'bob@example.com',
  age: '25', // ❌ Error: Type 'string' is not assignable to type 'number'
  isActive: true
}
```

### Optional Properties (Необязательные свойства):

```typescript
interface User {
  id: string
  name: string
  email: string
  age?: number        // ? = необязательное поле
  avatar?: string     // ? = может быть undefined
  bio?: string
}

// ✅ OK - необязательные поля можно пропустить
const user: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com'
  // age, avatar, bio не указаны - это OK
}
```

### Readonly Properties (Только для чтения):

```typescript
interface User {
  readonly id: string      // Нельзя изменить после создания
  name: string
  email: string
}

const user: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com'
}

user.name = 'Jane'  // ✅ OK
user.id = '2'       // ❌ Error: Cannot assign to 'id' because it is a read-only property
```

### Methods (Методы):

```typescript
interface UserService {
  // Метод без параметров
  getUsers(): User[]
  
  // Метод с параметрами
  getUserById(id: string): User | null
  
  // Метод с несколькими параметрами
  createUser(name: string, email: string): User
  
  // Async метод
  deleteUser(id: string): Promise<void>
}
```

### Применение в проекте (Best Practice):

```typescript
// === 1. Определяем интерфейсы для Domain моделей ===

// types/user.interface.ts
export interface User {
  readonly id: string
  name: string
  email: string
  passwordHash: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// types/message.interface.ts
export interface Message {
  readonly id: string
  readonly chatId: string
  readonly senderId: string
  content: string
  attachments?: string[]
  createdAt: Date
  isRead: boolean
}

// types/chat.interface.ts
export interface Chat {
  readonly id: string
  name: string
  members: string[]  // User IDs
  lastMessage?: Message
  createdAt: Date
  updatedAt: Date
}

// === 2. Интерфейсы для DTO (Data Transfer Objects) ===

// dto/register.dto.ts
export interface RegisterDto {
  name: string
  email: string
  password: string
}

// dto/login.dto.ts
export interface LoginDto {
  email: string
  password: string
}

// dto/create-message.dto.ts
export interface CreateMessageDto {
  chatId: string
  content: string
  attachments?: string[]
}

// === 3. Интерфейсы для сервисов (контракты) ===

// services/user.service.interface.ts
export interface IUserService {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(dto: RegisterDto): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
  delete(id: string): Promise<void>
}

// === 4. Использование в коде ===

// user.service.ts
import { IUserService } from './user.service.interface'
import { User, RegisterDto } from '@/types'

export class UserService implements IUserService {
  async findById(id: string): Promise<User | null> {
    // Реализация...
  }
  
  async create(dto: RegisterDto): Promise<User> {
    // TypeScript проверяет что dto содержит name, email, password
    const user: User = {
      id: generateId(),
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    return user
  }
}
```

### Почему это Best Practice для масштабируемости:

**1. Контракт между модулями**:
```typescript
// Другие части приложения зависят от интерфейса, а не от реализации
function getUser(service: IUserService, id: string) {
  return service.findById(id) // Работает с любой реализацией IUserService
}
```

**2. Легко тестировать**:
```typescript
// Можем создать mock для тестов
class MockUserService implements IUserService {
  async findById(id: string): Promise<User | null> {
    return { id, name: 'Test User', email: 'test@test.com', ... }
  }
}
```

**3. Легко менять реализацию**:
```typescript
// Можно заменить реализацию без изменения кода, который использует сервис
class ApiUserService implements IUserService { }
class DatabaseUserService implements IUserService { }
class CachedUserService implements IUserService { }
```

---

## 📚 Часть 4: Type Alias (Псевдоним типа)

> **Документация**: [Type Aliases](https://www.typesceetlang.org/docs/handbook/2/everyday-types.html#type-aliases)

### Термин: Type Alias

**Определение**:
Type alias — это способ дать имя любому типу (не только объектам).

**Синтаксис**:
```typescript
type TypeName = type
```

### Примеры:

```typescript
// === Псевдоним для примитива ===
type ID = string
type Age = number
type Email = string

const userId: ID = 'user_123'
const userAge: Age = 25

// === Псевдоним для объекта (как interface) ===
type User = {
  id: ID
  name: string
  email: Email
  age: Age
}

// === Union Types (Объединение типов) ===
type Status = 'pending' | 'active' | 'blocked' | 'deleted'
type Role = 'user' | 'admin' | 'moderator'

const userStatus: Status = 'active'  // ✅ OK
const userStatus2: Status = 'unknown' // ❌ Error: Type '"unknown"' is not assignable to type 'Status'

// === Literal Types ===
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Port = 3000 | 8080 | 8000

function request(method: HttpMethod, url: string) {
  // TypeScript знает что method может быть только эти значения
}

request('GET', '/api/users')  // ✅ OK
request('PATCH', '/api/users') // ❌ Error

// === Intersection Types (Пересечение типов) ===
type Timestamps = {
  createdAt: Date
  updatedAt: Date
}

type User = {
  id: string
  name: string
  email: string
} & Timestamps  // Комбинируем типы

const user: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Interface vs Type: Когда что использовать?

**Официальная рекомендация**: Используйте `interface` пока не нужна специфичная возможность `type`.

**Interface** (предпочтительно для объектов):
```typescript
// ✅ Используйте для описания структуры объектов
interface User {
  id: string
  name: string
}

// ✅ Можно расширять (extends)
interface Admin extends User {
  permissions: string[]
}

// ✅ Можно переоткрывать (declaration merging)
interface User {
  avatar?: string  // Добавляет поле к существующему интерфейсу
}
```

**Type** (для всего остального):
```typescript
// ✅ Union types
type Status = 'active' | 'inactive'

// ✅ Intersection types
type UserWithTimestamps = User & Timestamps

// ✅ Mapped types
type ReadonlyUser = {
  readonly [K in keyof User]: User[K]
}

// ✅ Conditional types
type IsString<T> = T extends string ? true : false

// ✅ Tuple types
type Coordinates = [number, number]
```

### Применение в проекте:

```typescript
// === types/common.types.ts ===

// ID типы для type safety
export type UserId = string
export type ChatId = string
export type MessageId = string

// Статусы
export type UserStatus = 'online' | 'offline' | 'away' | 'dnd'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type ChatType = 'private' | 'group' | 'channel'

// Timestamps для переиспользования
export type Timestamps = {
  createdAt: Date
  updatedAt: Date
}

// Soft Delete
export type SoftDeletable = {
  deletedAt?: Date
}

// === types/user.types.ts ===
export interface User extends Timestamps {
  id: UserId
  name: string
  email: string
  status: UserStatus
  avatar?: string
}

// === types/message.types.ts ===
export interface Message extends Timestamps {
  id: MessageId
  chatId: ChatId
  senderId: UserId
  content: string
  status: MessageStatus
  attachments?: string[]
}

// === Почему это хорошо для масштабируемости: ===

// 1. Type safety - нельзя перепутать ID разных сущностей
function getMessage(userId: UserId, chatId: ChatId) {
  // TypeScript проверит что вы не перепутали параметры
}

getMessage(chatId, userId) // ❌ Error: типы не совпадают

// 2. DRY - переиспользуем общие типы
interface Chat extends Timestamps, SoftDeletable {
  id: ChatId
  type: ChatType
  members: UserId[]
}

// 3. Легко менять - изменили UserStatus в одном месте, применилось везде
```

---

## 📚 Часть 5: Arrays и Tuples

> **Документация**: [Arrays](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)

### Термин: Array Type

**Определение**:
Типизированный массив - массив элементов одного типа.

### Синтаксис:

```typescript
// Способ 1 (предпочтительный)
let numbers: number[] = [1, 2, 3, 4, 5]
let names: string[] = ['John', 'Jane', 'Bob']

// Способ 2 (generic синтаксис)
let numbers: Array<number> = [1, 2, 3]
let names: Array<string> = ['John', 'Jane']
```

### Примеры:

```typescript
// === Массив объектов ===
interface User {
  id: string
  name: string
}

const users: User[] = [
  { id: '1', name: 'John' },
  { id: '2', name: 'Jane' }
]

// === Массив union types ===
type Status = 'active' | 'inactive'
const statuses: Status[] = ['active', 'inactive', 'active']

// === Readonly массив (immutable) ===
const numbers: readonly number[] = [1, 2, 3]
numbers.push(4) // ❌ Error: Property 'push' does not exist on type 'readonly number[]'
```

### Термин: Tuple (Кортеж)

**Определение**:
Tuple - массив фиксированной длины с типами для каждого элемента.

```typescript
// === Tuple - фиксированная длина и типы ===
type Coordinates = [number, number]
const point: Coordinates = [10, 20]  // ✅ OK
const point2: Coordinates = [10]     // ❌ Error: не хватает элемента
const point3: Coordinates = [10, 20, 30] // ❌ Error: слишком много элементов

// === Named Tuples (с именами полей) ===
type Range = [start: number, end: number]
const range: Range = [0, 100]

// === Optional elements ===
type User = [id: string, name: string, email?: string]
const user1: User = ['1', 'John']                // ✅ OK
const user2: User = ['2', 'Jane', 'jane@email.com'] // ✅ OK
```

### Применение в проекте:

```typescript
// === types/api.types.ts ===

// Tuple для пагинации [данные, общее количество]
export type PaginatedResponse<T> = [data: T[], total: number]

// Tuple для координат
export type Coordinates = [latitude: number, longitude: number]

// Tuple для диапазона дат
export type DateRange = [startDate: Date, endDate: Date]

// === Использование ===

// Пагинированный список пользователей
async function getUsers(page: number): Promise<PaginatedResponse<User>> {
  const data: User[] = await fetchUsers(page)
  const total: number = await countUsers()
  return [data, total]
}

// Использование
const [users, totalUsers] = await getUsers(1)
console.log(`Показано ${users.length} из ${totalUsers}`)

// Геолокация
interface Location {
  name: string
  coordinates: Coordinates
}

const office: Location = {
  name: 'Main Office',
  coordinates: [55.7558, 37.6173] // Москва
}
```

---

## 📚 Часть 6: Functions (Функции)

> **Документация**: [Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)

### Типизация функций:

```typescript
// === Типизация параметров и возвращаемого значения ===

// Способ 1: inline типизация
function greet(name: string): string {
  return `Hello, ${name}`
}

// Способ 2: arrow function
const greet = (name: string): string => {
  return `Hello, ${name}`
}

// Способ 3: короткая arrow function
const greet = (name: string): string => `Hello, ${name}`

// === Void - функция ничего не возвращает ===
function logMessage(message: string): void {
  console.log(message)
  // не возвращает значение
}

// === Never - функция никогда не завершается ===
function throwError(message: string): never {
  throw new Error(message)
  // никогда не дойдет до конца
}

function infiniteLoop(): never {
  while (true) {
    // бесконечный цикл
  }
}
```

### Optional и Default параметры:

```typescript
// === Optional parameters (необязательные) ===
function greet(name: string, greeting?: string): string {
  if (greeting) {
    return `${greeting}, ${name}`
  }
  return `Hello, ${name}`
}

greet('John')              // ✅ OK: "Hello, John"
greet('John', 'Hi')        // ✅ OK: "Hi, John"

// === Default parameters (значения по умолчанию) ===
function greet(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}`
}

greet('John')              // "Hello, John"
greet('John', 'Hi')        // "Hi, John"

// === Rest parameters ===
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0)
}

sum(1, 2, 3)        // 6
sum(1, 2, 3, 4, 5)  // 15
```

### Function Types (Типы функций):

```typescript
// === Определение типа функции ===
type GreetFunction = (name: string) => string
type CalculateFunction = (a: number, b: number) => number

// === Использование ===
const greet: GreetFunction = (name) => `Hello, ${name}`
const add: CalculateFunction = (a, b) => a + b

// === Callback функции ===
function processUser(
  userId: string,
  callback: (user: User) => void
): void {
  const user = getUser(userId)
  callback(user)
}

processUser('123', (user) => {
  console.log(user.name) // TypeScript знает что user это User
})

// === Async функции ===
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const user: User = await response.json()
  return user
}

// Promise<T> - функция возвращает Promise с типом T
```

### Применение в проекте:

```typescript
// === types/functions.types.ts ===

// Callback типы
export type ErrorHandler = (error: Error) => void
export type SuccessHandler<T> = (data: T) => void
export type Validator<T> = (value: T) => boolean | string

// Filter/Transform функции
export type FilterFunction<T> = (item: T) => boolean
export type MapFunction<T, R> = (item: T) => R
export type ReduceFunction<T, R> = (acc: R, item: T) => R

// Event handlers
export type EventHandler<T = void> = (event: T) => void
export type ClickHandler = EventHandler<MouseEvent>
export type SubmitHandler = EventHandler<FormEvent>

// === services/user.service.ts ===

class UserService {
  // Четкая типизация входа и выхода
  async findById(id: UserId): Promise<User | null> {
    // Реализация
  }
  
  async create(dto: RegisterDto): Promise<User> {
    // Реализация
  }
  
  async updateMany(
    filter: FilterFunction<User>,
    update: Partial<User>
  ): Promise<User[]> {
    const users = await this.findAll()
    const filtered = users.filter(filter)
    return Promise.all(
      filtered.map(user => this.update(user.id, update))
    )
  }
}

// === Использование ===

// TypeScript проверит типы
const activeUsers = await userService.updateMany(
  (user) => user.status === 'active', // FilterFunction<User>
  { lastSeen: new Date() }            // Partial<User>
)
```

### Почему это важно для масштабируемости:

```typescript
// ❌ Без типов - легко ошибиться
function processData(callback) {
  callback(undefined) // Что передать? Неясно!
}

// ✅ С типами - понятно и безопасно
type DataProcessor = (data: User[], total: number) => void

function processData(callback: DataProcessor) {
  callback(users, totalCount) // TypeScript проверит параметры
}
```

---

## 🎯 Практическое задание

Теперь ваша очередь! Создайте типы для нашего мессенджера:

### Задание 1: Создайте базовые интерфейсы

```typescript
// Создайте файл: frontend/types/user.interface.ts

// TODO: Создайте interface User со следующими полями:
// - id (string, readonly)
// - name (string)
// - email (string)
// - avatar (string, необязательно)
// - status ('online' | 'offline' | 'away' | 'dnd')
// - createdAt (Date)
// - updatedAt (Date)

// TODO: Создайте interface для RegisterDto
// TODO: Создайте interface для LoginDto
```

### Задание 2: Создайте типы для сообщений

```typescript
// Создайте файл: frontend/types/message.interface.ts

// TODO: Создайте interface Message
// TODO: Создайте type для статуса сообщения
// TODO: Создайте interface для CreateMessageDto
```

### Задание 3: Создайте интерфейс сервиса

```typescript
// Создайте файл: frontend/services/user.service.interface.ts

// TODO: Создайте interface IUserService с методами:
// - findById(id: string): Promise<User | null>
// - findByEmail(email: string): Promise<User | null>
// - create(dto: RegisterDto): Promise<User>
// - update(id: string, data: Partial<User>): Promise<User>
```

---

## 📖 Что дальше?

После выполнения заданий напишите мне:
1. Какие типы вы создали
2. Возникли ли вопросы
3. Готовы ли двигаться дальше

Следующая часть: **Generics и Utility Types** - более продвинутые возможности TypeScript.

---

## 📚 Полезные ссылки:

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Cheat Sheet](https://www.typescriptlang.org/cheatsheets)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [TypeScript Official Playground](https://www.typescriptlang.org/play)

---

**Время попрактиковаться! Создайте эти типы и покажите мне результат. 🚀**
