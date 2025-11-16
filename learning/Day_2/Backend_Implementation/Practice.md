# 🛠️ День 2: Backend Practice - User Search API

> Пошаговая реализация API для глобального поиска пользователей

---

## 🎯 Что будем делать

1. Создать SearchUsersDto (DTO для валидации)
2. Добавить метод searchUsers() в UsersService
3. Добавить endpoint GET /users/search в UsersController
4. Настроить MongoDB text indexes
5. Протестировать API

**Время:** 2-3 часа

---

## Шаг 1: Создать SearchUsersDto

### 1.1 Создать файл

```bash
mkdir -p backend/src/modules/users/dto
touch backend/src/modules/users/dto/search-users.dto.ts
```

### 1.2 Написать DTO

```typescript
// backend/src/modules/users/dto/search-users.dto.ts

import { IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchUsersDto {
  @IsString()
  @MinLength(2, { message: 'Query must be at least 2 characters' })
  query: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0
}
```

**Что делает:**
- `query` - поисковый запрос (минимум 2 символа)
- `limit` - количество результатов (default: 10)
- `skip` - пропустить N результатов (default: 0)
- `@Type(() => Number)` - преобразует string в number (query params всегда string)

---

## Шаг 2: Добавить метод searchUsers() в UsersService

### 2.1 Открыть файл

```bash
# Файл уже существует после Дня 1
backend/src/modules/users/users.service.ts
```

### 2.2 Добавить импорты

```typescript
// backend/src/modules/users/users.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { SearchUsersDto } from './dto/search-users.dto'; // ← Добавь
```

### 2.3 Добавить метод searchUsers()

Добавь этот метод в класс `UsersService`:

```typescript
// backend/src/modules/users/users.service.ts

async searchUsers(currentUserId: string, dto: SearchUsersDto) {
  const { query, limit = 10, skip = 0 } = dto

  // Проверка query (дополнительная валидация)
  if (!query || query.trim().length < 2) {
    throw new BadRequestException('Query must be at least 2 characters')
  }

  // Построение поискового запроса
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { userId: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
    _id: { $ne: currentUserId }, // Исключаем текущего пользователя
  }

  // Параллельные запросы для оптимизации
  const [users, total] = await Promise.all([
    this.userModel
      .find(searchQuery)
      .select('-password -refreshToken') // Исключаем чувствительные данные
      .limit(limit)
      .skip(skip)
      .lean() // Возвращает plain objects (быстрее)
      .exec(),
    this.userModel.countDocuments(searchQuery),
  ])

  return {
    users,
    total,
    hasMore: skip + users.length < total,
  }
}
```

**Объяснение:**

1. **Деструктуризация и defaults:**
   ```typescript
   const { query, limit = 10, skip = 0 } = dto
   ```

2. **$or для поиска по нескольким полям:**
   ```typescript
   $or: [
     { name: { $regex: query, $options: 'i' } },
     { userId: { $regex: query, $options: 'i' } },
     { email: { $regex: query, $options: 'i' } },
   ]
   ```

3. **$ne для исключения текущего пользователя:**
   ```typescript
   _id: { $ne: currentUserId }
   ```

4. **Promise.all для параллельных запросов:**
   ```typescript
   const [users, total] = await Promise.all([
     this.userModel.find(...),
     this.userModel.countDocuments(...),
   ])
   ```

5. **hasMore для фронтенда:**
   ```typescript
   hasMore: skip + users.length < total
   ```

---

## Шаг 3: Добавить endpoint в UsersController

### 3.1 Открыть файл

```bash
backend/src/modules/users/users.controller.ts
```

### 3.2 Добавить импорты

```typescript
// backend/src/modules/users/users.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { SearchUsersDto } from './dto/search-users.dto'; // ← Добавь
```

### 3.3 Добавить endpoint GET /users/search

Добавь этот метод в класс `UsersController`:

```typescript
// backend/src/modules/users/users.controller.ts

@Get('search')
@UseGuards(JwtAuthGuard)
async searchUsers(
  @CurrentUser('userId') userId: string,
  @Query() dto: SearchUsersDto,
) {
  return this.usersService.searchUsers(userId, dto)
}
```

**Объяснение:**

- `@Get('search')` - GET запрос на `/users/search`
- `@UseGuards(JwtAuthGuard)` - требует JWT токен
- `@CurrentUser('userId')` - извлекает userId из токена
- `@Query() dto: SearchUsersDto` - валидирует query параметры через DTO

**Полный путь:** `GET http://localhost:4000/api/users/search`

---

## Шаг 4: Настроить MongoDB Text Indexes

### 4.1 Открыть файл user.schema.ts

```bash
backend/src/modules/users/schemas/user.schema.ts
```

### 4.2 Добавить indexes ПОСЛЕ схемы

Найди строку:
```typescript
export const UserSchema = SchemaFactory.createForClass(User)
```

И добавь ПОСЛЕ неё:

```typescript
// backend/src/modules/users/schemas/user.schema.ts

export const UserSchema = SchemaFactory.createForClass(User)

// ✅ Создаём text indexes для быстрого поиска
UserSchema.index({ name: 'text', userId: 'text', email: 'text' })
```

**Зачем:**
- Оптимизирует поиск по полям name, userId, email
- Ускоряет запросы с $regex
- MongoDB использует B-Tree вместо Collection Scan

### 4.3 Перезапустить Backend

```bash
# Остановить контейнер
docker-compose down

# Запустить снова
docker-compose up -d

# Проверить логи
docker-compose logs backend
```

**Важно:** Indexes создаются при запуске приложения!

---

## Шаг 5: Тестирование API

### 5.1 Получить JWT токен

Сначала залогинься, чтобы получить токен:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Скопируй `access_token`!

### 5.2 Тест 1: Простой поиск

```bash
curl "http://localhost:4000/api/users/search?query=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "john1234",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### 5.3 Тест 2: С пагинацией

```bash
curl "http://localhost:4000/api/users/search?query=test&limit=5&skip=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.4 Тест 3: Поиск по email

```bash
curl "http://localhost:4000/api/users/search?query=@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.5 Тест 4: Короткий запрос (должен вернуть ошибку)

```bash
curl "http://localhost:4000/api/users/search?query=a" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ожидаемый ответ (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": ["Query must be at least 2 characters"],
  "error": "Bad Request"
}
```

### 5.6 Тест 5: Без токена (должен вернуть 401)

```bash
curl "http://localhost:4000/api/users/search?query=john"
```

**Ожидаемый ответ (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Шаг 6: Проверка индексов в MongoDB Compass

### 6.1 Открыть MongoDB Compass

1. Запусти MongoDB Compass
2. Подключись к: `mongodb://localhost:27017`
3. Выбери БД: `icore`
4. Выбери коллекцию: `users`

### 6.2 Проверить Indexes

1. Перейди на таб **"Indexes"**
2. Должен быть индекс: `name_text_userId_text_email_text`

**Если индекса нет:**
```bash
# Перезапусти Backend
docker-compose restart backend

# Проверь логи
docker-compose logs backend | grep -i index
```

---

## Шаг 7: Тестирование через Postman

### 7.1 Создать коллекцию

1. Открой Postman
2. Создай новую Collection: "iCore API"

### 7.2 Создать запрос

**GET** `http://localhost:4000/api/users/search`

**Query Params:**
- `query`: `john`
- `limit`: `10`
- `skip`: `0`

**Headers:**
- `Authorization`: `Bearer YOUR_TOKEN`

**Send!**

---

## ✅ Чек-лист завершения

### Код
- [ ] SearchUsersDto создан в `backend/src/modules/users/dto/search-users.dto.ts`
- [ ] UsersService.searchUsers() метод добавлен
- [ ] UsersController GET /users/search endpoint добавлен
- [ ] MongoDB text indexes настроены в user.schema.ts
- [ ] Backend перезапущен

### Тестирование
- [ ] Простой поиск работает
- [ ] Pagination работает (limit, skip)
- [ ] Поиск по name работает
- [ ] Поиск по userId работает
- [ ] Поиск по email работает
- [ ] Валидация работает (минимум 2 символа)
- [ ] Текущий пользователь исключён из результатов
- [ ] total и hasMore возвращаются корректно
- [ ] Индексы созданы (MongoDB Compass)

---

## 🐛 Troubleshooting

### "Cannot find users"
**Проблема:** MongoDB не находит пользователей

**Решения:**
1. Проверь что пользователи существуют в БД (MongoDB Compass)
2. Проверь что indexes созданы
3. Проверь query (минимум 2 символа)
4. Проверь логи: `docker-compose logs backend`

### "Query must be at least 2 characters"
**Проблема:** Отправляешь слишком короткий запрос

**Решение:** Отправь query длиной ≥2 символов

### "Unauthorized"
**Проблема:** Нет JWT токена или токен невалидный

**Решения:**
1. Залогинься через `/auth/login`
2. Скопируй `access_token`
3. Добавь Header: `Authorization: Bearer YOUR_TOKEN`

### Indexes не создаются
**Проблема:** MongoDB не создаёт indexes

**Решения:**
1. Проверь что `UserSchema.index(...)` написан ПОСЛЕ `SchemaFactory.createForClass()`
2. Перезапусти Backend: `docker-compose restart backend`
3. Проверь логи: `docker-compose logs backend | grep -i index`
4. Удали старую коллекцию и создай заново

---

## 📚 Резюме

### Что создали:

1. **SearchUsersDto** - валидация query параметров
   - query (минимум 2 символа)
   - limit (опционально, default: 10)
   - skip (опционально, default: 0)

2. **UsersService.searchUsers()** - бизнес-логика
   - Поиск по name, userId, email
   - Исключение текущего пользователя
   - Pagination
   - Параллельные запросы

3. **UsersController GET /users/search** - HTTP endpoint
   - Защищён JwtAuthGuard
   - Валидация через DTO
   - Возвращает { users, total, hasMore }

4. **MongoDB Text Indexes** - оптимизация
   - Индекс на name, userId, email
   - Ускоряет поиск

---

**Следующий шаг:** [Checklist.md](./Checklist.md) - проверь что всё сделано правильно!
