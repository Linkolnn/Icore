# 📘 День 1: Backend Authentication - Теория и Концепции

> **Официальная документация**:
> - [NestJS](https://docs.nestjs.com)
> - [Mongoose](https://mongoosejs.com/docs/guide.html)
> - [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)

---

## 🎯 Цель дня

Реализовать **backend часть авторизации** с использованием:
- MongoDB для хранения пользователей
- bcrypt для безопасного хранения паролей
- JWT для аутентификации
- Паттерны: Repository, Service Layer, DTO, Guards

**Время**: 6-8 часов

---

## 📚 Часть 1: MongoDB и Mongoose

### Термин: MongoDB

**Определение** (из [официальной документации](https://www.mongodb.com/what-is-mongodb)):
> MongoDB is a document database designed for ease of development and scaling.

**Простыми словами**:
MongoDB = NoSQL база данных, которая хранит данные в виде **документов** (похожих на JSON).

### Отличие от SQL баз:

**SQL (PostgreSQL, MySQL)**:
```sql
-- Таблица с жёсткой структурой
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);
```

**MongoDB (NoSQL)**:
```javascript
// Документ - гибкая структура
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John",
  "email": "john@example.com",
  "avatar": "url..."  // Можно добавлять новые поля
}
```

### Термин: Mongoose

**Определение** (из [официальной документации](https://mongoosejs.com)):
> Mongoose provides a straight-forward, schema-based solution to model your application data.

**Простыми словами**:
Mongoose = библиотека для работы с MongoDB в Node.js. Добавляет **схемы** и **валидацию**.

### Зачем нужен Mongoose?

**Проблема с нативным драйвером MongoDB**:
```javascript
// Нет проверки типов
await db.collection('users').insertOne({
  name: 123,  // ← Ошибка! Должна быть строка
  email: true // ← Ошибка! Должна быть строка
})
// Вставится без ошибок!
```

**Решение с Mongoose**:
```typescript
// Схема определяет структуру
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }
})

// Mongoose проверит типы
await User.create({
  name: 123,  // ← Ошибка! Mongoose не даст вставить
  email: true
})
```

---

## 📚 Часть 2: Schema (Схема в Mongoose)

### Термин: Schema

**Определение** (из [Mongoose docs](https://mongoosejs.com/docs/guide.html)):
> Everything in Mongoose starts with a Schema. Each schema maps to a MongoDB collection and defines the shape of the documents within that collection.

**Простыми словами**:
Schema = чертёж документа. Описывает какие поля, какие типы, какие правила.

### Пример Schema:

```typescript
import { Schema } from 'mongoose'

const UserSchema = new Schema({
  // Поле name - обязательное, тип String
  name: {
    type: String,
    required: true
  },
  
  // Поле email - обязательное, уникальное
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  // Поле avatar - необязательное
  avatar: {
    type: String,
    required: false
  },
  
  // Автоматические поля createdAt, updatedAt
  timestamps: true
})
```

### Схема vs TypeScript Interface

**Вспомните из Day 0**:
```typescript
// TypeScript Interface - для TypeScript
interface User {
  id: string
  name: string
  email: string
}

// Mongoose Schema - для MongoDB
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }
})
```

**Почему нужны оба?**
- **Interface** - проверка типов на этапе разработки (компиляция)
- **Schema** - проверка данных в runtime (когда код работает)

---

## 📚 Часть 3: Decorator в NestJS

### Термин: Decorator (Декоратор)

**Определение** (из [TypeScript docs](https://www.typescriptlang.org/docs/handbook/decorators.html)):
> A Decorator is a special kind of declaration that can be attached to a class, method, property, or parameter.

**Простыми словами**:
Decorator = специальная функция с `@` которая **добавляет поведение** к классу, методу или свойству.

### Синтаксис:

```typescript
@DecoratorName
class MyClass { }

@DecoratorName()
method() { }

@DecoratorName
property: string
```

### Decorators в NestJS:

**Основные декораторы для Mongoose**:

```typescript
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'

@Schema({ timestamps: true })  // ← Декоратор класса
export class User {
  
  @Prop({ required: true })    // ← Декоратор свойства
  name: string
  
  @Prop({ required: true, unique: true })
  email: string
}

// Создаём Schema из класса
export const UserSchema = SchemaFactory.createForClass(User)
```

**Что делают декораторы?**
- `@Schema()` - помечает класс как Mongoose схему
- `@Prop()` - определяет свойство схемы с опциями
- `SchemaFactory.createForClass()` - создаёт Mongoose Schema из класса

### Зачем декораторы?

**Без декораторов** (старый способ):
```typescript
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
})
```

**С декораторами** (NestJS + TypeScript):
```typescript
@Schema()
class User {
  @Prop({ required: true })
  name: string
  
  @Prop({ required: true, unique: true })
  email: string
}
// + получаем типизацию TypeScript!
```

---

## 📚 Часть 4: DTO и Валидация

### Термин: class-validator

**Определение** (из [GitHub](https://github.com/typestack/class-validator)):
> Decorator-based validation for TypeScript and JavaScript classes.

**Простыми словами**:
class-validator = библиотека для **проверки данных** с помощью декораторов.

### Зачем нужна валидация?

**Проблема - пользователь отправляет плохие данные**:
```typescript
// POST /api/auth/register
{
  "name": "",           // ← Пустое имя!
  "email": "notanemail", // ← Не email!
  "password": "123"     // ← Короткий пароль!
}
```

**Решение - class-validator проверяет**:
```typescript
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString()
  name: string
  
  @IsEmail({}, { message: 'Invalid email format' })
  email: string
  
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string
}
```

### Основные декораторы валидации:

```typescript
// Проверка типа
@IsString()       // Должна быть строка
@IsNumber()       // Должно быть число
@IsBoolean()      // Должно быть boolean

// Проверка значения
@IsNotEmpty()     // Не пустое
@IsEmail()        // Валидный email
@MinLength(6)     // Минимум 6 символов
@MaxLength(100)   // Максимум 100 символов

// Опциональное поле
@IsOptional()     // Поле необязательное
```

---

## 📚 Часть 5: Хеширование паролей с bcrypt

### Термин: Hash (Хеш)

**Определение**:
> Hash function - односторонняя функция, которая превращает данные в фиксированную строку. **Невозможно восстановить** исходные данные из хеша.

**Простыми словами**:
Хеширование = превращение пароля в "шифр" который **нельзя расшифровать**.

### Зачем хешировать пароли?

**❌ Плохо - хранить пароли открыто**:
```javascript
// В БД
{
  email: "user@example.com",
  password: "myPassword123"  // ← ОПАСНО!
}

// Если хакер получит доступ к БД → все пароли скомпрометированы!
```

**✅ Хорошо - хранить хеш**:
```javascript
// В БД
{
  email: "user@example.com",
  password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
  // ← Хеш пароля, нельзя восстановить!
}
```

### Термин: Salt (Соль)

**Определение** (из [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)):
> A salt is a unique, randomly generated string that is added to each password as part of the hashing process.

**Простыми словами**:
Salt = случайная строка которая добавляется к паролю перед хешированием.

**Зачем нужна соль?**

**Без соли** (уязвимо):
```javascript
// Два одинаковых пароля → одинаковые хеши
password1: "123456" → hash: "e10adc3949ba59abbe56e057f20f883e"
password2: "123456" → hash: "e10adc3949ba59abbe56e057f20f883e"
// Хакер понимает что пароли одинаковые!
```

**С солью** (безопасно):
```javascript
// Два одинаковых пароля → РАЗНЫЕ хеши
password1: "123456" + salt1 → hash: "$2b$10$N9qo8uLOickgx..."
password2: "123456" + salt2 → hash: "$2b$10$K3po9mNPjdlfy..."
// Хакер НЕ может понять что пароли одинаковые
```

### bcrypt автоматически добавляет соль!

```typescript
import * as bcrypt from 'bcrypt'

// Хеширование с автоматической солью
const saltRounds = 10  // Сложность (чем больше, тем медленнее и безопаснее)
const hash = await bcrypt.hash('myPassword123', saltRounds)
// Результат: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
// Соль встроена в хеш!

// Проверка пароля
const isMatch = await bcrypt.compare('myPassword123', hash)
// true - пароль совпадает
```

---

## 📚 Часть 6: JWT (JSON Web Token)

### Термин: JWT

**Определение** (из [JWT.io](https://jwt.io/introduction)):
> JSON Web Token (JWT) is an open standard that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.

**Простыми словами**:
JWT = токен который содержит информацию о пользователе и **подписан** сервером.

### Структура JWT:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
↑                                     ↑                                              ↑
Header (алгоритм)                     Payload (данные)                               Signature (подпись)
```

**Части JWT**:
1. **Header** - какой алгоритм шифрования
2. **Payload** - данные (userId, email, роль)
3. **Signature** - подпись (проверяет что токен не подделан)

### Как работает JWT авторизация:

```
1. Пользователь логинится
   POST /auth/login
   { email, password }

2. Сервер проверяет пароль
   ✅ Пароль верный

3. Сервер создаёт JWT
   const token = jwt.sign({ userId: '123' }, 'SECRET_KEY')

4. Сервер отправляет токен клиенту
   { token: "eyJhbGci..." }

5. Клиент сохраняет токен
   localStorage.setItem('token', token)

6. Клиент отправляет токен с каждым запросом
   GET /api/users/123
   Authorization: Bearer eyJhbGci...

7. Сервер проверяет токен
   const decoded = jwt.verify(token, 'SECRET_KEY')
   // { userId: '123' }

8. Сервер знает кто это
   const user = await User.findById(decoded.userId)
```

### Зачем JWT?

**Альтернатива 1: Session (сессии)**:
```
❌ Минусы:
- Нужно хранить сессии на сервере (память/БД)
- Не подходит для микросервисов
- Сложно масштабировать
```

**Альтернатива 2: JWT**:
```
✅ Плюсы:
- Stateless - сервер ничего не хранит
- Подходит для микросервисов
- Легко масштабировать
```

---

## 📚 Часть 7: Guards в NestJS

### Термин: Guard (Охранник)

**Определение** (из [NestJS docs](https://docs.nestjs.com/guards)):
> A guard is a class annotated with the @Injectable() decorator that determines whether a given request will be handled by the route handler or not.

**Простыми словами**:
Guard = "охранник" который проверяет **можно ли выполнить запрос**.

### Как работает Guard:

```
Запрос → Guard → Route Handler
         ↓
      Проверка JWT
         ↓
    Пользователь авторизован?
         ↓
       /   \
     Да     Нет
      ↓      ↓
   Пропустить  Отклонить (401 Unauthorized)
```

### Пример использования:

```typescript
// Защищённый endpoint
@Get('profile')
@UseGuards(JwtAuthGuard)  // ← Guard проверяет JWT
getProfile(@Request() req) {
  // req.user будет содержать данные из JWT
  return req.user
}

// Без авторизации → 401 Unauthorized
// С валидным токеном → данные пользователя
```

---

## 📚 Часть 8: Паттерны для масштабируемости

### Паттерн: Repository Pattern

**Что это**:
Слой который **инкапсулирует** работу с БД.

**Зачем**:
- Можно заменить БД без изменения бизнес-логики
- Легко тестировать (mock repository)
- Следует Single Responsibility Principle

**Структура**:
```
Controller → Service → Repository → Database
             ↑         ↑
          Бизнес-    Работа
          логика     с БД
```

### Паттерн: Service Layer

**Что это**:
Слой с бизнес-логикой приложения.

**Зачем**:
- Controller только принимает запросы
- Service выполняет логику
- Легко переиспользовать логику

### Паттерн: DTO (Data Transfer Object)

**Вспомните из Day 0**:
DTO = объект для передачи данных между слоями.

**Зачем**:
- Валидация входных данных
- Безопасность (не передаём лишние поля)
- Документация API

---

## 🎯 Архитектура Auth модуля

### Слои приложения:

```
┌─────────────────────────────────────────┐
│          Controller Layer               │
│  (Принимает HTTP запросы)               │
│  @Post('register')                       │
│  @Post('login')                          │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│           Service Layer                 │
│  (Бизнес-логика)                        │
│  register(dto) { ... }                   │
│  login(dto) { ... }                      │
│  validateUser(email, password) { ... }   │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│         Repository Layer                │
│  (Работа с БД)                          │
│  UserModel (Mongoose)                    │
│  findOne(), create(), update()           │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│            Database                     │
│           MongoDB                        │
└─────────────────────────────────────────┘
```

### Поток данных:

**Регистрация**:
```
1. POST /auth/register → AuthController
   Body: { name, email, password }

2. AuthController → AuthService.register(dto)

3. AuthService:
   - Проверяет что email не занят
   - Хеширует пароль (bcrypt)
   - Создаёт пользователя через UserModel
   - Генерирует JWT токен

4. Возвращает: { user, token }
```

**Вход**:
```
1. POST /auth/login → AuthController
   Body: { email, password }

2. AuthController → AuthService.login(dto)

3. AuthService:
   - Находит пользователя по email
   - Проверяет пароль (bcrypt.compare)
   - Генерирует JWT токен

4. Возвращает: { user, token }
```

**Защищённый запрос**:
```
1. GET /users/profile → UsersController
   Headers: Authorization: Bearer <token>

2. JwtAuthGuard:
   - Извлекает токен из заголовка
   - Проверяет подпись токена
   - Декодирует userId из токена

3. UsersController:
   - req.user содержит данные из токена
   - Возвращает данные пользователя
```

---

## ✅ Ключевые концепции для запоминания

### MongoDB:
- **NoSQL** база данных
- Хранит документы (похожие на JSON)
- **Mongoose** добавляет схемы и валидацию

### Schema:
- Чертёж документа в MongoDB
- Определяет поля, типы, правила
- Декоратор `@Schema()` в NestJS

### DTO:
- Валидация данных (class-validator)
- Декораторы: `@IsEmail()`, `@MinLength()`, `@IsNotEmpty()`

### bcrypt:
- Хеширование паролей
- Автоматическая соль
- `bcrypt.hash()` и `bcrypt.compare()`

### JWT:
- Токен для авторизации
- Header + Payload + Signature
- Stateless (сервер не хранит токены)

### Guard:
- Проверяет доступ к routes
- `@UseGuards(JwtAuthGuard)`
- Отклоняет неавторизованные запросы

---

## 📖 Что дальше?

После изучения теории переходите к **практическим заданиям**:
- `Day_1_Backend_Auth_Practice.md`

Там вы будете **самостоятельно** создавать:
1. User Schema (модель MongoDB)
2. DTO классы с валидацией
3. Auth Service с bcrypt и JWT
4. JWT стратегию и Guard
5. Auth Controller

**Подсказки будут, готовый код НЕТ!** 🚀

---

## 📚 Официальная документация (для справки):

- [NestJS Documentation](https://docs.nestjs.com)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [class-validator](https://github.com/typestack/class-validator)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [JWT.io](https://jwt.io)
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)

---

**Изучили теорию? Переходите к практике! 💪**
