# ✅ День 3: Backend Checklist - Chats API

> Чек-лист для отслеживания прогресса реализации Chats API

---

## 📋 Теория (Theory.md)

### 1. Mongoose Relations
- [ ] Понимаю ObjectId тип
- [ ] Понимаю ref связи
- [ ] Понимаю .populate() метод
- [ ] Знаю как исключать поля (напр. `-password`)

### 2. CRUD Operations
- [ ] Понимаю Create (создание)
- [ ] Понимаю Read (чтение)
- [ ] Понимаю Update (обновление)
- [ ] Понимаю Delete (удаление)

### 3. Soft Delete Pattern
- [ ] Понимаю разницу между физическим и soft delete
- [ ] Знаю преимущества soft delete
- [ ] Понимаю isDeleted флаг

### 4. Authorization
- [ ] Понимаю проверку участников чата
- [ ] Знаю когда выбрасывать ForbiddenException
- [ ] Понимаю защиту endpoints через @UseGuards

### 5. Aggregation
- [ ] Понимаю $lookup для JOIN
- [ ] Понимаю aggregation stages ($match, $project, $sort)
- [ ] Знаю разницу между populate и aggregation

---

## 🛠️ Практика (Practice.md)

### Шаг 1: Chat Schema
- [ ] Создал файл `backend/src/modules/chats/schemas/chat.schema.ts`
- [ ] Добавил поле `type` (enum: personal, group, channel)
- [ ] Добавил поле `participants` (массив ObjectId с ref: 'User')
- [ ] Добавил поле `lastMessage` (subdocument, optional)
- [ ] Добавил поле `isDeleted` (boolean, default: false)
- [ ] Добавил `@Schema({ timestamps: true })`
- [ ] Создал индекс на `participants` и `isDeleted`

### Шаг 2: DTOs
- [ ] Создал `backend/src/modules/chats/dto/create-chat.dto.ts`
- [ ] Добавил валидацию `@IsEnum(['personal', 'group', 'channel'])`
- [ ] Добавил валидацию `@IsMongoId()` для participantId
- [ ] Создал `backend/src/modules/chats/dto/update-chat.dto.ts`
- [ ] Добавил опциональное поле `name`

### Шаг 3: ChatsService
- [ ] Создал файл `backend/src/modules/chats/chats.service.ts`
- [ ] Инжектировал `@InjectModel(Chat.name)`
- [ ] Реализовал `getUserChats(userId)` метод
- [ ] Реализовал `createChat(dto, currentUserId)` метод
- [ ] Реализовал `getChatById(chatId, userId)` метод
- [ ] Реализовал `deleteChat(chatId, userId)` метод
- [ ] Реализовал приватный метод `findPersonalChat(user1Id, user2Id)`
- [ ] Добавил `.populate('participants', '-password -refreshToken')`
- [ ] Добавил `.lean()` для оптимизации
- [ ] Добавил проверки authorization (isParticipant)

### Шаг 4: ChatsController
- [ ] Создал файл `backend/src/modules/chats/chats.controller.ts`
- [ ] Добавил `@Controller('chats')`
- [ ] Добавил `@UseGuards(JwtAuthGuard)`
- [ ] Создал endpoint `GET /chats` (getUserChats)
- [ ] Создал endpoint `POST /chats` (createChat)
- [ ] Создал endpoint `GET /chats/:id` (getChatById)
- [ ] Создал endpoint `DELETE /chats/:id` (deleteChat)
- [ ] Использовал `@CurrentUser('userId')` decorator

### Шаг 5: ChatsModule
- [ ] Создал файл `backend/src/modules/chats/chats.module.ts`
- [ ] Импортировал `MongooseModule.forFeature([Chat])`
- [ ] Добавил ChatsController в controllers
- [ ] Добавил ChatsService в providers
- [ ] Экспортировал ChatsService (exports)
- [ ] Зарегистрировал ChatsModule в AppModule

### Шаг 6: Тестирование
- [ ] Backend запускается без ошибок
- [ ] Получил JWT token через /auth/login
- [ ] Тест GET /chats - возвращает массив чатов
- [ ] Тест POST /chats - создаёт новый чат
- [ ] Тест POST /chats (дубликат) - возвращает существующий чат
- [ ] Тест GET /chats/:id - возвращает детали чата
- [ ] Тест DELETE /chats/:id - удаляет чат
- [ ] Проверил populate participants (полные объекты User)
- [ ] Проверил что password и refreshToken не возвращаются

---

## 🧪 Функциональное тестирование

### GET /chats
- [ ] Возвращает только чаты пользователя
- [ ] Не возвращает удалённые чаты (isDeleted: true)
- [ ] Participants подгружены (populate)
- [ ] Сортировка по lastMessage.createdAt DESC
- [ ] Без JWT токена → 401 Unauthorized

### POST /chats
- [ ] Создаёт новый personal чат
- [ ] Валидация: нельзя создать чат с самим собой → 400
- [ ] Проверка дубликата: если personal чат существует → возвращает его
- [ ] Participants подгружены (populate)
- [ ] Валидация DTO работает (type, participantId)
- [ ] Без JWT токена → 401 Unauthorized

### GET /chats/:id
- [ ] Возвращает детали чата
- [ ] Participants подгружены (populate)
- [ ] Authorization: не участник → 403 Forbidden
- [ ] Несуществующий чат → 404 Not Found
- [ ] Без JWT токена → 401 Unauthorized

### DELETE /chats/:id
- [ ] Помечает чат как удалённый (isDeleted: true)
- [ ] Не удаляет физически из БД
- [ ] Authorization: не участник → 403 Forbidden
- [ ] Несуществующий чат → 404 Not Found
- [ ] Без JWT токена → 401 Unauthorized
- [ ] После удаления: GET /chats не возвращает этот чат

### Безопасность
- [ ] password НЕ возвращается в participants
- [ ] refreshToken НЕ возвращается в participants
- [ ] Только участники видят чат (authorization)
- [ ] JWT токен обязателен для всех endpoints

---

## 📦 Структура файлов

### Созданные файлы
- [ ] `backend/src/modules/chats/schemas/chat.schema.ts`
- [ ] `backend/src/modules/chats/dto/create-chat.dto.ts`
- [ ] `backend/src/modules/chats/dto/update-chat.dto.ts`
- [ ] `backend/src/modules/chats/chats.service.ts`
- [ ] `backend/src/modules/chats/chats.controller.ts`
- [ ] `backend/src/modules/chats/chats.module.ts`

### Изменённые файлы
- [ ] `backend/src/app.module.ts` (добавлен ChatsModule)

---

## 🔍 Код Review

### Chat Schema
- [ ] Все поля типизированы
- [ ] enum для `type` поля
- [ ] `participants` - массив ObjectId с ref: 'User'
- [ ] `lastMessage` - subdocument (optional)
- [ ] `isDeleted` - boolean с default: false
- [ ] `timestamps: true` для createdAt/updatedAt
- [ ] Индекс создан

### ChatsService
- [ ] Все методы async
- [ ] Используется @InjectModel
- [ ] populate() везде где нужен User
- [ ] .lean() для оптимизации
- [ ] Authorization checks в getChatById и deleteChat
- [ ] Валидация: нельзя создать чат с самим собой
- [ ] Проверка дубликата personal чата

### ChatsController
- [ ] @UseGuards(JwtAuthGuard) на уровне контроллера
- [ ] @CurrentUser('userId') для получения userId
- [ ] Все endpoints возвращают промисы
- [ ] Используются DTO для валидации

### ChatsModule
- [ ] MongooseModule.forFeature импортирован
- [ ] ChatsService экспортирован
- [ ] Зарегистрирован в AppModule

---

## 🐛 Troubleshooting

### Backend не запускается
- [ ] Проверил `docker-compose logs backend`
- [ ] Проверил что MongoDB запущен (`docker ps`)
- [ ] Проверил что ChatsModule зарегистрирован в AppModule
- [ ] Проверил импорты (нет circular dependencies)

### GET /chats возвращает 401
- [ ] JWT токен передан в Header Authorization
- [ ] Токен валиден (не истёк)
- [ ] JwtAuthGuard правильно настроен

### GET /chats возвращает пустой массив
- [ ] Чаты созданы в БД (проверь MongoDB Compass)
- [ ] userId правильно извлекается из JWT
- [ ] isDeleted: false для чатов

### POST /chats возвращает ошибку валидации
- [ ] type - один из: personal, group, channel
- [ ] participantId - валидный MongoDB ObjectId
- [ ] Тело запроса JSON (Content-Type: application/json)

### Populate не работает (participants - массив IDs)
- [ ] ref: 'User' указан в схеме
- [ ] .populate('participants') вызван
- [ ] User model зарегистрирован в MongoDB

---

## ✅ Критерии завершения

День 3 Backend считается завершённым когда:

### Основное
- [ ] Chat Schema создана и индексирована
- [ ] DTOs созданы с валидацией
- [ ] ChatsService реализован полностью
- [ ] ChatsController реализован полностью
- [ ] ChatsModule зарегистрирован
- [ ] Backend запускается без ошибок

### Функциональность
- [ ] GET /chats возвращает чаты пользователя
- [ ] POST /chats создаёт новый чат
- [ ] POST /chats (дубликат) возвращает существующий
- [ ] GET /chats/:id возвращает детали чата
- [ ] DELETE /chats/:id удаляет чат (soft delete)
- [ ] Populate participants работает
- [ ] Authorization проверяет участников
- [ ] Soft delete работает (isDeleted флаг)

### Качество
- [ ] Код следует PATTERNS_CHECKLIST.md
- [ ] Нет чувствительных данных в ответах (password, refreshToken)
- [ ] Валидация работает (DTO)
- [ ] Ошибки обрабатываются (try-catch, исключения)
- [ ] Индексы созданы для оптимизации

### Документация
- [ ] Все чек-листы заполнены
- [ ] Понимаю каждую строку кода
- [ ] Могу объяснить как работает система

---

## 🎉 Поздравляем!

Если все пункты отмечены, ты завершил Backend часть Дня 3!

**Следующий шаг:** [Frontend_Implementation](../Frontend_Implementation/) - создание UI для списка чатов

---

**Время выполнения:** ~4-5 часов
