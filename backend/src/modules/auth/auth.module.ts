import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { User, UserSchema } from '../users/schemas/user.schema'

/**
 * AuthModule - Модуль аутентификации и авторизации
 * 
 * ПАТТЕРН: Module Pattern (NestJS)
 * ЗАЧЕМ:
 * - Инкапсулирует всю логику авторизации
 * - Регистрирует зависимости (providers)
 * - Настраивает JWT и Passport
 * - Импортирует необходимые модули
 * 
 * СТРУКТУРА:
 * - imports - импортированные модули
 * - controllers - HTTP контроллеры
 * - providers - сервисы и стратегии
 * - exports - что экспортируется для других модулей
 * 
 * ЗАВИСИМОСТИ:
 * 
 * 1. MongooseModule.forFeature([...])
 *    - Регистрирует User модель для этого модуля
 *    - Позволяет использовать @InjectModel(User.name)
 * 
 * 2. PassportModule
 *    - Базовый модуль для аутентификации
 *    - Предоставляет @AuthGuard() декоратор
 * 
 * 3. JwtModule.register({...})
 *    - Настройка JWT токенов
 *    - secret: секретный ключ для подписи токенов
 *    - signOptions.expiresIn: срок действия токена
 * 
 * PROVIDERS:
 * - AuthService - бизнес-логика
 * - JwtStrategy - стратегия проверки JWT
 * 
 * CONTROLLERS:
 * - AuthController - HTTP endpoints
 * 
 * EXPORTS:
 * - JwtStrategy - для использования в других модулях
 */
@Module({
  imports: [
    // Регистрация User модели для использования в AuthService
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    
    // Базовый модуль Passport
    PassportModule,
    
    // Настройка JWT модуля
    JwtModule.register({
      // Секретный ключ для подписи токенов
      // ВАЖНО: В production использовать сложный ключ из .env
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      
      // Опции подписи
      signOptions: {
        expiresIn: '7d', // Токен действителен 7 дней
        // Можно изменить на '1h', '30d', '365d' и т.д.
      },
    }),
  ],
  
  // HTTP контроллеры
  controllers: [AuthController],
  
  // Сервисы и стратегии (доступны через DI)
  providers: [
    AuthService,    // Бизнес-логика авторизации
    JwtStrategy,    // Стратегия проверки JWT токенов
  ],
  
  // Экспортируем для использования в других модулях
  exports: [JwtStrategy],
})
export class AuthModule {}
