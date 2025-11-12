import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator'

/**
 * RegisterDto - DTO для регистрации нового пользователя
 * 
 * ПАТТЕРН: DTO (Data Transfer Object)
 * ЗАЧЕМ: 
 * - Валидация входящих данных от клиента
 * - Защита от невалидных/вредоносных данных
 * - Автодокументирование API
 * 
 * ИСПОЛЬЗОВАНИЕ (Frontend):
 * POST /auth/register
 * Body: {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "secret123"
 * }
 * 
 * БИБЛИОТЕКА: class-validator
 * - Автоматическая валидация NestJS
 * - Если данные невалидны → возвращает 400 Bad Request с ошибками
 */
export class RegisterDto {
  /**
   * Имя пользователя
   * 
   * ВАЛИДАЦИЯ:
   * @IsNotEmpty() - не может быть пустым
   * @IsString() - должно быть строкой
   * 
   * ПРИМЕРЫ:
   * ✅ "John Doe"
   * ✅ "Иван Иванов"
   * ❌ "" (пустая строка)
   * ❌ 123 (число)
   * ❌ null
   */
  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString({ message: 'Имя должно быть строкой' })
  name: string

  /**
   * Email пользователя
   * 
   * ВАЛИДАЦИЯ:
   * @IsNotEmpty() - не может быть пустым
   * @IsEmail() - должен быть валидным email форматом
   * 
   * ПРИМЕРЫ:
   * ✅ "user@example.com"
   * ✅ "test.user+tag@domain.co.uk"
   * ❌ "invalid-email"
   * ❌ "user@"
   * ❌ "@example.com"
   * 
   * БЕЗОПАСНОСТЬ:
   * - В AuthService проверяется уникальность (уже зарегистрирован или нет)
   */
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Неверный формат email' })
  email: string

  /**
   * Пароль пользователя
   * 
   * ВАЛИДАЦИЯ:
   * @IsNotEmpty() - не может быть пустым
   * @IsString() - должен быть строкой
   * @MinLength(6) - минимум 6 символов
   * 
   * ПРИМЕРЫ:
   * ✅ "password123"
   * ✅ "MySecureP@ss!"
   * ❌ "12345" (меньше 6 символов)
   * ❌ "" (пустая строка)
   * 
   * БЕЗОПАСНОСТЬ:
   * - НЕ хранится в plain text!
   * - В AuthService хешируется через bcrypt
   * - Соль генерируется автоматически (bcrypt.hash)
   * - В БД сохраняется только хеш
   * 
   * РЕКОМЕНДАЦИЯ:
   * На фронтенде добавить дополнительные проверки:
   * - Минимум 8 символов
   * - Наличие букв и цифр
   * - Наличие специальных символов
   */
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  password: string
}
