import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersDto } from './dto/search-users.dto';

/**
 * Users Controller
 * 
 * Применяем паттерны:
 * - Guard Pattern: @UseGuards(JwtAuthGuard) для защиты endpoints
 * - DTO Pattern: SearchUsersDto для валидации query параметров
 * - Service Layer: вся логика в UsersService
 * 
 * Контроллер ТОЛЬКО принимает запросы и возвращает ответы!
 * Никакой бизнес-логики здесь!
 */
@Controller('users')
@UseGuards(JwtAuthGuard) // Все endpoints требуют аутентификации
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /users/search?query=john&limit=10&skip=0
   * 
   * Поиск пользователей по имени, email или userId
   * Исключает текущего пользователя из результатов
   * 
   * Query параметры валидируются через SearchUsersDto
   */
  @Get('search')
  async searchUsers(@Query() searchDto: SearchUsersDto, @Request() req) {
    // req.user добавляется JWT Guard'ом
    return this.usersService.searchUsers(searchDto, req.user._id);
  }
}
