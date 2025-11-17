import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { MessagesService } from '../messages/messages.service';
import { ChatsService } from '../chats/chats.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    @Inject(forwardRef(() => ChatsService))
    private chatsService: ChatsService,
  ) {}

  afterInit(server: Server) {
    // Передаем сервер в ChatsService для возможности отправки событий
    this.chatsService.setSocketServer(server);
  }

  /**
   * Подключение клиента
   * Извлекаем и валидируем JWT токен при подключении
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Валидируем токен и извлекаем userId
      try {
        const jwtService = this.messagesService['jwtService'] || require('@nestjs/jwt').JwtService;
        // Получаем JwtService через DI
        const payload = await this.verifyToken(token);
        // Сохраняем ID пользователя в контексте сокета
        client.data.userId = payload.sub;

        // ВАЖНО: Присоединяемся к персональной комнате пользователя
        // Это нужно для получения real-time обновлений списка чатов
        client.join(`user-${payload.sub}`);
      } catch (err) {
        client.disconnect();
      }
    } catch (error) {
      client.disconnect();
    }
  }

  /**
   * Вспомогательный метод для верификации токена
   */
  private async verifyToken(token: string): Promise<any> {
    // Используем секрет из env
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
  }

  /**
   * Отключение клиента
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      // Покидаем персональную комнату
      client.leave(`user-${userId}`);
    }
  }

  /**
   * user:join - Присоединиться к персональной комнате пользователя
   * Используется для получения обновлений списка чатов
   */
  @SubscribeMessage('user:join')
  async handleUserJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    try {
      const authUserId = client.data.userId;
      const { userId } = data;

      // Проверяем, что пользователь присоединяется к своей комнате
      if (authUserId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Присоединяемся к персональной комнате
      client.join(`user-${userId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * chat:join - Присоединиться к комнате чата
   */
  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const userId = client.data.userId;
      const { chatId } = data;

      // Проверка: является ли пользователь участником чата
      const isParticipant = await this.chatsService.isParticipant(
        chatId,
        userId,
      );
      if (!isParticipant) {
        return { success: false, error: 'Not a participant' };
      }

      // Присоединяемся к комнате чата
      client.join(`chat-${chatId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * chat:leave - Покинуть комнату чата
   */
  @SubscribeMessage('chat:leave')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const { chatId } = data;
      client.leave(`chat-${chatId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * message:send - Отправить сообщение
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; text: string },
  ) {
    try {
      const userId = client.data.userId;
      const { chatId, text } = data;

      // Создаем сообщение через MessagesService (с проверками и sanitization)
      const message = await this.messagesService.create(
        { chat: chatId, text },
        userId,
      );

      // Транслируем message:new всем в комнате чата
      this.server.to(`chat-${chatId}`).emit('message:new', message);
      
      // Также отправляем в персональные комнаты участников, которые НЕ в чате
      // чтобы обновить их список чатов
      const chat = await this.chatsService.getChatById(chatId, userId);
      if (chat && chat.participants) {
        // Получаем список сокетов в комнате чата
        const socketsInChat = await this.server.in(`chat-${chatId}`).allSockets();
        
        chat.participants.forEach((participant: any) => {
          const participantId = participant._id || participant;
          const participantIdStr = participantId.toString();
          
          // Проверяем, есть ли участник в комнате чата
          let isInChat = false;
          for (const socketId of socketsInChat) {
            const socket = this.server.sockets.sockets.get(socketId);
            // Используем toString() для обоих значений для корректного сравнения
            if (socket && socket.data.userId && socket.data.userId.toString() === participantIdStr) {
              isInChat = true;
              break;
            }
          }
          
          // Отправляем только тем, кто НЕ в чате
          if (!isInChat) {
            this.server.to(`user-${participantIdStr}`).emit('message:new', message);
          }
        });
      }

      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * message:typing - Индикатор набора
   */
  @SubscribeMessage('message:typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    try {
      const userId = client.data.userId;
      const { chatId, isTyping } = data;

      // Транслируем typing всем КРОМЕ отправителя
      client.to(`chat-${chatId}`).emit('message:typing', {
        chatId,
        userId,
        isTyping,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Обработчик: пометить сообщения как прочитанные
   */
  @SubscribeMessage('messages:read')
  async handleMessagesRead(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Проверка участия в чате
      const isParticipant = await this.chatsService.isParticipant(
        payload.chatId,
        userId,
      );
      if (!isParticipant) {
        return { success: false, error: 'You are not a participant' };
      }

      // Помечаем сообщения как прочитанные
      const result = await this.messagesService.markChatMessagesAsRead(
        payload.chatId,
        userId,
      );

      // Если были обновлены сообщения, уведомляем отправителей
      if (result.updatedCount > 0) {
        // Отправляем событие ВСЕМ в комнате чата (включая читающего)
        this.server.to(`chat-${payload.chatId}`).emit('messages:read', {
          chatId: payload.chatId,
          readBy: userId,
          messageIds: result.messageIds,
        });
      }

      return { 
        success: true, 
        updatedCount: result.updatedCount,
        messageIds: result.messageIds,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Вспомогательный метод: отправить chat:created участникам
   */
  emitChatCreated(chat: any) {
    // Отправляем каждому участнику в его персональную комнату
    chat.participants.forEach((participantId: string) => {
      this.server.to(`user-${participantId}`).emit('chat:created', chat);
    });
  }
}
