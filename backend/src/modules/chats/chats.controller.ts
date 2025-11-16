import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * GET /chats - Get all chats for current user
   */
  @Get()
  async getUserChats(@Request() req) {
    return this.chatsService.getUserChats(req.user._id);
  }

  /**
   * POST /chats - Create new chat
   */
  @Post()
  async createChat(@Body() createChatDto: CreateChatDto, @Request() req) {
    return this.chatsService.createChat(createChatDto, req.user._id);
  }

  /**
   * POST /chats/find-or-check/:userId - Find existing chat with user
   * Используется для preview режима - проверяет существует ли чат с пользователем
   * Возвращает чат если существует, или null если не существует
   */
  @Post('find-or-check/:userId')
  async findOrCheckChat(@Param('userId') otherUserId: string, @Request() req) {
    const chat = await this.chatsService.findExistingPersonalChat(
      req.user._id,
      otherUserId,
    );

    return {
      exists: !!chat,
      chat: chat || null,
    };
  }

  /**
   * GET /chats/:id - Get chat by ID
   */
  @Get(':id')
  async getChatById(@Param('id') chatId: string, @Request() req) {
    return this.chatsService.getChatById(chatId, req.user._id);
  }

  /**
   * DELETE /chats/:id - Delete chat (soft delete)
   */
  @Delete(':id')
  async deleteChat(@Param('id') chatId: string, @Request() req) {
    return this.chatsService.deleteChat(chatId, req.user._id);
  }
}
