import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../auth.service'

/**
 * JWT Strategy - Стратегия аутентификации через JWT
 * 
 * ПАТТЕРН: Strategy Pattern (из Passport.js)
 * ЗАЧЕМ:
 * - Проверяет JWT токен из заголовка Authorization
 * - Валидирует пользователя по данным из токена
 * - Автоматически добавляет user в request
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Клиент отправляет запрос с заголовком:
 *    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * 2. Passport извлекает токен и проверяет подпись
 * 3. Вызывается метод validate() с payload токена
 * 4. AuthService.validateUser() проверяет существование пользователя
 * 5. Данные пользователя добавляются в request.user
 * 
 * БЕЗОПАСНОСТЬ:
 * - JWT проверяется по секретному ключу (JWT_SECRET)
 * - Если токен невалидный → 401 Unauthorized
 * - Если пользователь не найден → 401 Unauthorized
 * 
 * КАК РАБОТАЕТ:
 * @UseGuards(JwtAuthGuard) на контроллере/методе
 * → Passport вызывает JwtStrategy
 * → validate() возвращает user
 * → user доступен в request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Конструктор с настройкой JWT
   * 
   * super() вызывает конструктор PassportStrategy со следующими опциями:
   * 
   * jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
   *   - Извлекает токен из заголовка Authorization
   *   - Формат: "Bearer <token>"
   *   - Пример: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * 
   * ignoreExpiration: false
   *   - НЕ игнорировать срок действия токена
   *   - Если токен истёк → ошибка 401
   * 
   * secretOrKey: process.env.JWT_SECRET
   *   - Секретный ключ для проверки подписи токена
   *   - ВАЖНО: Должен совпадать с ключом при генерации (AuthService)
   *   - Хранится в .env файле
   * 
   * БЕЗОПАСНОСТЬ:
   * - JWT_SECRET должен быть сложным (минимум 32 символа)
   * - НЕ коммитить в git
   * - В production использовать переменные окружения сервера
   */
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    })
  }

  /**
   * Валидация токена и пользователя
   * 
   * ВЫЗЫВАЕТСЯ: Автоматически Passport после проверки токена
   * 
   * @param payload - данные из токена (sub, email, iat, exp)
   *   payload.sub - userId (subject)
   *   payload.email - email пользователя
   *   payload.iat - issued at (время создания токена)
   *   payload.exp - expiration (время истечения токена)
   * 
   * @returns User - данные пользователя из БД
   * 
   * ПРОЦЕСС:
   * 1. Passport проверил подпись токена (валиден ли?)
   * 2. Passport проверил срок действия (не истёк ли?)
   * 3. Вызывается validate() с payload
   * 4. AuthService проверяет существование пользователя в БД
   * 5. Возвращаем данные пользователя
   * 6. Passport добавляет user в request.user
   * 
   * ЗАЧЕМ ПРОВЕРЯТЬ БД:
   * - Пользователь мог быть удалён
   * - Пользователь мог быть заблокирован
   * - Нужны актуальные данные (статус, аватар)
   * 
   * РЕЗУЛЬТАТ:
   * В контроллере доступно:
   * @Request() req
   * const user = req.user // Данные из этого метода
   */
  async validate(payload: any) {
    // payload.sub содержит userId
    const user = await this.authService.validateUser(payload.sub)
    
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден')
    }
    
    // Возвращаемый объект попадёт в request.user
    return user
  }
}
