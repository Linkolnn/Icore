import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth.token;

      if (!token) {
        return false;
      }

      // Проверяем JWT токен
      const payload = this.jwtService.verify(token);

      // Сохраняем userId в client.data для использования в handlers
      client.data.userId = payload.sub;

      return true;
    } catch (error) {
      return false;
    }
  }
}
