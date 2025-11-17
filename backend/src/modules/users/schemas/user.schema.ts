import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

/**
 * User Status Enum
 * 
 * Определяет возможные статусы пользователя в системе
 * - online: Пользователь онлайн
 * - offline: Пользователь оффлайн
 * - away: Пользователь отошёл (неактивен)
 * - dnd: Do Not Disturb - не беспокоить
 */
export enum UserStatus {
  Online = 'online',
  Offline = 'offline',
  Away = 'away',
  DND = 'dnd',
}

/**
 * User Schema - Модель пользователя в MongoDB
 * 
 * ПАТТЕРН: Schema Pattern (Mongoose)
 * ЗАЧЕМ: Определяет структуру документа пользователя в БД
 * 
 * @Schema({ timestamps: true }) - автоматически добавляет:
 *   - createdAt: Date - дата создания
 *   - updatedAt: Date - дата последнего обновления
 * 
 * extends Document - наследует методы Mongoose:
 *   - save() - сохранить в БД
 *   - remove() - удалить из БД
 *   - _id - MongoDB ObjectId
 */
@Schema({ timestamps: true })
export class User extends Document {
  /**
   * Имя пользователя
   * required: true - обязательное поле
   */
  @Prop({ required: true })
  name: string

  /**
   * Email пользователя
   * required: true - обязательное поле
   * unique: true - уникальное значение в БД (индекс)
   * 
   * ВАЖНО: При регистрации проверяется уникальность
   */
  @Prop({ required: true, unique: true })
  email: string

  /**
   * Уникальный ID пользователя для поиска
   * Формат: nickname@randomid
   * Пример: john@a1b2c3d4
   * 
   * required: true - обязательное поле
   * unique: true - уникальное значение в БД (индекс)
   * 
   * ИСПОЛЬЗОВАНИЕ: Для поиска друзей по ID
   * Пользователь может изменить nickname часть
   */
  @Prop({ required: true, unique: true })
  userId: string

  /**
   * Хеш пароля (НЕ сам пароль!)
   * required: true - обязательное поле
   * select: false - НЕ возвращается в запросах по умолчанию (безопасность)
   *
   * БЕЗОПАСНОСТЬ: Хранится bcrypt хеш, не plain text
   * Пример: $2b$10$rXG7ZxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKx
   *
   * ВАЖНО: Чтобы получить пароль, нужно явно использовать .select('+password')
   * Это предотвращает утечку хешей паролей в API ответах
   */
  @Prop({ required: true, select: false })
  password: string

  /**
   * URL аватара пользователя
   * required: false - необязательное поле
   * 
   * Может быть:
   * - URL внешнего изображения
   * - Путь к файлу на сервере
   * - null/undefined если аватара нет
   */
  @Prop({ required: false })
  avatar?: string

  /**
   * Статус пользователя онлайн
   * enum - только значения из UserStatus
   * default - по умолчанию offline
   * 
   * ИСПОЛЬЗОВАНИЕ: Для отображения статуса в чатах
   */
  @Prop({
    required: false,
    enum: Object.values(UserStatus),
    default: UserStatus.Offline,
  })
  status?: UserStatus

  // Автоматически добавляется Mongoose (timestamps: true):
  // createdAt?: Date
  // updatedAt?: Date
}

/**
 * Тип для Mongoose документа User
 * Комбинирует User класс с Mongoose Document
 */
export type UserDocument = User & Document;

/**
 * Экспорт Mongoose схемы
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * - В UsersModule для регистрации модели
 * - В сервисах для работы с БД
 * 
 * Пример:
 * MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
 */
export const UserSchema = SchemaFactory.createForClass(User)

/**
 * MongoDB Indexes для оптимизации поиска
 * 
 * Text Index на name, email, userId:
 * - Ускоряет поиск по тексту
 * - Поддерживает case-insensitive поиск
 * - Используется в searchUsers()
 * 
 * ВАЖНО: Индексы создаются автоматически при старте приложения
 */
UserSchema.index({ name: 'text', email: 'text', userId: 'text' })