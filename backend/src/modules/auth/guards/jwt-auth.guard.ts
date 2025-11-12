import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * JwtAuthGuard - Guard для защиты routes через JWT
 * 
 * ПАТТЕРН: Guard Pattern (NestJS)
 * ЗАЧЕМ:
 * - Защищает endpoints от неавторизованных запросов
 * - Требует валидный JWT токен
 * - Автоматически проверяет токен через JwtStrategy
 * 
 * ИСПОЛЬЗОВАНИЕ (в контроллерах):
 * 
 * // Защитить весь контроллер:
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UsersController {
 *   // Все методы требуют авторизации
 * }
 * 
 * // Защитить отдельный метод:
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@Request() req) {
 *   return req.user // Данные пользователя из токена
 * }
 * 
 * КАК РАБОТАЕТ:
 * 1. Клиент отправляет запрос с заголовком:
 *    Authorization: Bearer <token>
 * 
 * 2. JwtAuthGuard проверяет наличие токена
 * 3. Вызывает JwtStrategy для валидации
 * 4. Если токен валиден → пропускает запрос
 * 5. Если токен невалиден → возвращает 401 Unauthorized
 * 
 * FRONTEND ПРИМЕР:
 * fetch('/users/profile', {
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * })
 * 
 * ОШИБКИ:
 * - 401 Unauthorized - нет токена или токен невалидный
 * - 401 Unauthorized - токен истёк
 * - 401 Unauthorized - пользователь не найден
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Наследует всю логику от AuthGuard('jwt')
  // 'jwt' - имя стратегии из PassportStrategy
  
  // Можно переопределить методы для кастомной логики:
  
  // handleRequest(err, user, info) {
  //   // Кастомная обработка ошибок
  //   if (err || !user) {
  //     throw err || new UnauthorizedException()
  //   }
  //   return user
  // }
}
