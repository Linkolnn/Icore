import { IsEmail, IsString, IsNotEmpty } from 'class-validator'

/**
 * LoginDto - DTO для входа пользователя
 * 
 * ПАТТЕРН: DTO (Data Transfer Object)
 * ЗАЧЕМ:
 * - Валидация данных для входа
 * - Защита от невалидных запросов
 * 
 * ИСПОЛЬЗОВАНИЕ (Frontend):
 * POST /auth/login
 * Body: {
 *   "email": "john@example.com",
 *   "password": "secret123"
 * }
 * 
 * ОТВЕТ:
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
 */
export class LoginDto {
  /**
   * Email пользователя
   * 
   * ВАЛИДАЦИЯ:
   * @IsNotEmpty() - не может быть пустым
   * @IsEmail() - должен быть валидным email форматом
   * 
   * ПРИМЕРЫ:
   * ✅ "user@example.com"
   * ❌ "invalid-email"
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
   * 
   * ПРИМЕРЫ:
   * ✅ "password123"
   * ❌ "" (пустая строка)
   * ❌ null
   * 
   * БЕЗОПАСНОСТЬ:
   * - AuthService найдёт пользователя по email
   * - Сравнит пароль с хешем через bcrypt.compare()
   * - Если совпадает → вернёт JWT токен
   * - Если не совпадает → 401 Unauthorized
   * 
   * ВАЖНО:
   * Минимальная длина НЕ проверяется при входе
   * (пользователь уже зарегистрирован с валидным паролем)
   */
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  password: string
}
