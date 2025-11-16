# 🛠️ День 1: Backend Аутентификация - Практика

> **Цель**: Создать полноценную систему аутентификации с регистрацией, логином и защищенными маршрутами

---

## 📋 Что будем делать

1. ✅ Настроить NestJS проект
2. ✅ Подключить MongoDB
3. ✅ Создать User схему
4. ✅ Реализовать регистрацию
5. ✅ Реализовать логин с JWT
6. ✅ Защитить маршруты
7. ✅ Настроить CORS

---

## 🚀 Шаг 1: Инициализация проекта

### 1.1 Создание проекта

```bash
# Установка NestJS CLI (если еще не установлен)
npm install -g @nestjs/cli

# Создание проекта
nest new backend
cd backend

# Выбери npm как package manager
```

### 1.2 Установка зависимостей

```bash
# MongoDB и Mongoose
npm install @nestjs/mongoose mongoose

# JWT и Passport
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt

# Bcrypt для хеширования паролей
npm install bcrypt
npm install -D @types/bcrypt

# Валидация
npm install class-validator class-transformer

# Переменные окружения
npm install @nestjs/config
```

### 1.3 Структура проекта

```
backend/
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── schemas/
│   │   │   └── user.schema.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
└── package.json
```

---

## 🗄️ Шаг 2: Настройка MongoDB

### 2.1 Создать .env файл

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/icore
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
```

### 2.2 Настроить ConfigModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    // Загрузка переменных окружения
    ConfigModule.forRoot({
      isGlobal: true  // Доступно во всех модулях
    }),
    
    // Подключение к MongoDB
    MongooseModule.forRoot(process.env.MONGODB_URI)
  ]
})
export class AppModule {}
```

---

## 👤 Шаг 3: Создание User схемы

### 3.1 Создать схему пользователя

```typescript
// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string

  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true })
  password: string

  @Prop({ default: 'offline', enum: ['online', 'offline', 'away'] })
  status: string

  @Prop({ default: null })
  avatar: string | null
}

export const UserSchema = SchemaFactory.createForClass(User)
```

### 3.2 Создать Users Service

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument } from './schemas/user.schema'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(userData)
    return createdUser.save()
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec()
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec()
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec()
  }
}
```

### 3.3 Создать Users Module

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersService } from './users.service'
import { User, UserSchema } from './schemas/user.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  providers: [UsersService],
  exports: [UsersService]  // Экспортируем для использования в других модулях
})
export class UsersModule {}
```

---

## 🔐 Шаг 4: Создание DTO для валидации

### 4.1 Register DTO

```typescript
// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @IsEmail({}, { message: 'Неверный формат email' })
  email: string

  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Имя не должно превышать 50 символов' })
  name: string

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string
}
```

### 4.2 Login DTO

```typescript
// src/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Неверный формат email' })
  email: string

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string
}
```

---

## 🔑 Шаг 5: Реализация Auth Service

### 5.1 Создать Auth Service

```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    // Проверяем существует ли пользователь
    const existingUser = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует')
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)

    // Создаем пользователя
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword
    })

    // Генерируем токен
    return this.generateTokens(user)
  }

  async login(loginDto: LoginDto) {
    // Находим пользователя
    const user = await this.usersService.findByEmail(loginDto.email)
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    // Генерируем токен
    return this.generateTokens(user)
  }

  private generateTokens(user: any) {
    const payload = {
      email: user.email,
      sub: user._id,
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
}
```

---

## 🛡️ Шаг 6: JWT Strategy и Guard

### 6.1 Создать JWT Strategy

```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../../users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')
    })
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден')
    }
    return user
  }
}
```

### 6.2 Создать JWT Auth Guard

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context)
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Неверный или истекший токен')
    }
    return user
  }
}
```

---

## 🎮 Шаг 7: Auth Controller

### 7.1 Создать Auth Controller

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      status: req.user.status,
      avatar: req.user.avatar
    }
  }
}
```

---

## 📦 Шаг 8: Auth Module

### 8.1 Создать Auth Module

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
```

---

## 🔧 Шаг 9: Настройка App Module

### 9.1 Обновить App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    AuthModule,
    UsersModule
  ]
})
export class AppModule {}
```

---

## 🌐 Шаг 10: Настройка main.ts

### 10.1 Обновить main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  // CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true
  })

  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`🚀 Backend запущен на http://localhost:${port}`)
}
bootstrap()
```

---

## 🧪 Шаг 11: Тестирование API

### 11.1 Запустить MongoDB

```bash
# Если используешь Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Или установи MongoDB локально
# https://www.mongodb.com/try/download/community
```

### 11.2 Запустить Backend

```bash
npm run start:dev
```

### 11.3 Тестирование через curl

#### Регистрация

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

**Ожидаемый ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "test@example.com",
    "status": "offline",
    "avatar": null
  }
}
```

#### Логин

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Получение профиля (защищенный маршрут)

```bash
# Замени YOUR_TOKEN на токен из ответа регистрации/логина
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Test User",
  "email": "test@example.com",
  "status": "offline",
  "avatar": null
}
```

### 11.4 Тестирование через Postman

1. **Создай коллекцию "iCore API"**

2. **Регистрация:**
   - Method: POST
   - URL: `http://localhost:3000/auth/register`
   - Body (JSON):
   ```json
   {
     "email": "test@example.com",
     "name": "Test User",
     "password": "password123"
   }
   ```

3. **Логин:**
   - Method: POST
   - URL: `http://localhost:3000/auth/login`
   - Body (JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

4. **Профиль:**
   - Method: GET
   - URL: `http://localhost:3000/auth/profile`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer YOUR_TOKEN`

---

## ✅ Проверка работы

### Что должно работать:

1. ✅ **Регистрация нового пользователя**
   - Создается пользователь в MongoDB
   - Пароль хешируется
   - Возвращается JWT токен

2. ✅ **Логин существующего пользователя**
   - Проверяется email и пароль
   - Возвращается JWT токен

3. ✅ **Получение профиля**
   - Только с валидным токеном
   - Возвращает данные пользователя

4. ✅ **Валидация**
   - Email должен быть валидным
   - Имя минимум 2 символа
   - Пароль минимум 6 символов

5. ✅ **Ошибки**
   - Дубликат email при регистрации
   - Неверный email/пароль при логине
   - Отсутствие токена при доступе к профилю

---

## 🐛 Возможные проблемы и решения

### Проблема 1: MongoDB не подключается

**Ошибка:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Решение:**
```bash
# Проверь запущен ли MongoDB
docker ps

# Если нет, запусти
docker run -d -p 27017:27017 --name mongodb mongo
```

### Проблема 2: JWT_SECRET не найден

**Ошибка:**
```
Error: JWT secret is required
```

**Решение:**
```bash
# Создай .env файл в корне backend/
echo "JWT_SECRET=your-super-secret-key" > .env
echo "MONGODB_URI=mongodb://localhost:27017/icore" >> .env
```

### Проблема 3: CORS ошибка

**Ошибка:**
```
Access to fetch at 'http://localhost:3000/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Решение:**
```typescript
// src/main.ts
app.enableCors({
  origin: 'http://localhost:5173',  // Убедись что порт правильный
  credentials: true
})
```

### Проблема 4: Валидация не работает

**Ошибка:**
```
Validation не срабатывает, принимаются любые данные
```

**Решение:**
```typescript
// src/main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}))
```

---

## 📊 Структура базы данных

### Коллекция: users

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "test@example.com",
  "name": "Test User",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "status": "offline",
  "avatar": null,
  "createdAt": ISODate("2024-01-15T10:30:00.000Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00.000Z")
}
```

---

## 🎯 Что дальше?

После завершения этого дня ты умеешь:

1. ✅ Создавать NestJS проекты
2. ✅ Подключать MongoDB через Mongoose
3. ✅ Создавать схемы и модели
4. ✅ Реализовывать регистрацию и логин
5. ✅ Работать с JWT токенами
6. ✅ Хешировать пароли с bcrypt
7. ✅ Валидировать данные с DTO
8. ✅ Защищать маршруты с Guards
9. ✅ Настраивать CORS

**Следующий шаг:** День 2 - Чаты и сообщения! 💬
