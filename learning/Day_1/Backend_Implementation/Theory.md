# 📚 День 1: Backend Аутентификация - Теория

> **Перед практикой**: Изучи эти концепции, чтобы понимать что делаешь!

---

## 🎯 Содержание

1. [NestJS - Архитектура](#1-nestjs---архитектура)
2. [TypeScript Decorators](#2-typescript-decorators)
3. [Dependency Injection (DI)](#3-dependency-injection-di)
4. [MongoDB & Mongoose](#4-mongodb--mongoose)
5. [JWT Authentication](#5-jwt-authentication)
6. [Bcrypt - Хеширование паролей](#6-bcrypt---хеширование-паролей)
7. [DTO - Data Transfer Objects](#7-dto---data-transfer-objects)
8. [Guards - Защита endpoints](#8-guards---защита-endpoints)
9. [CORS - Cross-Origin Resource Sharing](#9-cors---cross-origin-resource-sharing)

---

## 1. NestJS - Архитектура

### Что такое NestJS?

**NestJS** - это фреймворк для создания масштабируемых Node.js серверных приложений.

**Основан на:**
- **Express.js** (HTTP сервер)
- **TypeScript** (типизация)
- **Decorators** (метаданные)
- **Dependency Injection** (внедрение зависимостей)

### Архитектурные принципы

**NestJS следует принципам:**
- **Модульность** - все разбито на модули
- **Dependency Injection** - автоматическое внедрение зависимостей
- **Decorators** - метаданные через аннотации
- **SOLID принципы** - чистая архитектура

### Основные компоненты

```
┌─────────────┐
│   Module    │  ← Группирует связанные компоненты
│             │
├─────────────┤
│ Controller  │  ← Обрабатывает HTTP запросы
│             │
├─────────────┤
│  Service    │  ← Бизнес-логика
│             │
├─────────────┤
│ Repository  │  ← Работа с базой данных
│             │
└─────────────┘
```

#### Module (Модуль)

**Module** - группирует связанные компоненты (controllers, services, providers).

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
  exports: [AuthService]  // Что доступно другим модулям
})
export class AuthModule {}
```

**Зачем модули:**
- ✅ **Организация кода** - логическое разделение
- ✅ **Переиспользование** - модули можно импортировать
- ✅ **Инкапсуляция** - скрывают внутреннюю реализацию
- ✅ **Тестирование** - легко мокировать модули

#### Controller (Контроллер)

**Controller** - обрабатывает HTTP запросы и возвращает ответы.

```typescript
@Controller('auth')  // Префикс маршрута
export class AuthController {
  constructor(private authService: AuthService) {}  // DI

  @Post('register')  // POST /auth/register
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('login')     // POST /auth/login
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Get('profile')    // GET /auth/profile
  @UseGuards(JwtAuthGuard)  // Защита маршрута
  async getProfile(@Request() req) {
    return req.user
  }
}
```

**Ответственность Controller:**
- ✅ Принимает HTTP запросы
- ✅ Валидирует входные данные (через DTO)
- ✅ Вызывает бизнес-логику (Service)
- ✅ Возвращает HTTP ответы
- ❌ НЕ содержит бизнес-логику

#### Service (Сервис)

**Service** - содержит бизнес-логику приложения.

```typescript
@Injectable()  // Может быть внедрен через DI
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    // Бизнес-логика регистрации
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword
    })
    return this.generateTokens(user)
  }

  private generateTokens(user: User) {
    // Приватный метод - внутренняя логика
    const payload = { email: user.email, sub: user._id }
    return {
      access_token: this.jwtService.sign(payload)
    }
  }
}
```

**Ответственность Service:**
- ✅ Бизнес-логика
- ✅ Валидация бизнес-правил
- ✅ Координация между разными сервисами
- ✅ Обработка ошибок
- ❌ НЕ работает напрямую с HTTP

---

## 2. TypeScript Decorators

### Что такое Decorators?

**Decorators (Декораторы)** - это специальные аннотации, которые добавляют метаданные к классам, методам, свойствам.

**Простыми словами:** Декораторы = "наклейки" с инструкциями для фреймворка.

### Синтаксис

```typescript
@DecoratorName(parameters)
class MyClass {
  @PropertyDecorator
  property: string

  @MethodDecorator(options)
  method() {}
}
```

### Основные декораторы NestJS

#### Декораторы классов

```typescript
// Модуль
@Module({
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}

// Контроллер
@Controller('auth')  // Префикс маршрута
export class AuthController {}

// Сервис
@Injectable()  // Может быть внедрен через DI
export class AuthService {}

// Схема MongoDB
@Schema()  // Mongoose схема
export class User {
  @Prop({ required: true, unique: true })
  email: string
}
```

#### Декораторы методов

```typescript
@Controller('auth')
export class AuthController {
  // HTTP методы
  @Get()           // GET запрос
  @Post()          // POST запрос
  @Put()           // PUT запрос
  @Delete()        // DELETE запрос
  @Patch()         // PATCH запрос

  @Post('register')  // POST /auth/register
  async register() {}

  // Защита маршрутов
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile() {}

  // Валидация
  @UsePipes(ValidationPipe)
  @Post('login')
  async login() {}
}
```

#### Декораторы параметров

```typescript
@Controller('auth')
export class AuthController {
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,        // Тело запроса
    @Query('type') type: string,             // Query параметр
    @Param('id') id: string,                 // URL параметр
    @Headers('authorization') auth: string,   // Заголовок
    @Request() req,                          // Объект запроса
    @Response() res                          // Объект ответа
  ) {
    return this.authService.register(registerDto)
  }
}
```

#### Декораторы свойств (Mongoose)

```typescript
@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  password: string

  @Prop({ default: 'offline' })
  status: string

  @Prop({ default: null })
  avatar: string

  @Prop({ default: Date.now })
  createdAt: Date
}
```

### Как работают декораторы?

**Декораторы = функции**, которые выполняются во время компиляции:

```typescript
// Это:
@Controller('auth')
export class AuthController {}

// Эквивалентно:
export class AuthController {}
Controller('auth')(AuthController)  // Вызов функции-декоратора
```

**NestJS читает метаданные** и настраивает приложение:

1. `@Controller('auth')` → создает маршруты с префиксом `/auth`
2. `@Post('register')` → создает POST endpoint `/auth/register`
3. `@Injectable()` → регистрирует класс в DI контейнере
4. `@Body()` → извлекает данные из тела запроса

---

## 3. Dependency Injection (DI)

### Что такое Dependency Injection?

**Dependency Injection (Внедрение зависимостей)** - паттерн, при котором объекты получают свои зависимости извне, а не создают их сами.

### Проблема без DI

```typescript
// Плохо - жесткая связанность
class AuthService {
  private usersService: UsersService
  private jwtService: JwtService

  constructor() {
    // Создаем зависимости сами
    this.usersService = new UsersService()
    this.jwtService = new JwtService()
  }
}

// Проблемы:
// ❌ Сложно тестировать (нельзя подменить зависимости)
// ❌ Жесткая связанность
// ❌ Нарушение Single Responsibility Principle
```

### Решение с DI

```typescript
// Хорошо - зависимости внедряются извне
@Injectable()
class AuthService {
  constructor(
    private usersService: UsersService,  // Внедряется автоматически
    private jwtService: JwtService        // Внедряется автоматически
  ) {}

  async register(data: RegisterDto) {
    // Используем внедренные зависимости
    const user = await this.usersService.create(data)
    return this.jwtService.sign({ sub: user._id })
  }
}

// Преимущества:
// ✅ Легко тестировать (можно мокировать зависимости)
// ✅ Слабая связанность
// ✅ Следует SOLID принципам
```

### Как работает DI в NestJS?

**1. Регистрация провайдеров:**
```typescript
@Module({
  providers: [
    AuthService,     // Регистрируем в DI контейнере
    UsersService,
    JwtService
  ]
})
export class AuthModule {}
```

**2. Внедрение через конструктор:**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,  // NestJS автоматически внедряет
    private jwtService: JwtService
  ) {}
}
```

**3. NestJS создает граф зависимостей:**
```
AuthController
    ↓ (нужен)
AuthService
    ↓ (нужен)        ↓ (нужен)
UsersService    JwtService
    ↓ (нужен)
Mongoose Model
```

### Типы провайдеров

```typescript
@Module({
  providers: [
    // 1. Класс (короткая запись)
    AuthService,

    // 2. Класс (полная запись)
    {
      provide: AuthService,
      useClass: AuthService
    },

    // 3. Значение
    {
      provide: 'CONFIG',
      useValue: { apiKey: 'secret' }
    },

    // 4. Фабрика
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        return mongoose.connect('mongodb://localhost/test')
      }
    }
  ]
})
export class AuthModule {}
```

---

## 4. MongoDB & Mongoose

### Что такое MongoDB?

**MongoDB** - NoSQL документо-ориентированная база данных.

**Особенности:**
- **Документы** вместо строк (JSON-подобные объекты)
- **Коллекции** вместо таблиц
- **Гибкая схема** - документы могут иметь разную структуру
- **Горизонтальное масштабирование**

### Что такое Mongoose?

**Mongoose** - ODM (Object Document Mapper) для MongoDB и Node.js.

**Зачем нужен:**
- ✅ **Схемы** - структура документов
- ✅ **Валидация** - проверка данных
- ✅ **Типизация** - TypeScript поддержка
- ✅ **Middleware** - хуки (pre/post)
- ✅ **Популяция** - связи между документами

### Схемы Mongoose

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

// 1. Определяем класс схемы
@Schema({
  timestamps: true,  // Автоматически добавляет createdAt, updatedAt
  collection: 'users'  // Имя коллекции в MongoDB
})
export class User {
  @Prop({ 
    required: true,    // Обязательное поле
    unique: true,      // Уникальное значение
    lowercase: true,   // Преобразовать в нижний регистр
    trim: true         // Убрать пробелы
  })
  email: string

  @Prop({ 
    required: true,
    minlength: 2,      // Минимальная длина
    maxlength: 50      // Максимальная длина
  })
  name: string

  @Prop({ 
    required: true,
    minlength: 6       // Минимум 6 символов для пароля
  })
  password: string

  @Prop({ 
    default: 'offline',
    enum: ['online', 'offline', 'away']  // Только эти значения
  })
  status: string
}

// 2. Создаем схему
export const UserSchema = SchemaFactory.createForClass(User)

// 3. Типы для TypeScript
export type UserDocument = User & Document
```

### Подключение к MongoDB

```typescript
// app.module.ts
@Module({
  imports: [
    // Подключение к MongoDB
    MongooseModule.forRoot('mongodb://localhost:27017/icore', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }),
    
    // Регистрация схем
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ])
  ]
})
export class AppModule {}
```

### Работа с моделями

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  // Создание
  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto)
    return createdUser.save()
  }

  // Поиск всех
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec()
  }

  // Поиск по ID
  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec()
  }

  // Поиск по условию
  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec()
  }

  // Обновление
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec()
  }

  // Удаление
  async delete(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(id).exec()
  }

  // Сложные запросы
  async findActiveUsers(): Promise<User[]> {
    return this.userModel
      .find({ status: { $ne: 'offline' } })  // status !== 'offline'
      .sort({ createdAt: -1 })               // Сортировка по дате
      .limit(10)                             // Максимум 10 записей
      .select('name email status')           // Только эти поля
      .exec()
  }
}
```

---

## 5. JWT Authentication

### Что такое JWT?

**JWT (JSON Web Token)** - стандарт для безопасной передачи информации между сторонами.

**Структура JWT:**
```
header.payload.signature
```

**Пример:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Части JWT

#### 1. Header (Заголовок)
```json
{
  "alg": "HS256",  // Алгоритм подписи
  "typ": "JWT"     // Тип токена
}
```

#### 2. Payload (Полезная нагрузка)
```json
{
  "sub": "1234567890",    // Subject (ID пользователя)
  "email": "user@example.com",
  "iat": 1516239022,       // Issued At (время создания)
  "exp": 1516242622        // Expiration (время истечения)
}
```

#### 3. Signature (Подпись)
```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Как работает JWT аутентификация?

```
1. Пользователь отправляет логин/пароль
   ↓
2. Сервер проверяет данные
   ↓
3. Сервер создает JWT токен
   ↓
4. Клиент сохраняет токен
   ↓
5. Клиент отправляет токен в заголовке Authorization
   ↓
6. Сервер проверяет подпись токена
   ↓
7. Если валиден - разрешает доступ
```

### Реализация в NestJS

#### 1. Установка пакетов
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

#### 2. JWT Module
```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { 
        expiresIn: '7d'  // Токен действует 7 дней
      }
    })
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
```

#### 3. Auth Service
```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    // Проверяем пользователя
    const user = await this.validateUser(loginDto.email, loginDto.password)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Создаем JWT токен
    const payload = { 
      email: user.email, 
      sub: user._id,  // Subject = User ID
      name: user.name 
    }
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatar: user.avatar
      }
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email)
    if (user && await bcrypt.compare(password, user.password)) {
      return user
    }
    return null
  }
}
```

#### 4. JWT Strategy
```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
    })
  }

  // Вызывается если токен валиден
  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException()
    }
    return user  // Будет доступен в req.user
  }
}
```

#### 5. JWT Guard
```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context)
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token')
    }
    return user
  }
}
```

#### 6. Использование в Controller
```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @UseGuards(JwtAuthGuard)  // Защищенный маршрут
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user  // Пользователь из JWT токена
  }
}
```

### Безопасность JWT

**Преимущества:**
- ✅ **Stateless** - не нужно хранить сессии на сервере
- ✅ **Масштабируемость** - токен содержит всю информацию
- ✅ **Cross-domain** - работает между разными доменами

**Недостатки:**
- ❌ **Нельзя отозвать** - токен действует до истечения
- ❌ **Размер** - больше чем session ID
- ❌ **Безопасность** - нужно защищать секретный ключ

**Best Practices:**
- ✅ Используйте сильный секретный ключ (минимум 256 бит)
- ✅ Устанавливайте короткое время жизни токена
- ✅ Используйте HTTPS
- ✅ Не храните чувствительные данные в payload
- ✅ Валидируйте токен на каждом запросе

---

## 6. Bcrypt - Хеширование паролей

### Зачем хешировать пароли?

**Проблема:** Хранение паролей в открытом виде крайне небезопасно.

```typescript
// ❌ НИКОГДА ТАК НЕ ДЕЛАЙ!
const user = {
  email: 'user@example.com',
  password: 'mypassword123'  // Открытый текст
}
```

**Решение:** Хешировать пароли перед сохранением.

```typescript
// ✅ Правильно
const user = {
  email: 'user@example.com',
  password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
}
```

### Что такое Bcrypt?

**Bcrypt** - алгоритм хеширования паролей с солью.

**Особенности:**
- ✅ **Медленный** - защита от brute-force атак
- ✅ **Соль** - уникальная для каждого пароля
- ✅ **Адаптивный** - можно увеличивать сложность
- ✅ **Необратимый** - нельзя получить исходный пароль

### Установка

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

### Использование

```typescript
import * as bcrypt from 'bcrypt'

// Хеширование пароля
const password = 'mypassword123'
const saltRounds = 10  // Количество раундов (чем больше, тем медленнее)
const hashedPassword = await bcrypt.hash(password, saltRounds)
// Результат: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

// Проверка пароля
const isMatch = await bcrypt.compare('mypassword123', hashedPassword)
// Результат: true

const isMatch2 = await bcrypt.compare('wrongpassword', hashedPassword)
// Результат: false
```

### Реализация в NestJS

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    // 1. Хешируем пароль
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)
    
    // 2. Создаем пользователя с хешированным паролем
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword
    })
    
    // 3. Генерируем токен
    return this.generateTokens(user)
  }

  async login(loginDto: LoginDto) {
    // 1. Находим пользователя
    const user = await this.usersService.findByEmail(loginDto.email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    
    // 2. Сравниваем пароли
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }
    
    // 3. Генерируем токен
    return this.generateTokens(user)
  }
}
```

### Salt Rounds

**Salt Rounds** - количество раундов хеширования.

```typescript
// Чем больше раундов, тем медленнее и безопаснее
const saltRounds = 10  // ~10 хешей в секунду (рекомендуется)
const saltRounds = 12  // ~3 хеша в секунду (более безопасно)
const saltRounds = 14  // ~1 хеш в секунду (очень безопасно)
```

**Рекомендации:**
- ✅ Используйте минимум 10 раундов
- ✅ Для критичных систем - 12-14 раундов
- ❌ Не используйте меньше 10 раундов

---

## 7. DTO - Data Transfer Objects

### Что такое DTO?

**DTO (Data Transfer Object)** - объект для передачи данных между слоями приложения.

**Зачем нужны:**
- ✅ **Валидация** - проверка входных данных
- ✅ **Типизация** - TypeScript типы
- ✅ **Документация** - автоматическая генерация Swagger
- ✅ **Безопасность** - фильтрация лишних полей

### Установка валидации

```bash
npm install class-validator class-transformer
```

### Создание DTO

```typescript
// register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string

  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string
}
```

```typescript
// login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string
}
```

### Использование DTO

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe())  // Включаем валидацию
  async register(@Body() registerDto: RegisterDto) {
    // registerDto уже провалидирован
    return this.authService.register(registerDto)
  }

  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }
}
```

### Глобальная валидация

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Включаем валидацию глобально
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Удаляет лишние поля
    forbidNonWhitelisted: true,  // Ошибка если есть лишние поля
    transform: true         // Автоматическое преобразование типов
  }))
  
  await app.listen(3000)
}
bootstrap()
```

### Декораторы валидации

```typescript
import {
  IsEmail,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches
} from 'class-validator'

export class UserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string

  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, {
    message: 'Password must contain letters and numbers'
  })
  password: string

  @IsOptional()  // Поле необязательное
  @IsString()
  avatar?: string

  @IsEnum(['online', 'offline', 'away'])
  status: string

  @IsNumber()
  @Min(18)
  @Max(100)
  age: number

  @IsBoolean()
  isActive: boolean

  @IsArray()
  @IsString({ each: true })  // Каждый элемент массива - строка
  tags: string[]
}
```

### Кастомная валидация

```typescript
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator'

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    // Минимум 8 символов, 1 заглавная, 1 строчная, 1 цифра, 1 спецсимвол
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return regex.test(password)
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  }
}

// Использование
export class RegisterDto {
  @Validate(IsStrongPasswordConstraint)
  password: string
}
```

---

## 8. Guards - Защита endpoints

### Что такое Guards?

**Guards** - механизм для контроля доступа к маршрутам.

**Зачем нужны:**
- ✅ **Аутентификация** - проверка токена
- ✅ **Авторизация** - проверка прав доступа
- ✅ **Защита маршрутов** - ограничение доступа

### Как работают Guards?

```
1. Запрос приходит на endpoint
   ↓
2. Guard проверяет условия
   ↓
3. Если true - пропускает запрос
   ↓
4. Если false - возвращает 403 Forbidden
```

### JWT Auth Guard

```typescript
// jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Вызывает JWT Strategy для валидации токена
    return super.canActivate(context)
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token')
    }
    return user  // Будет доступен в req.user
  }
}
```

### Использование Guards

```typescript
@Controller('auth')
export class AuthController {
  // Защита одного маршрута
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user
  }

  // Защита нескольких маршрутов
  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSettings(@Request() req) {
    return { userId: req.user._id }
  }
}

// Защита всего контроллера
@Controller('users')
@UseGuards(JwtAuthGuard)  // Все маршруты защищены
export class UsersController {
  @Get()
  findAll() {
    return 'All users'
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `User ${id}`
  }
}
```

### Глобальная защита

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Все маршруты защищены по умолчанию
  app.useGlobalGuards(new JwtAuthGuard())
  
  await app.listen(3000)
}
bootstrap()
```

### Публичные маршруты

```typescript
// public.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    // Проверяем метаданные
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    
    if (isPublic) {
      return true  // Пропускаем публичные маршруты
    }
    
    return super.canActivate(context)
  }
}

// Использование
@Controller('auth')
export class AuthController {
  @Public()  // Публичный маршрут
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @UseGuards(JwtAuthGuard)  // Защищенный маршрут
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user
  }
}
```

### Roles Guard (Авторизация)

```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    
    if (!requiredRoles) {
      return true  // Нет требований к ролям
    }
    
    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.some((role) => user.roles?.includes(role))
  }
}

// Использование
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)  // Сначала аутентификация, потом авторизация
export class AdminController {
  @Roles('admin')  // Только для админов
  @Get('users')
  getAllUsers() {
    return 'All users'
  }

  @Roles('admin', 'moderator')  // Для админов и модераторов
  @Delete('user/:id')
  deleteUser(@Param('id') id: string) {
    return `Delete user ${id}`
  }
}
```

---

## 9. CORS - Cross-Origin Resource Sharing

### Что такое CORS?

**CORS (Cross-Origin Resource Sharing)** - механизм, который позволяет веб-приложениям делать запросы к другим доменам.

**Проблема:**
```
Frontend: http://localhost:5173
Backend:  http://localhost:3000

❌ Браузер блокирует запросы между разными доменами
```

**Решение:**
```
Backend разрешает запросы с определенных доменов через CORS
```

### Включение CORS в NestJS

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Простой вариант - разрешить все
  app.enableCors()
  
  await app.listen(3000)
}
bootstrap()
```

### Настройка CORS

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Детальная настройка
  app.enableCors({
    origin: 'http://localhost:5173',  // Разрешенный домен
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',  // Разрешенные методы
    credentials: true,  // Разрешить cookies
    allowedHeaders: 'Content-Type, Authorization'  // Разрешенные заголовки
  })
  
  await app.listen(3000)
}
bootstrap()
```

### Множественные домены

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'https://myapp.com'
    ],
    credentials: true
  })
  
  await app.listen(3000)
}
bootstrap()
```

### Динамическая проверка origin

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://myapp.com'
      ]
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true
  })
  
  await app.listen(3000)
}
bootstrap()
```

### CORS для разработки и продакшена

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://myapp.com'  // Продакшен
      : 'http://localhost:5173',  // Разработка
    credentials: true
  }
  
  app.enableCors(corsOptions)
  
  await app.listen(3000)
}
bootstrap()
```

---

## 🎓 Итоги

Теперь ты понимаешь:

1. **NestJS архитектуру** - Module, Controller, Service
2. **Decorators** - метаданные для классов и методов
3. **Dependency Injection** - автоматическое внедрение зависимостей
4. **MongoDB & Mongoose** - работа с базой данных
5. **JWT Authentication** - токены для аутентификации
6. **Bcrypt** - безопасное хеширование паролей
7. **DTO** - валидация входных данных
8. **Guards** - защита маршрутов
9. **CORS** - разрешение кросс-доменных запросов

**Следующий шаг:** Переходи к Practice.md и применяй знания на практике! 🚀
