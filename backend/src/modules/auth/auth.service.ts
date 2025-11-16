import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { User } from '../users/schemas/user.schema'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

/**
 * AuthService - Сервис авторизации и аутентификации
 * 
 * ПАТТЕРН: Service Layer
 * ЗАЧЕМ: 
 * - Содержит бизнес-логику авторизации
 * - Изолирует работу с БД от контроллеров
 * - Переиспользуемые методы
 * 
 * DEPENDENCY INJECTION (DI):
 * - @Injectable() - помечает класс для DI
 * - @InjectModel() - внедряет Mongoose модель
 * - JwtService - внедряется автоматически из JwtModule
 * 
 * БЕЗОПАСНОСТЬ:
 * - Пароли хешируются через bcrypt
 * - JWT токены для аутентификации
 * - Соль генерируется автоматически (bcrypt.hash)
 */
@Injectable()
export class AuthService {
  /**
   * Конструктор с Dependency Injection
   * 
   * @InjectModel(User.name) - внедряет Mongoose модель User
   * userModel: Model<User> - для работы с коллекцией users в MongoDB
   * 
   * jwtService: JwtService - для генерации и проверки JWT токенов
   * (автоматически внедряется из JwtModule)
   */
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Генерация уникального userId
   * Формат: nickname@randomid
   * Пример: john@a1b2c3d4
   * 
   * @param name - имя пользователя
   * @returns уникальный userId
   */
  private async generateUserId(name: string): Promise<string> {
    // Преобразуем имя в lowercase и убираем пробелы
    const nickname = name.toLowerCase().replace(/\s+/g, '')
    
    // Генерируем случайный ID (8 символов)
    const randomId = Math.random().toString(36).substring(2, 10)
    
    // Формируем userId
    let userId = `${nickname}@${randomId}`
    
    // Проверяем уникальность
    let existingUser = await this.userModel.findOne({ userId })
    
    // Если не уникален, генерируем новый
    while (existingUser) {
      const newRandomId = Math.random().toString(36).substring(2, 10)
      userId = `${nickname}@${newRandomId}`
      existingUser = await this.userModel.findOne({ userId })
    }
    
    return userId
  }

  /**
   * Регистрация нового пользователя
   * 
   * ПРОЦЕСС:
   * 1. Проверка существования email в БД
   * 2. Хеширование пароля (bcrypt)
   * 3. Создание пользователя в БД
   * 4. Генерация JWT токена
   * 5. Возврат токена и данных пользователя
   * 
   * БЕЗОПАСНОСТЬ:
   * - bcrypt.hash() создаёт хеш с автоматической солью
   * - saltRounds: 10 - количество раундов (больше = безопаснее, но медленнее)
   * - Пароль НЕ сохраняется в plain text
   * 
   * @param registerDto - данные для регистрации (name, email, password)
   * @returns { access_token, user } - JWT токен и данные пользователя
   * @throws ConflictException - если email уже зарегистрирован
   * 
   * ИСПОЛЬЗОВАНИЕ (Frontend):
   * const response = await fetch('/auth/register', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({
   *     name: 'John',
   *     email: 'john@example.com',
   *     password: 'secret123'
   *   })
   * })
   * const { access_token, user } = await response.json()
   * // Сохранить token в localStorage или cookies
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto

    // 1. Проверка: существует ли пользователь с таким email?
    const existingUser = await this.userModel.findOne({ email })
    if (existingUser) {
      // Возвращаем 409 Conflict
      throw new ConflictException('Пользователь с таким email уже существует')
    }

    // 2. Хеширование пароля
    // bcrypt.hash(password, saltRounds)
    // - saltRounds: 10 (рекомендуемое значение)
    // - Соль генерируется автоматически
    // - Результат: $2b$10$... (60 символов)
    const hashedPassword = await bcrypt.hash(password, 10)

    // 2.5. Генерация уникального userId
    const userId = await this.generateUserId(name)

    // 3. Создание нового пользователя в БД
    const user = new this.userModel({
      name,
      email,
      password: hashedPassword, // Сохраняем ХЕШ, не plain text!
      userId, // Уникальный ID для поиска
      status: 'offline', // По умолчанию оффлайн
    })
    await user.save()

    // 4. Генерация JWT токена
    // payload - данные которые будут в токене (НЕ храним пароль!)
    const payload = { sub: user._id, email: user.email }
    const access_token = this.jwtService.sign(payload)

    // 5. Возвращаем токен и данные пользователя (БЕЗ пароля)
    return {
      access_token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userId: user.userId,
        avatar: user.avatar,
        status: user.status,
      },
    }
  }

  /**
   * Вход пользователя
   * 
   * ПРОЦЕСС:
   * 1. Поиск пользователя по email
   * 2. Проверка пароля (bcrypt.compare)
   * 3. Генерация JWT токена
   * 4. Возврат токена и данных пользователя
   * 
   * БЕЗОПАСНОСТЬ:
   * - bcrypt.compare() безопасно сравнивает пароль с хешем
   * - Защита от timing attacks (постоянное время выполнения)
   * 
   * @param loginDto - данные для входа (email, password)
   * @returns { access_token, user } - JWT токен и данные пользователя
   * @throws UnauthorizedException - если email или пароль неверны
   * 
   * ИСПОЛЬЗОВАНИЕ (Frontend):
   * const response = await fetch('/auth/login', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({
   *     email: 'john@example.com',
   *     password: 'secret123'
   *   })
   * })
   * const { access_token, user } = await response.json()
   * // Сохранить token и использовать в заголовках:
   * // Authorization: Bearer <access_token>
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    // 1. Поиск пользователя по email
    const user = await this.userModel.findOne({ email })
    if (!user) {
      // НЕ говорим что именно неверно (email или пароль)
      // Безопасность: защита от перебора существующих email
      throw new UnauthorizedException('Неверный email или пароль')
    }

    // 2. Проверка пароля
    // bcrypt.compare(plainPassword, hashedPassword)
    // - Безопасно сравнивает пароль с хешем
    // - Защита от timing attacks
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    // 3. Генерация JWT токена
    const payload = { sub: user._id, email: user.email }
    const access_token = this.jwtService.sign(payload)

    // 4. Возвращаем токен и данные пользователя (БЕЗ пароля)
    return {
      access_token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userId: user.userId,
        avatar: user.avatar,
        status: user.status,
      },
    }
  }

  /**
   * Валидация пользователя по ID
   * 
   * ИСПОЛЬЗОВАНИЕ:
   * - JWT Strategy вызывает этот метод после проверки токена
   * - Возвращает актуальные данные пользователя из БД
   * 
   * @param userId - MongoDB ObjectId пользователя
   * @returns User - данные пользователя из БД (БЕЗ пароля)
   * @throws UnauthorizedException - если пользователь не найден
   * 
   * ЗАЧЕМ:
   * - Проверка что пользователь всё ещё существует в БД
   * - Получение актуальных данных (статус, аватар и т.д.)
   */
  async validateUser(userId: string) {
    // .select('-password') - исключаем поле password из результата
    const user = await this.userModel.findById(userId).select('-password')
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден')
    }
    return user
  }
}
