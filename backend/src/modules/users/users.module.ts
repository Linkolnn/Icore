import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';

/**
 * Users Module
 * 
 * Применяем Module Pattern из NestJS:
 * - Инкапсуляция функционала пользователей
 * - Dependency Injection через providers
 * - Экспорт UsersService для использования в других модулях (Auth, Chats)
 */
@Module({
  imports: [
    // Регистрируем Mongoose схемы
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Экспортируем для Auth и Chats модулей
})
export class UsersModule {}
