# 📦 DTO Pattern - Data Transfer Object

## Что такое DTO?

**DTO** (Data Transfer Object) - это объект для передачи данных между слоями приложения.

**Простыми словами**: DTO - это **контракт**, который определяет какие данные можно отправлять и получать.

---

## 🎯 Зачем нужны DTO?

### 1. Валидация входящих данных

```typescript
// БЕЗ DTO (плохо):
@Post('register')
async register(@Body() body: any) {  // any - опасно!
  // body может быть чем угодно:
  // { random: "data" }
  // { email: 12345 }
  // { hack: "sql injection" }
  
  // Нужно вручную проверять:
  if (!body.email || typeof body.email !== 'string') {
    throw new Error('Invalid email')
  }
  // ...
}
```

```typescript
// С DTO (хорошо):
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  // registerDto уже провалидирован!
  // Гарантированно содержит: name (string), email (string), password (string)
  // Если данные невалидны → автоматически 400 Bad Request
}
```

### 2. Типобезопасность (TypeScript)

```typescript
// БЕЗ DTO:
async register(data: any) {
  const email = data.email  // any - нет автодополнения, нет проверки типов
  const password = data.password  // Может быть undefined
}

// С DTO:
async register(registerDto: RegisterDto) {
  const email = registerDto.email  // string - есть автодополнение!
  const password = registerDto.password  // string - гарантированно
}
```

### 3. Автодокументация API

```typescript
// RegisterDto сам документирует API:
export class RegisterDto {
  @IsString()
  name: string  // ← Ясно что требуется name типа string

  @IsEmail()
  email: string  // ← Ясно что требуется валидный email

  @MinLength(6)
  password: string  // ← Ясно что пароль минимум 6 символов
}

// Другой разработчик сразу видит что нужно отправлять!
```

### 4. Разделение ответственности

```typescript
// DTO - только для транспорта данных (никакой логики!)
export class RegisterDto {
  name: string
  email: string
  password: string
  // Только данные, никаких методов
}

// Бизнес-логика - в Service
export class AuthService {
  async register(registerDto: RegisterDto) {
    // Логика регистрации
  }
}
```

---

## 🏗️ Структура DTO в нашем проекте

### RegisterDto - Регистрация

```typescript
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString({ message: 'Имя должно быть строкой' })
  name: string

  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Неверный формат email' })
  email: string

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  password: string
}
```

**Декораторы валидации**:
- `@IsNotEmpty()` - не может быть пустым
- `@IsString()` - должно быть строкой
- `@IsEmail()` - должен быть валидным email
- `@MinLength(n)` - минимальная длина

### LoginDto - Вход

```typescript
import { IsEmail, IsString, IsNotEmpty } from 'class-validator'

export class LoginDto {
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Неверный формат email' })
  email: string

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  password: string
  // Не проверяем MinLength при входе (пользователь уже зарегистрирован)
}
```

---

## 🔍 Как работает валидация

### 1. Клиент отправляет данные:

```json
POST /auth/register
{
  "name": "John",
  "email": "invalid-email",
  "password": "12345"
}
```

### 2. NestJS получает данные:

```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  // ...
}
```

### 3. class-validator проверяет:

```
✅ name: "John" - IsNotEmpty ✓, IsString ✓
❌ email: "invalid-email" - IsNotEmpty ✓, IsEmail ✗ (невалидный формат)
❌ password: "12345" - IsNotEmpty ✓, IsString ✓, MinLength(6) ✗ (только 5 символов)
```

### 4. Если валидация НЕ прошла → 400 Bad Request:

```json
{
  "message": [
    "Неверный формат email",
    "Пароль должен быть минимум 6 символов"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 5. Если валидация прошла → выполняется метод:

```typescript
async register(registerDto: RegisterDto) {
  // registerDto гарантированно валиден!
  const { name, email, password } = registerDto
  // ...
}
```

---

## 📚 Популярные декораторы class-validator

### Строки:

```typescript
@IsString()              // Должна быть строкой
@IsNotEmpty()            // Не может быть пустой
@MinLength(6)            // Минимальная длина
@MaxLength(100)          // Максимальная длина
@Length(6, 20)           // Длина от 6 до 20
@Matches(/^[a-zA-Z]+$/)  // Regex паттерн
```

### Email и URL:

```typescript
@IsEmail()               // Валидный email
@IsUrl()                 // Валидный URL
```

### Числа:

```typescript
@IsNumber()              // Должно быть числом
@IsInt()                 // Должно быть целым числом
@Min(0)                  // Минимальное значение
@Max(100)                // Максимальное значение
@IsPositive()            // Положительное число
```

### Булевы значения:

```typescript
@IsBoolean()             // Должно быть true/false
```

### Массивы:

```typescript
@IsArray()               // Должен быть массивом
@ArrayMinSize(1)         // Минимум элементов
@ArrayMaxSize(10)        // Максимум элементов
```

### Опциональные поля:

```typescript
@IsOptional()            // Поле необязательно
@IsString()
avatar?: string          // Может отсутствовать
```

### Enum:

```typescript
@IsEnum(UserStatus)      // Значение из enum
status: UserStatus
```

---

## 🎨 Расширенные примеры DTO

### Пример 1: DTO с опциональными полями

```typescript
export class UpdateUserDto {
  @IsOptional()  // Необязательное
  @IsString()
  name?: string

  @IsOptional()
  @IsUrl()
  avatar?: string

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus
}
```

### Пример 2: DTO с вложенными объектами

```typescript
class AddressDto {
  @IsString()
  street: string

  @IsString()
  city: string
}

export class CreateUserDto {
  @IsString()
  name: string

  @ValidateNested()  // Валидировать вложенный объект
  @Type(() => AddressDto)
  address: AddressDto
}
```

### Пример 3: DTO с кастомной валидацией

```typescript
import { registerDecorator, ValidationOptions } from 'class-validator'

// Кастомный декоратор
function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Проверка: минимум 1 буква, 1 цифра, 1 спецсимвол
          return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(value)
        },
      },
    })
  }
}

export class RegisterDto {
  @IsStrongPassword({ message: 'Пароль должен содержать буквы, цифры и спецсимволы' })
  password: string
}
```

---

## 🔄 DTO vs Entity vs Interface

### Entity (модель БД):

```typescript
// user.schema.ts
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  password: string  // Хеш пароля в БД

  @Prop()
  avatar?: string

  @Prop({ enum: Object.values(UserStatus) })
  status?: UserStatus
}
```

**Зачем**: Определяет структуру документа в MongoDB

### DTO (транспорт данных):

```typescript
// register.dto.ts
export class RegisterDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @MinLength(6)
  password: string  // Plain text от клиента
}
```

**Зачем**: Валидация данных от клиента

### Interface (TypeScript тип):

```typescript
// user.interface.ts
export interface IUser {
  _id: string
  name: string
  email: string
  avatar?: string
  status: UserStatus
}
```

**Зачем**: Типизация для TypeScript (компилируется в ничто)

---

## 🛡️ Безопасность через DTO

### 1. Защита от лишних полей

```typescript
// Клиент отправляет:
{
  "name": "John",
  "email": "john@example.com",
  "password": "secret",
  "isAdmin": true  // ← Попытка взлома!
}

// DTO пропускает только разрешённые поля:
export class RegisterDto {
  name: string
  email: string
  password: string
  // isAdmin нет в DTO → игнорируется
}
```

### 2. Защита от SQL/NoSQL injection

```typescript
// Клиент отправляет:
{
  "email": { "$ne": null }  // ← NoSQL injection попытка
}

// DTO валидирует тип:
@IsEmail()  // ← Должен быть string, объект отклоняется!
email: string
```

### 3. Sanitization (очистка данных)

```typescript
import { Transform } from 'class-transformer'

export class RegisterDto {
  @Transform(({ value }) => value.trim())  // Убрать пробелы
  @IsEmail()
  email: string

  @Transform(({ value }) => value.trim())
  @MinLength(6)
  password: string
}
```

---

## 📝 Резюме

**DTO - это**:
- ✅ Контракт для передачи данных
- ✅ Автоматическая валидация (class-validator)
- ✅ Типобезопасность (TypeScript)
- ✅ Автодокументация API
- ✅ Безопасность (защита от невалидных данных)

**Как создать DTO**:
1. Создать класс (не interface!)
2. Добавить поля с типами
3. Добавить декораторы валидации
4. Использовать в `@Body()` контроллера

**Best Practices**:
- Один DTO на один endpoint/действие
- DTO только для данных (никакой логики)
- Всегда валидировать входящие данные
- Использовать говорящие имена (RegisterDto, LoginDto, UpdateUserDto)

**Следующий шаг**: Изучите `auth.service.ts` - как используются DTO в бизнес-логике!
