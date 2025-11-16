import { IsString, IsOptional, IsInt, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO для поиска пользователей
 * Применяем DTO Pattern для валидации query параметров
 */
export class SearchUsersDto {
  /**
   * Поисковый запрос (минимум 2 символа)
   * Ищем по: name, email, userId
   */
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters long' })
  query: string;

  /**
   * Pagination: количество результатов
   * По умолчанию 10
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  /**
   * Pagination: пропустить N результатов
   * По умолчанию 0
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;
}
