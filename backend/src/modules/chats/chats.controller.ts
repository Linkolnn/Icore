import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * GET /chats - Get all chats for current user
   */
  @Get()
  async getUserChats(@User() user: UserPayload) {
    return this.chatsService.getUserChats(user.sub);
  }

  /**
   * POST /chats - Create new chat
   */
  @Post()
  async createChat(@Body() createChatDto: CreateChatDto, @User() user: UserPayload) {
    return this.chatsService.createChat(createChatDto, user.sub);
  }

  /**
   * POST /chats/find-or-check/:userId - Find existing chat with user
   * Используется для preview режима - проверяет существует ли чат с пользователем
   * Возвращает чат если существует, или null если не существует
   */
  @Post('find-or-check/:userId')
  async findOrCheckChat(@Param('userId') otherUserId: string, @User() user: UserPayload) {
    const chat = await this.chatsService.findExistingPersonalChat(
      user.sub,
      otherUserId,
    );

    return {
      exists: !!chat,
      chat: chat || null,
    };
  }

  /**
   * PATCH /chats/:id/read - Mark chat as read (reset unread count)
   * ВАЖНО: Должен быть ПЕРЕД /:id чтобы не конфликтовать
   */
  @Patch(':id/read')
  async markChatAsRead(@Param('id') chatId: string, @User() user: UserPayload) {
    await this.chatsService.resetUnreadCount(chatId, user.sub);
    return { success: true };
  }

  /**
   * GET /chats/:id - Get chat by ID
   */
  @Get(':id')
  async getChatById(@Param('id') chatId: string, @User() user: UserPayload) {
    return this.chatsService.getChatById(chatId, user.sub);
  }

  /**
   * DELETE /chats/:id - Delete chat (soft delete)
   */
  @Delete(':id')
  async deleteChat(@Param('id') chatId: string, @User() user: UserPayload) {
    return this.chatsService.deleteChat(chatId, user.sub);
  }
}
