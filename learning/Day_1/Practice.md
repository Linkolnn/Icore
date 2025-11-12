# 🛠️ День 1: Backend Authentication - Практические задания

> **Важно**: Это задания БЕЗ готового кода. Есть только подсказки и структура.
> Вы пишете код сами, я объясняю и помогаю!

---

## 🎯 Что будем создавать

### Backend Auth System:
1. ✅ Запуск через Docker Compose
2. ✅ Подключение MongoDB в app.module.ts
3. ✅ User Schema (модель пользователя)
4. ✅ DTO классы с валидацией
5. ✅ Auth Service (регистрация + вход)
6. ✅ JWT стратегия и Guard
7. ✅ Auth Controller (endpoints)
8. ✅ Настройка Auth Module

**Структура которую создадим**:
```
backend/src/
├── modules/
│   ├── users/
│   │   ├── schemas/
│   │   │   └── user.schema.ts       ← Задание 3
│   │   ├── dto/
│   │   │   └── create-user.dto.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   └── auth/
│       ├── dto/
│       │   ├── register.dto.ts      ← Задание 4
│       │   └── login.dto.ts         ← Задание 4
│       ├── strategies/
│       │   └── jwt.strategy.ts      ← Задание 6
│       ├── guards/
│       │   └── jwt-auth.guard.ts    ← Задание 6
│       ├── auth.controller.ts       ← Задание 7
│       ├── auth.service.ts          ← Задание 5
│       └── auth.module.ts           ← Задание 8
└── app.module.ts                    ← Задание 2
```

---

## 📋 Задание 1: Запуск проекта через Docker

### 🎯 Цель:
Запустить все сервисы (MongoDB, Redis, Backend, Frontend) через Docker Compose

### 📝 Что нужно сделать:

**ВАЖНО**: Сначала установите Docker! Смотрите [`Docker_Guide.md`](./Docker_Guide.md)

**Шаг 1: Проверьте docker-compose.yml**

Откройте файл `/home/linkoln/Project/Icore/docker-compose.yml`

Убедитесь что есть все 4 сервиса:
- `mongodb` - База данных
- `redis` - Кеш и очереди  
- `backend` - NestJS API
- `frontend` - Nuxt 3

**Шаг 2: Запустите проект**

```bash
# Перейдите в корень проекта
cd /home/linkoln/Project/Icore

# Запустите всё (первый раз займёт время)
docker-compose up
```

**Что произойдёт**:
1. Docker скачает образы MongoDB и Redis (если ещё нет)
2. Соберёт образы Backend и Frontend из Dockerfile
3. Запустит все 4 контейнера
4. Покажет логи в терминале

**Вы увидите**:
```
icore-mongodb   | MongoDB started successfully
icore-redis     | Ready to accept connections
icore-backend   | Nest application successfully started
icore-frontend  | Nuxt prepared in xxx ms
```

### ✅ Проверка:

**1. Проверьте что контейнеры запущены**:
```bash
# В НОВОМ терминале (не останавливая docker-compose)
docker ps
```

Должны быть 4 контейнера:
```
icore-mongodb
icore-redis
icore-backend
icore-frontend
```

**2. Проверьте MongoDB**:
```bash
# Подключитесь к MongoDB
docker-compose exec mongodb mongosh -u admin -p password123

# Внутри mongosh:
show dbs
exit
```

**3. Проверьте Backend**:

Откройте в браузере: `http://localhost:3001`

ИЛИ через curl:
```bash
curl http://localhost:3001
```

Должен вернуться ответ от NestJS (возможно "Hello World!" или 404 - это OK)

**4. Проверьте Frontend**:

Откройте в браузере: `http://localhost:3000`

Должна открыться стартовая страница Nuxt

**5. Проверьте Redis**:
```bash
# Подключитесь к Redis
docker-compose exec redis redis-cli

# Внутри redis-cli:
PING
# Должно вывести: PONG
exit
```

### 💡 Подсказки:

**Остановить проект**:
```bash
# Нажмите Ctrl+C в терминале где запущен docker-compose
# ИЛИ в другом терминале:
docker-compose down
```

**Запустить в фоне (detached)**:
```bash
docker-compose up -d
```

**Посмотреть логи**:
```bash
# Все логи
docker-compose logs -f

# Логи одного сервиса
docker-compose logs -f backend
```

**Перезапустить сервис**:
```bash
docker-compose restart backend
```

### 🔍 Что изучаете:
- Docker и контейнеризация
- Docker Compose для оркестрации
- Работа с множественными сервисами
- Переменные окружения
- Volumes и сети Docker

### 📝 Следующий шаг:

После успешного запуска переходите к **Заданию 2: Подключение MongoDB в коде**

---

## 📋 Задание 2: Подключение MongoDB в app.module.ts

### 🎯 Цель:
Подключить MongoDB к NestJS приложению через Mongoose

### 📝 Что нужно сделать:

**Файл**: `backend/src/app.module.ts`

1. Импортировать `MongooseModule` из `@nestjs/mongoose`
2. Импортировать `ConfigModule` из `@nestjs/config`
3. Добавить в `imports` массив:
   - `ConfigModule.forRoot()` - для переменных окружения
   - `MongooseModule.forRoot()` - для подключения MongoDB

### 💡 Подсказки:

**Импорты**:
```typescript
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '@nestjs/config'
```

**Структура module**:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(connection_string),
    // остальные модули...
  ],
  // ...
})
```

**Connection string из docker-compose.yml**:
```typescript
process.env.MONGODB_URI || 'mongodb://mongodb:27017/icore'
```

**ВАЖНО**: В Docker используем имя сервиса `mongodb`, не `localhost`!

**Почему?**
- Внутри Docker контейнеры обращаются друг к другу по имени сервиса
- `mongodb://mongodb:27017` - правильно (имя сервиса из docker-compose.yml)
- `mongodb://localhost:27017` - неправильно внутри Docker

### ✅ Проверка:

После изменений **перезапустите backend**:

```bash
# Пересоберите и перезапустите backend
docker-compose up -d --build backend

# Посмотрите логи
docker-compose logs -f backend
```

Должно быть в логах:
```
✅ "Successfully connected to MongoDB"
ИЛИ
✅ Нет ошибок подключения
```

### 🤔 Вопросы для понимания:

1. **Зачем ConfigModule.forRoot()?**
   - Загружает переменные окружения из .env файла
   - Делает их доступными через process.env

2. **Почему MongooseModule.forRoot()?**
   - Подключается к MongoDB при старте приложения
   - Регистрирует Mongoose в DI контейнере NestJS

3. **Почему `mongodb://mongodb:27017` а не `localhost`?**
   - В Docker каждый контейнер изолирован
   - Контейнеры общаются через Docker сеть
   - `mongodb` - имя сервиса из docker-compose.yml

### 🔍 Что изучаете:
- `MongooseModule` для подключения БД
- `ConfigModule` для переменных окружения
- Docker сети и обращение между контейнерами
- Структура NestJS модулей

---

## 📋 Задание 3: User Schema (Модель пользователя)

### 🎯 Цель:
Создать Mongoose схему для User

### 📝 Что нужно сделать:

**Файл**: Создайте `backend/src/modules/users/schemas/user.schema.ts`

1. Импортировать декораторы: `Schema`, `Prop`, `SchemaFactory` из `@nestjs/mongoose`
2. Импортировать `Document` из `mongoose`
3. Создать класс `User` который extends `Document`
4. Добавить декоратор `@Schema({ timestamps: true })`
5. Создать поля с декоратором `@Prop()`:
   - `name` - строка, обязательное
   - `email` - строка, обязательное, уникальное
   - `password` - строка, обязательное (будет хеш)
   - `avatar` - строка, необязательное
   - `status` - строка, enum: `['online', 'offline', 'away', 'dnd']`
6. Экспортировать схему: `SchemaFactory.createForClass(User)`

### 💡 Подсказки:

**Импорты**:
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
```

**Декоратор класса**:
```typescript
@Schema({ timestamps: true })  // Добавит createdAt, updatedAt
export class User extends Document {
  // поля здесь
}
```

**Декоратор поля (обязательное)**:
```typescript
@Prop({ required: true })
name: string
```

**Декоратор поля (уникальное)**:
```typescript
@Prop({ required: true, unique: true })
email: string
```

**Декоратор поля (необязательное)**:
```typescript
@Prop({ required: false })
avatar?: string
```

**Декоратор поля (enum)**:
```typescript
@Prop({ enum: ['online', 'offline', 'away', 'dnd'], default: 'offline' })
status: string
```

**Экспорт схемы**:
```typescript
export const UserSchema = SchemaFactory.createForClass(User)
```

### 🤔 Вопросы для понимания:

1. **Почему `extends Document`?**
   - Document добавляет методы Mongoose (_id, save(), etc.)

2. **Зачем `timestamps: true`?**
   - Автоматически добавляет createdAt и updatedAt

3. **Почему email unique?**
   - Один email = один аккаунт

4. **Почему password required?**
   - Нельзя войти без пароля

### 🔍 Что изучаете:
- Декораторы `@Schema()`, `@Prop()`
- Mongoose схемы в NestJS
- Типы данных MongoDB

---

## 📋 Задание 3: DTO классы с валидацией

### 🎯 Цель:
Создать DTO для регистрации и входа с валидацией

### 📝 Что нужно сделать (2 файла):

#### Файл 1: `backend/src/modules/auth/dto/register.dto.ts`

1. Импортировать декораторы из `class-validator`:
   - `IsEmail`, `IsString`, `MinLength`, `IsNotEmpty`
2. Создать class `RegisterDto`
3. Добавить поля с декораторами валидации:
   - `name` - не пустое, строка
   - `email` - email формат
   - `password` - минимум 6 символов

#### Файл 2: `backend/src/modules/auth/dto/login.dto.ts`

1. Создать class `LoginDto`
2. Добавить поля:
   - `email` - email формат
   - `password` - строка

### 💡 Подсказки:

**Импорты**:
```typescript
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator'
```

**Валидация - не пустое**:
```typescript
@IsNotEmpty({ message: 'Name cannot be empty' })
@IsString()
name: string
```

**Валидация - email**:
```typescript
@IsEmail({}, { message: 'Invalid email format' })
email: string
```

**Валидация - минимальная длина**:
```typescript
@MinLength(6, { message: 'Password must be at least 6 characters' })
password: string
```

**Экспорт класса**:
```typescript
export class RegisterDto {
  // поля
}
```

### 🤔 Вопросы для понимания:

1. **Зачем валидация на backend?**
   - Frontend можно обойти, backend проверяет всегда

2. **Почему минимум 6 символов для пароля?**
   - Безопасность (короткие пароли легко подобрать)

3. **Что будет если отправить невалидные данные?**
   - NestJS вернёт 400 Bad Request с описанием ошибок

### ✅ Проверка:

NestJS автоматически валидирует DTO если:
1. Установлен `class-validator`
2. В `main.ts` добавлен `ValidationPipe` (проверьте!)

### 🔍 Что изучаете:
- Декораторы валидации
- DTO паттерн
- Безопасность входных данных

---

## 📋 Задание 4: Auth Service (Бизнес-логика)

### 🎯 Цель:
Реализовать регистрацию и вход с bcrypt и JWT

### 📝 Что нужно сделать:

**Файл**: `backend/src/modules/auth/auth.service.ts`

1. Импортировать зависимости:
   - `Injectable` из `@nestjs/common`
   - `InjectModel` из `@nestjs/mongoose`
   - `JwtService` из `@nestjs/jwt`
   - `Model` из `mongoose`
   - `bcrypt`
   - DTO классы
   - User схема
   
2. Создать методы:
   - `register(dto: RegisterDto)` - регистрация
   - `login(dto: LoginDto)` - вход
   - `validateUser(email, password)` - проверка пользователя

### 💡 Подсказки:

**Структура сервиса**:
```typescript
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Model } from 'mongoose'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    private jwtService: JwtService
  ) {}
  
  async register(dto: RegisterDto) {
    // Реализация
  }
  
  async login(dto: LoginDto) {
    // Реализация
  }
  
  async validateUser(email: string, password: string) {
    // Реализация
  }
}
```

**Метод register (шаги)**:
```
1. Проверить что email не занят
   const existing = await this.userModel.findOne({ email: dto.email })
   if (existing) throw new Error('Email already exists')

2. Захешировать пароль
   const hashedPassword = await bcrypt.hash(dto.password, 10)

3. Создать пользователя
   const user = await this.userModel.create({
     name: dto.name,
     email: dto.email,
     password: hashedPassword
   })

4. Сгенерировать JWT токен
   const token = this.jwtService.sign({ userId: user._id })

5. Вернуть { user, token }
```

**Метод login (шаги)**:
```
1. Найти пользователя по email
   const user = await this.userModel.findOne({ email: dto.email })
   if (!user) throw new Error('User not found')

2. Проверить пароль
   const isMatch = await bcrypt.compare(dto.password, user.password)
   if (!isMatch) throw new Error('Invalid password')

3. Сгенерировать JWT токен
   const token = this.jwtService.sign({ userId: user._id })

4. Вернуть { user, token }
```

**bcrypt.hash() - хеширование**:
```typescript
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)
// plainPassword - открытый пароль
// saltRounds - сложность (10 рекомендуется)
```

**bcrypt.compare() - проверка**:
```typescript
const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
// true - пароль совпадает
// false - пароль неверный
```

**jwtService.sign() - создание токена**:
```typescript
const token = this.jwtService.sign({ userId: user._id })
// Внутри токена будет: { userId: '...' }
```

### 🤔 Вопросы для понимания:

1. **Почему bcrypt.hash асинхронный?**
   - Хеширование медленное (для безопасности), нужен await

2. **Что такое saltRounds = 10?**
   - Количество раундов хеширования (чем больше, тем медленнее и безопаснее)

3. **Почему НЕ храним открытый пароль?**
   - Если хакер получит доступ к БД, пароли будут скомпрометированы

4. **Зачем userId в JWT токене?**
   - Чтобы сервер знал КТО делает запрос

### ⚠️ Важно:

**НЕ возвращайте password в ответе!**
```typescript
// ❌ Плохо
return { user }  // user содержит password!

// ✅ Хорошо
const { password, ...userWithoutPassword } = user.toObject()
return { user: userWithoutPassword, token }
```

### 🔍 Что изучаете:
- bcrypt для хеширования
- JWT для создания токенов
- Dependency Injection (@InjectModel, JwtService)
- Async/await для БД операций

---

## 📋 Задание 5: JWT Strategy и Guard

### 🎯 Цель:
Настроить Passport JWT для защиты routes

### 📝 Что нужно сделать (2 файла):

#### Файл 1: `backend/src/modules/auth/strategies/jwt.strategy.ts`

1. Импортировать:
   - `Injectable` из `@nestjs/common`
   - `PassportStrategy` из `@nestjs/passport`
   - `ExtractJwt`, `Strategy` из `passport-jwt`
   
2. Создать class `JwtStrategy extends PassportStrategy(Strategy)`
3. В constructor настроить:
   - `jwtFromRequest` - откуда брать токен
   - `secretOrKey` - секретный ключ
4. Реализовать метод `validate(payload)` - что делать после проверки токена

#### Файл 2: `backend/src/modules/auth/guards/jwt-auth.guard.ts`

1. Создать класс `JwtAuthGuard extends AuthGuard('jwt')`

### 💡 Подсказки:

**JWT Strategy структура**:
```typescript
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    })
  }
  
  async validate(payload: any) {
    // payload содержит то что мы положили в токен
    // { userId: '...' }
    return { userId: payload.userId }
  }
}
```

**Что делает ExtractJwt.fromAuthHeaderAsBearerToken()**:
```
Ищет заголовок: Authorization: Bearer <token>
Извлекает токен из заголовка
```

**Что делает validate()**:
```
1. Passport уже проверил подпись токена
2. validate() получает payload (данные из токена)
3. То что вернёт validate() попадёт в req.user
```

**JWT Guard структура**:
```typescript
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Почему 'jwt' в кавычках?**
```
Это имя стратегии
PassportStrategy(Strategy) регистрирует стратегию с именем 'jwt'
AuthGuard('jwt') использует эту стратегию
```

### 🤔 Вопросы для понимания:

1. **Зачем нужна стратегия?**
   - Описывает КАК проверять токены

2. **Зачем нужен Guard?**
   - Защищает routes от неавторизованных запросов

3. **Что будет если токен невалиден?**
   - Guard вернёт 401 Unauthorized

### ✅ Использование Guard:

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@Request() req) {
  // req.user содержит то что вернул validate()
  return req.user
}
```

### 🔍 Что изучаете:
- Passport JWT стратегия
- Guards для защиты routes
- Decorator @UseGuards()

---

## 📋 Задание 6: Auth Controller (HTTP Endpoints)

### 🎯 Цель:
Создать endpoints для регистрации и входа

### 📝 Что нужно сделать:

**Файл**: `backend/src/modules/auth/auth.controller.ts`

1. Импортировать:
   - `Controller`, `Post`, `Body`, `Get`, `UseGuards`, `Request` из `@nestjs/common`
   - AuthService
   - DTO классы
   - JwtAuthGuard
   
2. Создать endpoints:
   - `POST /auth/register` - регистрация
   - `POST /auth/login` - вход
   - `GET /auth/profile` - получить профиль (защищённый)

### 💡 Подсказки:

**Структура контроллера**:
```typescript
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // Вызвать authService.register(dto)
  }
  
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // Вызвать authService.login(dto)
  }
  
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    // req.user содержит данные из JWT
    // Вернуть профиль пользователя
  }
}
```

**Декоратор @Controller('auth')**:
```
Все routes будут с префиксом /auth
POST /auth/register
POST /auth/login
GET /auth/profile
```

**Декоратор @Post('register')**:
```
POST запрос на /auth/register
```

**Декоратор @Body()**:
```
Извлекает тело запроса
NestJS автоматически валидирует его через DTO
```

**Декоратор @UseGuards(JwtAuthGuard)**:
```
Защищает endpoint
Требует валидный JWT токен
```

**Декоратор @Request()**:
```
Даёт доступ к объекту request
req.user содержит данные из JWT (то что вернул validate())
```

### 🤔 Вопросы для понимания:

1. **Почему controller вызывает service?**
   - Controller принимает запросы, Service выполняет логику

2. **Зачем @Body() dto: RegisterDto?**
   - Автоматическая валидация входных данных

3. **Что вернёт /auth/register?**
   - { user, token }

4. **Можно ли вызвать /auth/profile без токена?**
   - Нет, Guard вернёт 401 Unauthorized

### ✅ Проверка endpoints:

**Регистрация**:
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'
```

**Вход**:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Профиль (с токеном)**:
```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer <ваш_токен>"
```

### 🔍 Что изучаете:
- NestJS декораторы (@Post, @Get, @Body, @UseGuards)
- HTTP endpoints
- RESTful API

---

## 📋 Задание 7: Настройка Auth Module

### 🎯 Цель:
Связать все части Auth модуля вместе

### 📝 Что нужно сделать:

**Файл**: `backend/src/modules/auth/auth.module.ts`

1. Импортировать всё что создали:
   - MongooseModule (для User модели)
   - JwtModule (для JWT)
   - PassportModule
   - AuthController
   - AuthService
   - JwtStrategy
   
2. Настроить JwtModule:
   - secret (секретный ключ)
   - signOptions (срок действия токена)
   
3. Добавить в providers: AuthService, JwtStrategy
4. Добавить в controllers: AuthController

### 💡 Подсказки:

**Структура модуля**:
```typescript
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { User, UserSchema } from '../users/schemas/user.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

**Что делает MongooseModule.forFeature()**:
```
Регистрирует User модель для использования в этом модуле
Теперь можем @InjectModel('User')
```

**Что делает JwtModule.register()**:
```
Настраивает JWT сервис
secret - ключ для подписи токенов
signOptions - опции (срок действия)
```

**expiresIn: '7d'**:
```
Токен действует 7 дней
После этого нужно заново войти
```

### 🤔 Вопросы для понимания:

1. **Зачем MongooseModule.forFeature?**
   - Регистрируем User модель для использования

2. **Почему secret важен?**
   - Используется для подписи/проверки токенов

3. **Зачем expiresIn?**
   - Безопасность (старые токены перестают работать)

### 🔍 Что изучаете:
- NestJS модули
- Dependency Injection
- Конфигурация JwtModule

---

## ✅ Финальная проверка

### Запустите backend:
```bash
cd backend
yarn start:dev
```

### Проверьте endpoints:

**1. Регистрация**:
```bash
POST http://localhost:3001/auth/register
Body: { "name": "John", "email": "john@example.com", "password": "password123" }
```

Должно вернуть:
```json
{
  "user": {
    "_id": "...",
    "name": "John",
    "email": "john@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**2. Вход**:
```bash
POST http://localhost:3001/auth/login
Body: { "email": "john@example.com", "password": "password123" }
```

**3. Профиль (защищённый)**:
```bash
GET http://localhost:3001/auth/profile
Headers: Authorization: Bearer <ваш_токен>
```

### Проверьте MongoDB:

```bash
# Подключитесь к MongoDB
mongosh

# Выберите БД
use icore

# Посмотрите пользователей
db.users.find()
```

Должны увидеть созданного пользователя с **захешированным паролем**!

---

## 🎓 Что вы изучили

### Концепции:
- ✅ MongoDB и Mongoose
- ✅ Декораторы NestJS (@Schema, @Prop, @Post, @Get)
- ✅ DTO и валидация (class-validator)
- ✅ bcrypt для хеширования паролей
- ✅ JWT для авторизации
- ✅ Passport стратегии
- ✅ Guards для защиты routes

### Паттерны:
- ✅ Repository Pattern (Mongoose Model)
- ✅ Service Layer (AuthService)
- ✅ DTO Pattern (RegisterDto, LoginDto)
- ✅ Strategy Pattern (JwtStrategy)
- ✅ Guard Pattern (JwtAuthGuard)

### Best Practices:
- ✅ Хеширование паролей с солью
- ✅ Валидация входных данных
- ✅ JWT для stateless auth
- ✅ Разделение на слои (Controller → Service → Model)
- ✅ Использование TypeScript

---

## 🚀 Что дальше?

### День 2: Frontend Auth

**Создадим**:
- Pinia store для auth
- Composable useAuth
- API сервис
- Login/Register компоненты

**Изучим**:
- Pinia (state management)
- Composables (логика переиспользования)
- API интеграция
- Vue 3 Composition API

---

**Выполнили все задания? Покажите результат! 💪**

Если возникли вопросы или ошибки - спрашивайте, разберём вместе! 🚀
