import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * POST /messages - Создать сообщение (fallback для HTTP)
   * Rate limit: 30 сообщений в минуту
   */
  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 req/60 sec
  async create(@Body() dto: CreateMessageDto, @User() user: UserPayload) {
    const message = await this.messagesService.create(dto, user.sub);
    return { success: true, message };
  }

  /**
   * GET /chats/:chatId/messages - Получить сообщения чата с пагинацией
   */
  @Get('chats/:chatId')
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @User() user: UserPayload,
  ) {
    const result = await this.messagesService.getMessages(
      chatId,
      user.sub,
      parseInt(limit) || 50,
      parseInt(skip) || 0,
    );
    return result;
  }

  /**
   * DELETE /messages/:id - Удалить сообщение (soft delete)
   */
  @Delete(':id')
  async delete(@Param('id') messageId: string, @User() user: UserPayload) {
    await this.messagesService.softDelete(messageId, user.sub);
    return { success: true, message: 'Message deleted' };
  }
}
