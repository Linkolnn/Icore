# 🧪 Testing Guide - Как протестировать Backend API

Быстрая справка для тестирования Auth endpoints.

---

## 🛠️ Инструменты для тестирования

### Вариант 1: cURL (командная строка)

Самый простой способ - прямо из терминала.

### Вариант 2: Thunder Client (VS Code)

Расширение для VS Code (аналог Postman).

### Вариант 3: Postman

Популярный инструмент для тестирования API.

---

## 📋 Тесты

### ✅ Тест 1: Регистрация нового пользователя

**cURL**:
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Ожидаемый результат**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "avatar": null,
    "status": "offline"
  }
}
```

**Сохраните `access_token` для следующих тестов!**

---

### ✅ Тест 2: Вход существующего пользователя

**cURL**:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Ожидаемый результат**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "avatar": null,
    "status": "offline"
  }
}
```

---

### ✅ Тест 3: Получить профиль (требует токен)

**cURL** (замените YOUR_TOKEN на ваш токен):
```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Пример с реальным токеном**:
```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NzMyNjUxZGQ0YzE3Mjg5YjA0NmU5ZmIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MzEzNDQ2MDUsImV4cCI6MTczMTk0OTQwNX0.lH5xqXQMmF3wKYO8VsVkHqGHJME9J_PQc0fCGxgLk8A"
```

**Ожидаемый результат**:
```json
{
  "_id": "...",
  "name": "Test User",
  "email": "test@example.com",
  "avatar": null,
  "status": "offline",
  "createdAt": "2025-11-11T14:30:05.000Z",
  "updatedAt": "2025-11-11T14:30:05.000Z"
}
```

---

## ❌ Тесты на ошибки

### Тест 4: Регистрация с существующим email (409 Conflict)

```bash
# Попробуйте зарегистрировать того же пользователя дважды
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Ожидаемая ошибка** (409):
```json
{
  "message": "Пользователь с таким email уже существует",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### Тест 5: Вход с неверным паролем (401 Unauthorized)

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrong_password"
  }'
```

**Ожидаемая ошибка** (401):
```json
{
  "message": "Неверный email или пароль",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### Тест 6: Невалидный email (400 Bad Request)

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "not-an-email",
    "password": "test123456"
  }'
```

**Ожидаемая ошибка** (400):
```json
{
  "message": ["Неверный формат email"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### Тест 7: Короткий пароль (400 Bad Request)

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "new@example.com",
    "password": "12345"
  }'
```

**Ожидаемая ошибка** (400):
```json
{
  "message": ["Пароль должен быть минимум 6 символов"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### Тест 8: Профиль без токена (401 Unauthorized)

```bash
curl -X GET http://localhost:3001/auth/profile
# Нет заголовка Authorization
```

**Ожидаемая ошибка** (401):
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

### Тест 9: Профиль с невалидным токеном (401 Unauthorized)

```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer invalid_token_here"
```

**Ожидаемая ошибка** (401):
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

## 🎯 Thunder Client (VS Code)

### Установка:

1. Откройте VS Code
2. Extensions (Ctrl+Shift+X)
3. Найдите "Thunder Client"
4. Install

### Создание запросов:

**1. Регистрация**:
```
Method: POST
URL: http://localhost:3001/auth/register
Headers:
  Content-Type: application/json
Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123456"
}
```

**2. Сохранение токена**:
- После получения ответа с `access_token`
- Создайте Environment variable: `token = <your_token>`

**3. Профиль**:
```
Method: GET
URL: http://localhost:3001/auth/profile
Headers:
  Authorization: Bearer {{token}}
```

---

## 📊 Проверка MongoDB

### Посмотреть созданных пользователей:

```bash
# Подключиться к MongoDB контейнеру
docker-compose exec mongodb mongosh -u admin -p password123

# В MongoDB shell:
use icore
db.users.find().pretty()

# Должны увидеть:
# {
#   "_id": ObjectId("..."),
#   "name": "Test User",
#   "email": "test@example.com",
#   "password": "$2b$10$...",  // Хеш, не plain text!
#   "status": "offline",
#   "createdAt": ISODate("..."),
#   "updatedAt": ISODate("...")
# }

# Выйти
exit
```

---

## ✅ Чек-лист тестирования

- [ ] Регистрация с валидными данными → 201, получен токен
- [ ] Регистрация с существующим email → 409 Conflict
- [ ] Регистрация с невалидным email → 400 Bad Request
- [ ] Регистрация с коротким паролем → 400 Bad Request
- [ ] Вход с правильными данными → 200, получен токен
- [ ] Вход с неверным паролем → 401 Unauthorized
- [ ] Профиль с валидным токеном → 200, данные пользователя
- [ ] Профиль без токена → 401 Unauthorized
- [ ] Профиль с невалидным токеном → 401 Unauthorized
- [ ] Пароль в БД захеширован (начинается с $2b$10$)

---

## 🎊 Готово!

Если все тесты прошли успешно - **Backend Auth система работает!** ✅

**Следующий шаг**: Можно начинать разработку Frontend!
