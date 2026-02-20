# 📞 WebRTC Звонки - Детальная реализация

## 🎯 Архитектура WebRTC

### Компоненты системы
1. **Signaling Server** - WebSocket для обмена SDP и ICE
2. **STUN Server** - определение публичного IP
3. **TURN Server** - relay трафика при невозможности P2P
4. **Redis** - хранение сессий звонков
5. **Client WebRTC** - браузерная реализация

---

## 💻 Backend Implementation

### 1. WebRTC Module Structure

```typescript
// backend/src/modules/webrtc/webrtc.module.ts

import { Module } from '@nestjs/common';
import { WebRTCGateway } from './webrtc.gateway';
import { WebRTCRedisService } from './webrtc-redis.service';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [ChatsModule],
  providers: [WebRTCGateway, WebRTCRedisService],
  exports: [WebRTCRedisService],
})
export class WebRTCModule {}
```

### 2. Redis Service для управления сессиями

```typescript
// backend/src/modules/webrtc/webrtc-redis.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

interface CallSession {
  callId: string;
  chatId: string;
  type: 'audio' | 'video';
  initiatorId: string;
  status: 'initiating' | 'ringing' | 'active' | 'ended';
  participants: CallParticipant[];
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  iceServers: IceServer[];
  settings: CallSettings;
}

interface CallParticipant {
  userId: string;
  status: 'invited' | 'connecting' | 'connected' | 'disconnected';
  joinedAt?: string;
  leftAt?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  connectionQuality?: 'excellent' | 'good' | 'poor';
}

interface CallSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  screenShareEnabled: boolean;
  chatEnabled: boolean;
}

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

@Injectable()
export class WebRTCRedisService {
  private readonly CALL_TTL = 12 * 60 * 60; // 12 часов
  private readonly KEY_PREFIX = 'call:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Создание новой сессии звонка
   */
  async createCallSession(
    chatId: string,
    initiatorId: string,
    type: 'audio' | 'video',
    participants: string[]
  ): Promise<string> {
    const callId = this.generateCallId();
    const sessionKey = this.getSessionKey(callId);

    const session: CallSession = {
      callId,
      chatId,
      type,
      initiatorId,
      status: 'initiating',
      participants: participants.map(userId => ({
        userId,
        status: userId === initiatorId ? 'connecting' : 'invited',
        joinedAt: userId === initiatorId ? new Date().toISOString() : undefined,
        isMuted: false,
        isVideoOn: type === 'video',
        isScreenSharing: false
      })),
      createdAt: new Date().toISOString(),
      iceServers: this.getIceServers(),
      settings: {
        maxParticipants: participants.length <= 2 ? 2 : 10,
        recordingEnabled: false,
        screenShareEnabled: true,
        chatEnabled: true
      }
    };

    // Сохраняем в Redis с TTL
    await this.redis.setex(
      sessionKey,
      this.CALL_TTL,
      JSON.stringify(session)
    );

    // Создаем индекс для быстрого поиска по chatId
    await this.redis.setex(
      `${this.KEY_PREFIX}chat:${chatId}`,
      this.CALL_TTL,
      callId
    );

    return callId;
  }

  /**
   * Получение сессии звонка
   */
  async getCallSession(callId: string): Promise<CallSession | null> {
    const sessionKey = this.getSessionKey(callId);
    const data = await this.redis.get(sessionKey);

    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse call session:', error);
      return null;
    }
  }

  /**
   * Обновление статуса участника
   */
  async updateParticipantStatus(
    callId: string,
    userId: string,
    status: Partial<CallParticipant>
  ): Promise<boolean> {
    const session = await this.getCallSession(callId);
    if (!session) return false;

    const participantIndex = session.participants.findIndex(
      p => p.userId === userId
    );

    if (participantIndex === -1) {
      // Добавляем нового участника если его нет
      session.participants.push({
        userId,
        status: 'connecting',
        joinedAt: new Date().toISOString(),
        isMuted: false,
        isVideoOn: session.type === 'video',
        isScreenSharing: false,
        ...status
      });
    } else {
      // Обновляем существующего
      session.participants[participantIndex] = {
        ...session.participants[participantIndex],
        ...status
      };
    }

    // Обновляем статус звонка
    const connectedCount = session.participants.filter(
      p => p.status === 'connected'
    ).length;

    if (connectedCount >= 2 && session.status !== 'active') {
      session.status = 'active';
      session.startedAt = new Date().toISOString();
    }

    // Сохраняем обновленную сессию
    const sessionKey = this.getSessionKey(callId);
    await this.redis.setex(
      sessionKey,
      this.CALL_TTL,
      JSON.stringify(session)
    );

    return true;
  }

  /**
   * Сохранение SDP (offer/answer)
   */
  async storeSDP(
    callId: string,
    userId: string,
    type: 'offer' | 'answer',
    sdp: string
  ): Promise<void> {
    const key = `${this.KEY_PREFIX}${callId}:sdp:${userId}:${type}`;
    await this.redis.setex(key, this.CALL_TTL, sdp);
  }

  /**
   * Получение SDP
   */
  async getSDP(
    callId: string,
    userId: string,
    type: 'offer' | 'answer'
  ): Promise<string | null> {
    const key = `${this.KEY_PREFIX}${callId}:sdp:${userId}:${type}`;
    return await this.redis.get(key);
  }

  /**
   * Добавление ICE кандидата
   */
  async addICECandidate(
    callId: string,
    userId: string,
    candidate: any
  ): Promise<void> {
    const key = `${this.KEY_PREFIX}${callId}:ice:${userId}`;
    await this.redis.rpush(key, JSON.stringify(candidate));
    await this.redis.expire(key, this.CALL_TTL);
  }

  /**
   * Получение ICE кандидатов
   */
  async getICECandidates(
    callId: string,
    userId: string
  ): Promise<any[]> {
    const key = `${this.KEY_PREFIX}${callId}:ice:${userId}`;
    const candidates = await this.redis.lrange(key, 0, -1);
    return candidates.map(c => {
      try {
        return JSON.parse(c);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Завершение звонка
   */
  async endCall(callId: string): Promise<void> {
    const session = await this.getCallSession(callId);
    if (session) {
      session.status = 'ended';
      session.endedAt = new Date().toISOString();

      // Сохраняем финальное состояние
      const sessionKey = this.getSessionKey(callId);
      await this.redis.setex(
        sessionKey,
        300, // Храним завершенные звонки 5 минут
        JSON.stringify(session)
      );

      // Удаляем индекс
      await this.redis.del(`${this.KEY_PREFIX}chat:${session.chatId}`);
    }

    // Удаляем все связанные ключи
    await this.cleanupCallData(callId);
  }

  /**
   * Очистка данных звонка
   */
  private async cleanupCallData(callId: string): Promise<void> {
    const pattern = `${this.KEY_PREFIX}${callId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Проверка активного звонка в чате
   */
  async getActiveChatCall(chatId: string): Promise<string | null> {
    const callId = await this.redis.get(`${this.KEY_PREFIX}chat:${chatId}`);
    if (!callId) return null;

    const session = await this.getCallSession(callId);
    if (!session || session.status === 'ended') {
      return null;
    }

    return callId;
  }

  /**
   * Генерация уникального ID звонка
   */
  private generateCallId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Получение ключа сессии
   */
  private getSessionKey(callId: string): string {
    return `${this.KEY_PREFIX}${callId}:session`;
  }

  /**
   * Получение ICE серверов
   */
  private getIceServers(): IceServer[] {
    const servers: IceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // Добавляем TURN сервер если настроен
    if (process.env.TURN_SERVER_URL) {
      servers.push({
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_USERNAME || '',
        credential: process.env.TURN_PASSWORD || '',
      });
    }

    return servers;
  }

  /**
   * Генерация токена для аутентификации звонка
   */
  generateCallToken(userId: string, callId: string): string {
    const payload = {
      userId,
      callId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex'),
    };

    const secret = process.env.CALL_TOKEN_SECRET || 'default-secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64');
  }

  /**
   * Проверка токена звонка
   */
  verifyCallToken(token: string): { userId: string; callId: string } | null {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { signature, ...payload } = decoded;

      const secret = process.env.CALL_TOKEN_SECRET || 'default-secret';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        return null;
      }

      // Проверяем срок действия (1 час)
      if (Date.now() - payload.timestamp > 3600000) {
        return null;
      }

      return { userId: payload.userId, callId: payload.callId };
    } catch (error) {
      return null;
    }
  }
}
```

### 3. WebRTC Gateway для сигналинга

```typescript
// backend/src/modules/webrtc/webrtc.gateway.ts

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WebRTCRedisService } from './webrtc-redis.service';
import { ChatsService } from '../chats/chats.service';

@WebSocketGateway({
  namespace: '/calls',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class WebRTCGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Отслеживаем активные звонки пользователей
  private userCalls = new Map<string, string>();

  constructor(
    private readonly webrtcService: WebRTCRedisService,
    private readonly chatsService: ChatsService,
  ) {}

  /**
   * Инициация звонка
   */
  @SubscribeMessage('call:initiate')
  async handleInitiateCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      chatId: string;
      type: 'audio' | 'video';
    }
  ) {
    const userId = client.data.userId;

    try {
      // Проверяем, есть ли уже активный звонок в чате
      const existingCall = await this.webrtcService.getActiveChatCall(data.chatId);
      if (existingCall) {
        // Присоединяемся к существующему звонку
        return await this.handleJoinCall(client, { callId: existingCall });
      }

      // Проверяем права доступа
      const chat = await this.chatsService.getChatById(data.chatId);
      const participant = chat.participants.find(
        p => p.user._id.toString() === userId
      );

      if (!participant || !participant.permissions.canStartCall) {
        return { error: 'No permission to start call' };
      }

      // Получаем список участников
      const participantIds = chat.participants.map(
        p => p.user._id.toString()
      );

      // Создаем сессию звонка
      const callId = await this.webrtcService.createCallSession(
        data.chatId,
        userId,
        data.type,
        participantIds
      );

      // Присоединяем инициатора к комнате звонка
      client.join(`call:${callId}`);
      this.userCalls.set(userId, callId);

      // Уведомляем всех участников чата о входящем звонке
      for (const participant of chat.participants) {
        const participantId = participant.user._id.toString();
        if (participantId !== userId) {
          this.server.to(`user:${participantId}`).emit('call:incoming', {
            callId,
            chatId: data.chatId,
            chatName: chat.name || 'Личный чат',
            callerId: userId,
            callerName: client.data.username,
            type: data.type,
          });
        }
      }

      // Генерируем токен для звонка
      const token = this.webrtcService.generateCallToken(userId, callId);

      return {
        callId,
        token,
        iceServers: (await this.webrtcService.getCallSession(callId))?.iceServers,
      };
    } catch (error) {
      console.error('Failed to initiate call:', error);
      return { error: 'Failed to initiate call' };
    }
  }

  /**
   * Присоединение к звонку
   */
  @SubscribeMessage('call:join')
  async handleJoinCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; token?: string }
  ) {
    const userId = client.data.userId;

    try {
      // Получаем сессию
      const session = await this.webrtcService.getCallSession(data.callId);
      if (!session) {
        return { error: 'Call not found' };
      }

      // Проверяем права
      const chat = await this.chatsService.getChatById(session.chatId);
      const isParticipant = chat.participants.some(
        p => p.user._id.toString() === userId
      );

      if (!isParticipant) {
        return { error: 'Not a chat participant' };
      }

      // Обновляем статус участника
      await this.webrtcService.updateParticipantStatus(data.callId, userId, {
        status: 'connecting',
        joinedAt: new Date().toISOString(),
      });

      // Присоединяем к комнате
      client.join(`call:${data.callId}`);
      this.userCalls.set(userId, data.callId);

      // Уведомляем других участников
      client.to(`call:${data.callId}`).emit('call:participant-joined', {
        userId,
        username: client.data.username,
      });

      // Генерируем токен
      const token = this.webrtcService.generateCallToken(userId, data.callId);

      return {
        callId: data.callId,
        token,
        session: {
          ...session,
          participants: session.participants.filter(p => p.userId !== userId),
        },
      };
    } catch (error) {
      console.error('Failed to join call:', error);
      return { error: 'Failed to join call' };
    }
  }

  /**
   * Отклонение звонка
   */
  @SubscribeMessage('call:decline')
  async handleDeclineCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string }
  ) {
    const userId = client.data.userId;

    await this.webrtcService.updateParticipantStatus(data.callId, userId, {
      status: 'disconnected',
      leftAt: new Date().toISOString(),
    });

    client.to(`call:${data.callId}`).emit('call:participant-declined', {
      userId,
      username: client.data.username,
    });
  }

  /**
   * WebRTC Offer
   */
  @SubscribeMessage('call:offer')
  async handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      callId: string;
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
    }
  ) {
    const userId = client.data.userId;

    // Сохраняем offer
    await this.webrtcService.storeSDP(
      data.callId,
      userId,
      'offer',
      data.offer.sdp
    );

    // Отправляем целевому пользователю
    this.server.to(`user:${data.targetUserId}`).emit('call:offer', {
      callId: data.callId,
      userId,
      offer: data.offer,
    });
  }

  /**
   * WebRTC Answer
   */
  @SubscribeMessage('call:answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      callId: string;
      targetUserId: string;
      answer: RTCSessionDescriptionInit;
    }
  ) {
    const userId = client.data.userId;

    // Сохраняем answer
    await this.webrtcService.storeSDP(
      data.callId,
      userId,
      'answer',
      data.answer.sdp
    );

    // Обновляем статус на connected
    await this.webrtcService.updateParticipantStatus(data.callId, userId, {
      status: 'connected',
    });

    // Отправляем целевому пользователю
    this.server.to(`user:${data.targetUserId}`).emit('call:answer', {
      callId: data.callId,
      userId,
      answer: data.answer,
    });
  }

  /**
   * ICE Candidate
   */
  @SubscribeMessage('call:ice-candidate')
  async handleICECandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      callId: string;
      targetUserId: string;
      candidate: RTCIceCandidateInit;
    }
  ) {
    const userId = client.data.userId;

    // Сохраняем кандидата
    await this.webrtcService.addICECandidate(
      data.callId,
      userId,
      data.candidate
    );

    // Отправляем целевому пользователю
    this.server.to(`user:${data.targetUserId}`).emit('call:ice-candidate', {
      callId: data.callId,
      userId,
      candidate: data.candidate,
    });
  }

  /**
   * Переключение медиа (mute/video)
   */
  @SubscribeMessage('call:toggle-media')
  async handleToggleMedia(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      callId: string;
      type: 'audio' | 'video';
      enabled: boolean;
    }
  ) {
    const userId = client.data.userId;

    // Обновляем статус
    const update = data.type === 'audio'
      ? { isMuted: !data.enabled }
      : { isVideoOn: data.enabled };

    await this.webrtcService.updateParticipantStatus(data.callId, userId, update);

    // Уведомляем других участников
    client.to(`call:${data.callId}`).emit('call:media-toggled', {
      userId,
      type: data.type,
      enabled: data.enabled,
    });
  }

  /**
   * Демонстрация экрана
   */
  @SubscribeMessage('call:screen-share')
  async handleScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      callId: string;
      enabled: boolean;
    }
  ) {
    const userId = client.data.userId;

    await this.webrtcService.updateParticipantStatus(data.callId, userId, {
      isScreenSharing: data.enabled,
    });

    client.to(`call:${data.callId}`).emit('call:screen-share-toggled', {
      userId,
      enabled: data.enabled,
    });
  }

  /**
   * Покидание звонка
   */
  @SubscribeMessage('call:leave')
  async handleLeaveCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string }
  ) {
    const userId = client.data.userId;

    await this.handleUserLeaveCall(userId, data.callId);

    client.leave(`call:${data.callId}`);
    this.userCalls.delete(userId);

    // Уведомляем других участников
    client.to(`call:${data.callId}`).emit('call:participant-left', {
      userId,
      username: client.data.username,
    });
  }

  /**
   * Обработка отключения
   */
  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;

    // Проверяем, был ли пользователь в звонке
    const callId = this.userCalls.get(userId);
    if (callId) {
      await this.handleUserLeaveCall(userId, callId);
      this.userCalls.delete(userId);

      // Уведомляем участников звонка
      this.server.to(`call:${callId}`).emit('call:participant-disconnected', {
        userId,
      });
    }
  }

  /**
   * Обработка выхода пользователя из звонка
   */
  private async handleUserLeaveCall(userId: string, callId: string) {
    // Обновляем статус участника
    await this.webrtcService.updateParticipantStatus(callId, userId, {
      status: 'disconnected',
      leftAt: new Date().toISOString(),
    });

    // Проверяем, остались ли активные участники
    const session = await this.webrtcService.getCallSession(callId);
    if (session) {
      const activeParticipants = session.participants.filter(
        p => p.status === 'connected' || p.status === 'connecting'
      );

      // Если никого не осталось, завершаем звонок
      if (activeParticipants.length === 0) {
        await this.webrtcService.endCall(callId);
        this.server.to(`call:${callId}`).emit('call:ended', {
          reason: 'all_participants_left',
        });
      }
    }
  }
}
```

---

## 🎨 Frontend WebRTC Implementation

Детальную реализацию frontend компонентов см. в [UI_COMPONENTS.md](UI_COMPONENTS.md)

---

## 🔐 Безопасность WebRTC

### Шифрование
- **DTLS-SRTP** автоматически для всех медиа потоков
- **Signaling через WSS** (WebSocket Secure)
- **Токены для аутентификации** звонков

### Проверки
- Участие в чате перед звонком
- Права на инициацию звонка
- Валидация SDP
- Rate limiting для сигналинга

---

## ✅ Чек-лист WebRTC

- [ ] Redis Service создан
- [ ] WebRTC Gateway реализован
- [ ] Сигналинг работает
- [ ] ICE candidates передаются
- [ ] TURN сервер настроен
- [ ] Токены генерируются
- [ ] Сессии сохраняются 12 часов
- [ ] Cleanup при disconnect
