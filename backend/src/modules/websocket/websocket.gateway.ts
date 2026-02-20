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
    @MessageBody() data: { chatId: string; text: string; forwarded?: any; replyTo?: string },
  ) {
    try {
      const userId = client.data.userId;
      const { chatId, text, forwarded, replyTo } = data;

      // Создаем сообщение через MessagesService (с проверками и sanitization)
      const message = await this.messagesService.create(
        { chat: chatId, text, forwarded, replyTo },
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
   * message:delivered - Пометить сообщение как доставленное
   */
  @SubscribeMessage('message:delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const userId = client.data.userId;
      const updatedMessage = await this.messagesService.markAsDelivered(
        data.messageId,
        userId,
      );

      if (updatedMessage) {
        // Уведомляем отправителя о доставке
        const senderId = updatedMessage.sender.toString();
        this.server.to(`user-${senderId}`).emit('message:status', {
          messageId: data.messageId,
          status: 'delivered',
          deliveredAt: updatedMessage.deliveredAt,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * message:read - Пометить сообщение как прочитанное
   */
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const userId = client.data.userId;
      const updatedMessage = await this.messagesService.markAsRead(
        data.messageId,
        userId,
      );

      if (updatedMessage) {
        // Уведомляем отправителя о прочтении
        const senderId = updatedMessage.sender.toString();
        this.server.to(`user-${senderId}`).emit('message:status', {
          messageId: data.messageId,
          status: 'read',
          readAt: updatedMessage.readAt,
          readBy: userId,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * typing:start - Начал печатать
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const userId = client.data.userId;
      
      // Транслируем всем в чате кроме отправителя
      client.to(`chat-${data.chatId}`).emit('typing:start', {
        chatId: data.chatId,
        userId,
      });

      // Автоматически останавливаем через 3 секунды
      setTimeout(() => {
        client.to(`chat-${data.chatId}`).emit('typing:stop', {
          chatId: data.chatId,
          userId,
        });
      }, 3000);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * typing:stop - Перестал печатать
   */
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const userId = client.data.userId;
      
      // Транслируем всем в чате кроме отправителя
      client.to(`chat-${data.chatId}`).emit('typing:stop', {
        chatId: data.chatId,
        userId,
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
      const result = await this.messagesService.markChatAsRead(
        payload.chatId,
        userId,
      );

      // Если были обновлены сообщения, уведомляем отправителей
      if (result.updatedCount > 0) {
        const messageIds = result.messages.map((m: any) => m._id.toString());
        // Отправляем событие ВСЕМ в комнате чата (включая читающего)
        this.server.to(`chat-${payload.chatId}`).emit('messages:read', {
          chatId: payload.chatId,
          readBy: userId,
          messageIds,
        });
      }

      return { 
        success: true, 
        updatedCount: result.updatedCount,
        messages: result.messages,
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
  
  /**
   * Эмитировать событие редактирования сообщения
   * Отправляется всем участникам чата и в их персональные комнаты
   */
  async emitMessageEdited(message: any) {
    const chatId = typeof message.chat === 'string' ? message.chat : message.chat._id;
    
    // Отправляем в комнату чата
    this.server.to(`chat-${chatId}`).emit('message:edited', message);
    
    // Отправляем в персональные комнаты участников для обновления lastMessage
    try {
      const participants = await this.chatsService.getChatParticipants(chatId);
      
      participants.forEach((participantId: string) => {
        this.server.to(`user-${participantId}`).emit('message:edited', message);
      });
    } catch (err) {
    }
  }
  
  /**
   * Эмитировать событие удаления сообщения
   * Отправляется всем участникам чата
   */
  async emitMessageDeleted(messageId: string, chatId: string, newLastMessage?: any) {
    
    // Подготавливаем данные для отправки
    const eventData = { 
      messageId, 
      chatId,
      newLastMessage: newLastMessage || null
    };
    
    // Отправляем в комнату чата
    this.server.to(`chat-${chatId}`).emit('message:deleted', eventData);
    
    // Отправляем в персональные комнаты участников для обновления lastMessage
    try {
      const participants = await this.chatsService.getChatParticipants(chatId);
      
      participants.forEach((participantId: string) => {
        this.server.to(`user-${participantId}`).emit('message:deleted', eventData);
      });
    } catch (err) {
    }
  }

  /**
   * Эмитировать событие создания группы
   */
  emitGroupCreated(group: any) {
    // Отправляем каждому участнику в его персональную комнату
    group.participants.forEach((participant: any) => {
      const userId = participant.user?._id || participant.user || participant;
      this.server.to(`user-${userId}`).emit('group:created', group);
    });
  }

  /**
   * Эмитировать событие добавления участника
   */
  emitMemberAdded(chatId: string, newMembers: any[]) {
    const event = {
      chatId,
      newMembers,
      timestamp: new Date(),
    };

    // Отправляем всем участникам чата
    this.server.to(`chat-${chatId}`).emit('group:member-added', event);

    // Отправляем новым участникам в персональные комнаты
    newMembers.forEach((member: any) => {
      const userId = member.user?._id || member.user || member;
      this.server.to(`user-${userId}`).emit('group:joined', { chatId });
    });
  }

  /**
   * Эмитировать событие удаления участника
   */
  emitMemberRemoved(chatId: string, removedUserId: string, isLeave: boolean = false) {
    const event = {
      chatId,
      removedUserId,
      isLeave,
      timestamp: new Date(),
    };

    // Отправляем всем участникам чата
    this.server.to(`chat-${chatId}`).emit('group:member-removed', event);

    // Отправляем удаленному участнику
    if (!isLeave) {
      this.server.to(`user-${removedUserId}`).emit('group:removed', { chatId });
    }
  }

  /**
   * Эмитировать событие изменения роли участника
   */
  emitRoleChanged(chatId: string, userId: string, newRole: string) {
    const event = {
      chatId,
      userId,
      newRole,
      timestamp: new Date(),
    };

    // Отправляем всем участникам чата
    this.server.to(`chat-${chatId}`).emit('group:role-changed', event);
  }

  /**
   * Эмитировать событие обновления информации о группе
   */
  emitGroupInfoUpdated(chatId: string, updates: any) {
    const event = {
      chatId,
      updates,
      timestamp: new Date(),
    };

    // Отправляем всем участникам чата
    this.server.to(`chat-${chatId}`).emit('group:info-updated', event);
  }

  /**
   * Обработчик: создание группы
   * Альтернативный способ создания группы через WebSocket
   */
  @SubscribeMessage('group:create')
  async handleGroupCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Создаем группу через сервис
      const group = await this.chatsService.createGroupChat(data, userId);

      // Присоединяем создателя к комнате чата
      client.join(`chat-${(group as any)._id}`);

      // Оповещаем всех участников
      this.emitGroupCreated(group);

      return { success: true, group };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
