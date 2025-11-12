# 💉 Dependency Injection (DI) - Внедрение зависимостей

## Что такое DI?

**Dependency Injection** - это паттерн, при котором класс **НЕ создаёт** свои зависимости сам, а **получает их извне**.

**Простыми словами**: Вместо того чтобы класс сам покупал себе инструменты, ему их **предоставляют** уже готовыми.

---

## 🔴 БЕЗ Dependency Injection (плохо)

```typescript
// ❌ AuthService сам создаёт свои зависимости
class AuthService {
  private userModel: Model<User>
  private jwtService: JwtService
  
  constructor() {
    // Создаём зависимости ВНУТРИ класса
    this.userModel = new UserModel()  // Жёсткая связь!
    this.jwtService = new JwtService() // Жёсткая связь!
  }
  
  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email })
    const token = this.jwtService.sign({ sub: user._id })
    return { token }
  }
}
```

**Проблемы**:
- ❌ **Жёсткая связь** (tight coupling) - AuthService знает КАК создавать зависимости
- ❌ **Сложно тестировать** - нельзя подменить userModel на mock
- ❌ **Нельзя переиспользовать** - каждый класс создаёт свой экземпляр
- ❌ **Сложно изменять** - если изменится UserModel, нужно менять AuthService

---

## ✅ С Dependency Injection (хорошо)

```typescript
// ✅ AuthService получает зависимости извне
@Injectable()  // NestJS помечает класс для DI
class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,  // Внедрено!
    private jwtService: JwtService,                          // Внедрено!
  ) {
    // Ничего не создаём - зависимости уже готовы
  }
  
  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email })
    const token = this.jwtService.sign({ sub: user._id })
    return { token }
  }
}
```

**Преимущества**:
- ✅ **Слабая связь** (loose coupling) - AuthService не знает КАК создавать зависимости
- ✅ **Легко тестировать** - можно подменить на mock
- ✅ **Переиспользование** - один экземпляр для всех
- ✅ **Легко изменять** - изменения в UserModel не затронут AuthService

---

## 🏗️ Как работает DI в NestJS

### 1. Помечаем класс как Injectable

```typescript
import { Injectable } from '@nestjs/common'

@Injectable()  // ← Говорим NestJS: этот класс можно внедрять
export class AuthService {
  // ...
}
```

**Что делает `@Injectable()`**:
- Регистрирует класс в DI контейнере NestJS
- Позволяет внедрять этот класс в другие классы
- Создаёт **один экземпляр** (singleton) на всё приложение

### 2. Регистрируем в Module

```typescript
@Module({
  providers: [
    AuthService,    // ← Регистрируем в контейнере
    JwtStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

**Что происходит**:
- NestJS создаёт экземпляры всех providers
- Сохраняет их в DI контейнере
- Автоматически внедряет при необходимости

### 3. Внедряем через constructor

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,  // ← NestJS внедряет автоматически
  ) {}
  
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }
}
```

**Что происходит**:
1. NestJS видит что AuthController требует AuthService
2. Ищет AuthService в DI контейнере
3. Внедряет готовый экземпляр в constructor
4. AuthController может использовать authService

---

## 🔄 Жизненный цикл

```
1. Приложение запускается
2. NestJS читает @Module декораторы
3. Создаёт экземпляры всех providers (один раз!)
4. Сохраняет в DI контейнере
5. При создании контроллеров/сервисов:
   - Смотрит что нужно в constructor
   - Внедряет из контейнера
6. Все используют ОДНИ И ТЕ ЖЕ экземпляры (singleton)
```

**Пример**:
```typescript
// Создаётся ОДИН экземпляр AuthService
const authService = new AuthService(userModel, jwtService)

// Все контроллеры получают ЭТОТ ЖЕ экземпляр
AuthController → authService (тот же экземпляр)
UsersController → authService (тот же экземпляр)
ProfileController → authService (тот же экземпляр)
```

---

## 🎯 Реальные примеры из нашего кода

### Пример 1: AuthService

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,  // Внедрена Mongoose модель
    private jwtService: JwtService,                          // Внедрён JwtService
  ) {}
}
```

**Что внедряется**:
- `userModel` - Mongoose модель для работы с БД
- `jwtService` - сервис для создания/проверки JWT токенов

**Откуда берутся**:
- `userModel` - из `MongooseModule.forFeature([...])` в AuthModule
- `jwtService` - из `JwtModule.register({...})` в AuthModule

### Пример 2: JwtStrategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {  // Внедрён AuthService
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    })
  }
  
  async validate(payload: any) {
    return this.authService.validateUser(payload.sub)  // Используем внедрённый сервис
  }
}
```

**Что внедряется**:
- `authService` - для валидации пользователя

**Цепочка зависимостей**:
```
JwtStrategy → AuthService → userModel + jwtService
```

### Пример 3: AuthController

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}  // Внедрён AuthService
  
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)  // Используем внедрённый сервис
  }
}
```

---

## 🧪 Зачем это нужно для тестирования

### БЕЗ DI (сложно тестировать):

```typescript
// ❌ AuthService сам создаёт зависимости
class AuthService {
  private userModel = new UserModel()  // Реальная БД!
  
  async login(email: string) {
    return this.userModel.findOne({ email })  // Реальный запрос в БД
  }
}

// Тест будет обращаться к реальной БД - медленно и небезопасно
test('login', () => {
  const service = new AuthService()
  await service.login('test@example.com')  // Реальный запрос!
})
```

### С DI (легко тестировать):

```typescript
// ✅ AuthService получает зависимости
class AuthService {
  constructor(private userModel: Model<User>) {}
  
  async login(email: string) {
    return this.userModel.findOne({ email })
  }
}

// Можем подменить на mock
test('login', () => {
  const mockUserModel = {
    findOne: jest.fn().mockResolvedValue({ email: 'test@example.com' })
  }
  
  const service = new AuthService(mockUserModel)  // Внедряем mock!
  await service.login('test@example.com')  // Использует mock, не БД
  
  expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
})
```

---

## 📊 DI Container (упрощённо)

Представьте DI контейнер как **склад готовых инструментов**:

```typescript
// DI Container (внутри NestJS):
const container = {
  'AuthService': authServiceInstance,
  'JwtService': jwtServiceInstance,
  'UserModel': userModelInstance,
  'JwtStrategy': jwtStrategyInstance,
  // ...
}

// Когда создаётся AuthController:
class AuthController {
  constructor(private authService: AuthService) {}
}

// NestJS делает:
const authService = container.get('AuthService')  // Берёт со склада
const authController = new AuthController(authService)  // Внедряет
```

---

## 🎓 Другие типы Scope (продвинуто)

### Default (Singleton) - один экземпляр на всё приложение

```typescript
@Injectable()  // По умолчанию singleton
export class AuthService {}
```

### Request Scope - новый экземпляр на каждый HTTP запрос

```typescript
@Injectable({ scope: Scope.REQUEST })
export class LoggerService {}
```

### Transient Scope - новый экземпляр при каждом внедрении

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class UniqueService {}
```

**В 99% случаев используется Singleton (по умолчанию).**

---

## 📝 Резюме

**Dependency Injection - это**:
- ✅ Класс НЕ создаёт зависимости, а **получает** их
- ✅ Слабая связь (loose coupling)
- ✅ Легко тестировать (можно подменить на mock)
- ✅ Переиспользование (один экземпляр для всех)
- ✅ Масштабируемость (легко добавлять новые зависимости)

**Как работает в NestJS**:
1. `@Injectable()` - помечаем класс
2. Регистрируем в `providers: [...]` модуля
3. Внедряем через `constructor(...)`
4. NestJS автоматически создаёт и внедряет

**Паттерны**:
- Service Layer получает зависимости (userModel, jwtService)
- Controller получает Services (authService)
- Strategy получает Services (authService)

**Следующий шаг**: Изучите как работает код в `auth.service.ts` и `auth.controller.ts`!
