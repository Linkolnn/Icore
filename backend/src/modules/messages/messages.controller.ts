import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly wsGateway: WebsocketGateway,
  ) {}

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
   * GET /chats/:chatId/messages - Получить сообщения чата с cursor-based пагинацией
   * @param chatId - ID чата
   * @param before - Cursor (createdAt) для пагинации
   * @param limit - Количество сообщений
   */
  @Get('chats/:chatId')
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('before') before: string,
    @Query('limit') limit: string,
    @User() user: UserPayload,
  ) {
    const result = await this.messagesService.getMessagesPaginated(
      chatId,
      user.sub,
      before ? new Date(before) : undefined,
      parseInt(limit) || 50,
    );
    return result;
  }

  /**
   * GET /messages/search - Поиск сообщений
   * @param q - Поисковый запрос
   * @param chatId - ID чата (опционально)
   */
  @Get('search')
  async searchMessages(
    @Query('q') query: string,
    @Query('chatId') chatId: string,
    @Query('limit') limit: string,
    @User() user: UserPayload,
  ) {
    const result = await this.messagesService.searchMessages(
      user.sub,
      query,
      chatId,
      parseInt(limit) || 20,
    );
    return result;
  }

  /**
   * PATCH /messages/:id - Редактировать сообщение
   */
  @Patch(':id')
  async updateMessage(
    @Param('id') messageId: string,
    @Body('text') text: string,
    @User() user: UserPayload,
  ) {
    const message = await this.messagesService.editMessage(
      messageId,
      user.sub,
      text,
    );
    
    // Эмитируем событие об редактировании через WebSocket
    await this.wsGateway.emitMessageEdited(message);
    
    return { success: true, message };
  }

  /**
   * DELETE /messages/:id - Удалить сообщение (soft delete)
   */
  @Delete(':id')
  async delete(@Param('id') messageId: string, @User() user: UserPayload) {
    // Сначала получаем информацию о сообщении для получения chatId
    const message = await this.messagesService.findById(messageId);
    const chatId = typeof message.chat === 'string' 
      ? message.chat 
      : message.chat._id || message.chat;
    
    // Удаляем сообщение и получаем новое lastMessage
    const newLastMessage = await this.messagesService.softDelete(messageId, user.sub);
    
    
    // Эмитируем событие об удалении через WebSocket с новым lastMessage
    await this.wsGateway.emitMessageDeleted(messageId, chatId.toString(), newLastMessage);
    
    return { success: true, message: 'Message deleted' };
  }
}
