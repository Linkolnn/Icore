import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { User } from './decorators/user.decorator'
import type { UserPayload } from './interfaces/user-payload.interface'

/**
 * AuthController - Контроллер аутентификации
 * 
 * ПАТТЕРН: Controller Pattern (MVC)
 * ЗАЧЕМ:
 * - Обрабатывает HTTP запросы
 * - Валидирует входящие данные (через DTO)
 * - Делегирует бизнес-логику в Service
 * - Возвращает HTTP ответы
 * 
 * МАРШРУТЫ:
 * - POST /auth/register - Регистрация
 * - POST /auth/login - Вход
 * - GET /auth/profile - Получить профиль (требует авторизации)
 * 
 * ВАЛИДАЦИЯ:
 * - DTO классы автоматически валидируются (class-validator)
 * - Если данные невалидны → 400 Bad Request
 * 
 * КАК ИСПОЛЬЗОВАТЬ (Frontend):
 * 
 * // Регистрация:
 * const res = await fetch('http://localhost:3001/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'John',
 *     email: 'john@example.com',
 *     password: 'secret123'
 *   })
 * })
 * const { access_token, user } = await res.json()
 * 
 * // Вход:
 * const res = await fetch('http://localhost:3001/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'john@example.com',
 *     password: 'secret123'
 *   })
 * })
 * const { access_token, user } = await res.json()
 * 
 * // Получить профиль:
 * const res = await fetch('http://localhost:3001/auth/profile', {
 *   headers: {
 *     'Authorization': `Bearer ${access_token}`
 *   }
 * })
 * const user = await res.json()
 */
@Controller('auth')
export class AuthController {
  /**
   * Dependency Injection
   * 
   * authService внедряется автоматически NestJS
   */
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register - Регистрация нового пользователя
   * 
   * @Post() - декоратор HTTP метода POST
   * @Body() - извлекает тело запроса и валидирует через RegisterDto
   * 
   * ЗАПРОС:
   * POST /auth/register
   * Content-Type: application/json
   * Body: {
   *   "name": "John Doe",
   *   "email": "john@example.com",
   *   "password": "secret123"
   * }
   * 
   * ОТВЕТ (успех - 201 Created):
   * {
   *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "_id": "507f1f77bcf86cd799439011",
   *     "name": "John Doe",
   *     "email": "john@example.com",
   *     "avatar": null,
   *     "status": "offline"
   *   }
   * }
   * 
   * ОШИБКИ:
   * - 400 Bad Request - валидация не прошла (невалидный email, короткий пароль)
   * - 409 Conflict - email уже зарегистрирован
   * 
   * FRONTEND ДЕЙСТВИЯ:
   * 1. Получить access_token и user из ответа
   * 2. Сохранить token (localStorage, Pinia store, cookies)
   * 3. Сохранить user в store
   * 4. Перенаправить на главную страницу
   * 5. Использовать token в последующих запросах:
   *    Authorization: Bearer <access_token>
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  /**
   * POST /auth/login - Вход пользователя
   * 
   * @Post() - декоратор HTTP метода POST
   * @Body() - извлекает тело запроса и валидирует через LoginDto
   * 
   * ЗАПРОС:
   * POST /auth/login
   * Content-Type: application/json
   * Body: {
   *   "email": "john@example.com",
   *   "password": "secret123"
   * }
   * 
   * ОТВЕТ (успех - 200 OK):
   * {
   *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "_id": "507f1f77bcf86cd799439011",
   *     "name": "John Doe",
   *     "email": "john@example.com",
   *     "avatar": null,
   *     "status": "offline"
   *   }
   * }
   * 
   * ОШИБКИ:
   * - 400 Bad Request - валидация не прошла
   * - 401 Unauthorized - неверный email или пароль
   * 
   * FRONTEND ДЕЙСТВИЯ:
   * 1. Получить access_token и user
   * 2. Сохранить token и user
   * 3. Перенаправить на главную
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  /**
   * GET /auth/profile - Получить профиль текущего пользователя
   * 
   * @Get() - декоратор HTTP метода GET
   * @UseGuards(JwtAuthGuard) - требует авторизацию (JWT токен)
   * @Request() - внедряет Express Request объект
   * 
   * ЗАЩИЩЁННЫЙ ENDPOINT:
   * - Требует JWT токен в заголовке Authorization
   * - Если токена нет → 401 Unauthorized
   * - Если токен невалиден → 401 Unauthorized
   * 
   * ЗАПРОС:
   * GET /auth/profile
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * ОТВЕТ (успех - 200 OK):
   * {
   *   "_id": "507f1f77bcf86cd799439011",
   *   "name": "John Doe",
   *   "email": "john@example.com",
   *   "avatar": null,
   *   "status": "offline",
   *   "createdAt": "2025-11-11T18:00:00.000Z",
   *   "updatedAt": "2025-11-11T18:00:00.000Z"
   * }
   * 
   * КАК РАБОТАЕТ:
   * 1. JwtAuthGuard проверяет токен из заголовка
   * 2. JwtStrategy валидирует токен и пользователя
   * 3. Данные пользователя добавляются в req.user
   * 4. Контроллер возвращает req.user
   * 
   * FRONTEND ИСПОЛЬЗОВАНИЕ:
   * // Получить профиль текущего пользователя:
   * const token = localStorage.getItem('token')
   * const res = await fetch('http://localhost:3001/auth/profile', {
   *   headers: {
   *     'Authorization': `Bearer ${token}`
   *   }
   * })
   * const user = await res.json()
   * 
   * ЗАЧЕМ:
   * - Получить актуальные данные пользователя после входа
   * - Проверить валидность токена
   * - Обновить данные в store
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() user: UserPayload) {
    // Получаем полные данные пользователя из БД по userId (sub)
    return this.authService.validateUser(user.sub)
  }
}
