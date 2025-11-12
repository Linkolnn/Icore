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
   * Хеш пароля (НЕ сам пароль!)
   * required: true - обязательное поле
   * 
   * БЕЗОПАСНОСТЬ: Хранится bcrypt хеш, не plain text
   * Пример: $2b$10$rXG7ZxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKx
   */
  @Prop({ required: true })
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