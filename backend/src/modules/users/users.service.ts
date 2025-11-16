import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { SearchUsersDto } from './dto/search-users.dto';

/**
 * Users Service
 * Применяем Service Layer Pattern - вся бизнес-логика здесь
 * Применяем Repository Pattern - работа с БД через Mongoose Model
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Найти пользователя по email
   * Используется в Auth Service
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Найти пользователя по ID
   */
  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  /**
   * Создать нового пользователя
   * Используется в Auth Service при регистрации
   */
  async create(userData: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  /**
   * Поиск пользователей
   * 
   * Применяем MongoDB Query Builder:
   * - $regex для поиска по тексту (case-insensitive)
   * - $or для поиска по нескольким полям
   * - $ne для исключения текущего пользователя
   * 
   * Применяем Pagination:
   * - skip и limit для постраничной выдачи
   * - countDocuments для total
   */
  async searchUsers(searchDto: SearchUsersDto, currentUserId: string) {
    const { query, limit = 10, skip = 0 } = searchDto;

    // Строим query с исключением текущего пользователя
    const searchQuery = {
      $and: [
        {
          // Поиск по name, email, userId (case-insensitive)
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { userId: { $regex: query, $options: 'i' } },
          ],
        },
        // Исключаем текущего пользователя
        { _id: { $ne: new Types.ObjectId(currentUserId) } },
      ],
    };

    // Параллельно получаем пользователей и total count
    const [users, total] = await Promise.all([
      this.userModel
        .find(searchQuery)
        .select('name email userId avatar') // Только нужные поля
        .skip(skip)
        .limit(limit)
        .exec(),

      this.userModel.countDocuments(searchQuery),
    ]);

    return {
      users,
      total,
      limit,
      skip,
      hasMore: skip + users.length < total,
    };
  }
}
