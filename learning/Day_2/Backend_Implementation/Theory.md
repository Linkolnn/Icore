# 📖 День 2: Backend Theory - User Search API

> Теория для создания глобального поиска пользователей

---

## 🎯 Что изучим

1. MongoDB Query Builder ($regex, $or, $ne)
2. MongoDB Text Indexes
3. Pagination (offset-based)
4. DTO Validation (query parameters)
5. Service Layer Pattern
6. Error Handling

---

## 1. MongoDB Query Builder

### Базовые операторы

MongoDB предоставляет мощные операторы для построения запросов:

#### $regex - Поиск по регулярному выражению

```typescript
// Найти всех пользователей с "john" в имени (регистронезависимый)
{
  name: { $regex: 'john', $options: 'i' }
}
```

**Опции $regex:**
- `i` - case-insensitive (игнорирует регистр)
- `m` - multiline
- `s` - dotall
- `x` - extended

**Пример:**
```typescript
const users = await this.userModel.find({
  name: { $regex: 'john', $options: 'i' }
})
// Найдёт: "John", "john", "Johnny", "JOHN DOE"
```

#### $or - Логическое ИЛИ

```typescript
// Найти пользователей где name ИЛИ email содержат "test"
{
  $or: [
    { name: { $regex: 'test', $options: 'i' } },
    { email: { $regex: 'test', $options: 'i' } }
  ]
}
```

**Когда использовать:**
- Поиск по нескольким полям
- Сложные условия

**Пример в нашем проекте:**
```typescript
const searchQuery = {
  $or: [
    { name: { $regex: query, $options: 'i' } },
    { userId: { $regex: query, $options: 'i' } },
    { email: { $regex: query, $options: 'i' } },
  ]
}
```

#### $ne - Not Equal (не равно)

```typescript
// Найти всех пользователей КРОМЕ текущего
{
  _id: { $ne: currentUserId }
}
```

**Когда использовать:**
- Исключение определённых записей
- Фильтрация

**Пример:**
```typescript
const users = await this.userModel.find({
  _id: { $ne: currentUserId }, // Исключаем себя
  name: { $regex: query, $options: 'i' }
})
```

### Комбинирование операторов

Можно комбинировать несколько операторов:

```typescript
const searchQuery = {
  $or: [
    { name: { $regex: query, $options: 'i' } },
    { userId: { $regex: query, $options: 'i' } },
    { email: { $regex: query, $options: 'i' } },
  ],
  _id: { $ne: currentUserId }, // И исключаем текущего пользователя
}

const users = await this.userModel.find(searchQuery)
```

---

## 2. MongoDB Text Indexes

### Зачем нужны индексы?

Без индексов MongoDB сканирует ВСЮ коллекцию (Collection Scan):

```typescript
// БЕЗ индекса - медленно O(n)
db.users.find({ name: { $regex: 'john', $options: 'i' } })
// MongoDB проверяет ВСЕ 1,000,000 документов
```

С индексом MongoDB использует B-Tree для быстрого поиска:

```typescript
// С индексом - быстро O(log n)
db.users.find({ name: { $regex: 'john', $options: 'i' } })
// MongoDB проверяет ~20-30 документов через B-Tree
```

### Text Index для полнотекстового поиска

**Text Index** - специальный тип индекса для полнотекстового поиска:

```typescript
// Создание text index
UserSchema.index({ name: 'text', userId: 'text', email: 'text' })
```

**Преимущества:**
- Быстрый поиск по нескольким полям одновременно
- Поддержка stemming (основы слов)
- Поддержка stop words (игнорирование частых слов)
- Поддержка языков

**Пример использования:**
```typescript
// С $text оператором (использует text index)
const users = await this.userModel.find({
  $text: { $search: query },
  _id: { $ne: currentUserId }
})
```

**Альтернатива (наш подход):**
Мы используем обычный $regex вместо $text, потому что:
- $regex даёт больше контроля
- $regex работает с частичными совпадениями ("joh" найдёт "john")
- $text требует полные слова

Но создаём text indexes для оптимизации:
```typescript
UserSchema.index({ name: 'text', userId: 'text', email: 'text' })
```

### Как создать индексы в Mongoose

```typescript
// В user.schema.ts ПОСЛЕ определения схемы
@Schema({ timestamps: true })
export class User extends Document {
  // ... поля
}

export const UserSchema = SchemaFactory.createForClass(User)

// ✅ Создаём text indexes
UserSchema.index({ name: 'text', userId: 'text', email: 'text' })
```

### Проверка индексов

**В MongoDB Compass:**
1. Открой коллекцию `users`
2. Перейди на таб "Indexes"
3. Должен быть индекс: `name_text_userId_text_email_text`

**Через MongoDB Shell:**
```javascript
db.users.getIndexes()
```

---

## 3. Pagination (offset-based)

### Зачем нужна пагинация?

Представь 10,000 пользователей с именем "John":

```typescript
// БЕЗ пагинации - ПЛОХО!
const users = await this.userModel.find({ name: /john/i })
// Вернёт ВСЕ 10,000 пользователей
// - Долго загружается
// - Огромный размер ответа
// - Браузер может зависнуть
```

```typescript
// С пагинацией - ХОРОШО!
const users = await this.userModel
  .find({ name: /john/i })
  .limit(10) // Только 10 первых
  .skip(0)
// Вернёт только 10 пользователей
```

### Offset-based Pagination

**Параметры:**
- `limit` - сколько записей вернуть
- `skip` - сколько записей пропустить

**Формула для страниц:**
```typescript
const page = 1 // Текущая страница (начинается с 1)
const limit = 10 // Элементов на странице

const skip = (page - 1) * limit
// Страница 1: skip = 0
// Страница 2: skip = 10
// Страница 3: skip = 20
```

**Реализация:**
```typescript
async searchUsers(query: string, limit: number, skip: number) {
  // 1. Запрос пользователей с пагинацией
  const users = await this.userModel
    .find({ name: { $regex: query, $options: 'i' } })
    .limit(limit)
    .skip(skip)
    .exec()

  // 2. Общее количество (для вычисления страниц)
  const total = await this.userModel
    .countDocuments({ name: { $regex: query, $options: 'i' } })

  // 3. Есть ли ещё результаты?
  const hasMore = skip + users.length < total

  return { users, total, hasMore }
}
```

**Оптимизация с Promise.all:**
```typescript
// ❌ Последовательно (медленно)
const users = await this.userModel.find(query).limit(limit).skip(skip)
const total = await this.userModel.countDocuments(query)
// Время: T1 + T2

// ✅ Параллельно (быстро)
const [users, total] = await Promise.all([
  this.userModel.find(query).limit(limit).skip(skip),
  this.userModel.countDocuments(query),
])
// Время: max(T1, T2)
```

### Метаданные пагинации

Всегда возвращай метаданные клиенту:

```typescript
{
  users: User[],      // Результаты
  total: number,      // Общее количество
  hasMore: boolean,   // Есть ли ещё?
}
```

**Frontend использует:**
- `total` - показать "Найдено 42 пользователя"
- `hasMore` - показать/скрыть кнопку "Загрузить ещё"

---

## 4. DTO Validation (Query Parameters)

### Зачем нужна валидация?

**Без валидации (опасно):**
```typescript
// Пользователь отправляет:
GET /users/search?query=a&limit=-100

// Backend пытается:
await this.userModel.find(...).limit(-100) // ❌ Ошибка!
```

**С валидацией (безопасно):**
```typescript
// DTO валидирует и отклоняет некорректные данные
GET /users/search?query=a&limit=-100
// Ответ: 400 Bad Request
// { "message": "limit must be positive" }
```

### Query Parameters DTO

В NestJS query параметры валидируются через DTO:

```typescript
import { IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchUsersDto {
  // Query string (минимум 2 символа)
  @IsString()
  @MinLength(2, { message: 'Минимум 2 символа для поиска' })
  query: string

  // Limit (опционально, default: 10)
  @IsOptional()
  @Type(() => Number) // Преобразуй string в number
  @IsInt()
  @Min(1)
  limit?: number = 10

  // Skip (опционально, default: 0)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0
}
```

**Важно:**
- `@Type(() => Number)` - преобразует string в number (query параметры всегда string)
- `@IsOptional()` - поле необязательно
- `= 10` - default значение если не передано

### Использование в контроллере

```typescript
@Get('search')
@UseGuards(JwtAuthGuard)
async searchUsers(
  @CurrentUser('userId') userId: string,
  @Query() dto: SearchUsersDto, // DTO автоматически валидирует
) {
  return this.usersService.searchUsers(userId, dto)
}
```

**Что происходит:**
1. NestJS получает query параметры: `?query=john&limit=5`
2. Преобразует в объект: `{ query: "john", limit: "5" }`
3. Применяет `@Type(() => Number)`: `{ query: "john", limit: 5 }`
4. Валидирует через class-validator
5. Если валидация прошла → вызывает метод
6. Если валидация НЕ прошла → возвращает 400 Bad Request

---

## 5. Service Layer Pattern

### Архитектура слоёв

```
┌──────────────────┐
│   Controller     │ ← HTTP входная точка
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│    Service       │ ← Бизнес-логика
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│   Repository     │ ← Работа с БД (Mongoose)
└──────────────────┘
```

### Зачем разделять?

**❌ Плохо (всё в контроллере):**
```typescript
@Get('search')
async searchUsers(@Query('query') query: string) {
  // Валидация
  if (query.length < 2) throw new BadRequestException()

  // Поиск
  const users = await this.userModel.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { userId: { $regex: query, $options: 'i' } },
    ]
  })

  // Преобразование
  return users.map(u => ({ ...u, password: undefined }))
}
```

Проблемы:
- Сложно тестировать
- Нельзя переиспользовать логику
- Нарушает Single Responsibility Principle

**✅ Хорошо (Service Layer):**
```typescript
// Controller - только HTTP
@Get('search')
async searchUsers(
  @CurrentUser('userId') userId: string,
  @Query() dto: SearchUsersDto,
) {
  return this.usersService.searchUsers(userId, dto)
}

// Service - бизнес-логика
async searchUsers(currentUserId: string, dto: SearchUsersDto) {
  const { query, limit, skip } = dto

  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { userId: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
    _id: { $ne: currentUserId },
  }

  const [users, total] = await Promise.all([
    this.userModel
      .find(searchQuery)
      .select('-password -refreshToken')
      .limit(limit)
      .skip(skip)
      .lean()
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

Преимущества:
- Легко тестировать сервис отдельно
- Можно вызывать из других мест
- Читаемый контроллер
- Соблюдается SOLID

---

## 6. Error Handling

### Типы ошибок в поиске

1. **Validation Error** - некорректные параметры
2. **Database Error** - проблема с MongoDB
3. **Authorization Error** - пользователь не авторизован

### Обработка в Service

```typescript
async searchUsers(currentUserId: string, dto: SearchUsersDto) {
  try {
    const { query, limit, skip } = dto

    // Проверка параметров (дополнительная)
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Query must be at least 2 characters')
    }

    // Поиск
    const [users, total] = await Promise.all([
      this.userModel.find(searchQuery).limit(limit).skip(skip),
      this.userModel.countDocuments(searchQuery),
    ])

    return { users, total, hasMore: skip + users.length < total }

  } catch (error) {
    // Логирование
    this.logger.error(`Search users failed: ${error.message}`, error.stack)

    // Если это уже HTTP exception - пробросить
    if (error instanceof HttpException) {
      throw error
    }

    // Иначе вернуть 500
    throw new InternalServerErrorException('Failed to search users')
  }
}
```

### HTTP Status Codes

- `200 OK` - успешно найдено (даже если 0 результатов)
- `400 Bad Request` - некорректные параметры
- `401 Unauthorized` - нет токена
- `500 Internal Server Error` - ошибка сервера/БД

---

## 📚 Резюме

### Что изучили:

1. **MongoDB Query Builder**
   - `$regex` для поиска по паттерну
   - `$or` для поиска по нескольким полям
   - `$ne` для исключения записей

2. **MongoDB Text Indexes**
   - Зачем нужны индексы (O(log n) vs O(n))
   - Как создавать text indexes
   - Как проверять индексы

3. **Pagination**
   - Offset-based с `limit` и `skip`
   - Метаданные `total` и `hasMore`
   - Оптимизация с `Promise.all`

4. **DTO Validation**
   - class-validator для query параметров
   - `@Type(() => Number)` для преобразования
   - Default значения

5. **Service Layer Pattern**
   - Разделение Controller/Service/Repository
   - Преимущества архитектуры
   - Читаемость и тестируемость

6. **Error Handling**
   - Типы ошибок
   - Обработка в Service
   - HTTP Status Codes

---

**Следующий шаг:** [Practice.md](./Practice.md) - применяем теорию на практике!
