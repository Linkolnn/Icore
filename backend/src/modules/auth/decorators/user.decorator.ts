import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../interfaces/user-payload.interface';

/**
 * User Decorator
 *
 * Извлекает данные текущего пользователя из request.user
 * (установленные JWT Strategy после валидации токена)
 *
 * @example
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@User() user: UserPayload) {
 *   return user;
 * }
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
