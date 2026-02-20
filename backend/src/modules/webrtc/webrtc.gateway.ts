import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../websocket/guards/ws-jwt.guard';
import { WebRTCRedisService } from './webrtc-redis.service';
import { CallTokenService } from './call-token.service';
import { ChatsService } from '../chats/chats.service';

interface CallInitiateData {
  chatId: string;
  type: 'audio' | 'video';
}

interface CallJoinData {
  callId: string;
}

interface CallOfferData {
  callId: string;
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
}

interface CallAnswerData {
  callId: string;
  targetUserId: string;
  answer: RTCSessionDescriptionInit;
}

interface ICECandidateData {
  callId: string;
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

interface MediaToggleData {
  callId: string;
  type: 'audio' | 'video';
  enabled: boolean;
}

@Injectable()
@WebSocketGateway({
  namespace: 'calls',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class WebRTCGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly webrtcRedis: WebRTCRedisService,
    private readonly callToken: CallTokenService,
    private readonly chatsService: ChatsService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    console.log('WebRTC Gateway initialized');
  }

  async handleConnection(client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect();
      return;
    }

    // Join user's personal room for call notifications
    client.join(`user-${userId}`);
    console.log(`User ${userId} connected to calls namespace`);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    // Check if user was in any active calls
    // and handle disconnection
    console.log(`User ${userId} disconnected from calls namespace`);
  }

  /**
   * Initiate a call
   */
  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CallInitiateData,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Verify user is participant of chat
      const isParticipant = await this.chatsService.isParticipant(
        data.chatId,
        userId,
      );

      if (!isParticipant) {
        return { success: false, error: 'Not a chat participant' };
      }

      // Check if user is already in a call
      const isInCall = await this.webrtcRedis.isUserInActiveCall(userId);
      if (isInCall) {
        return { success: false, error: 'Already in another call' };
      }

      // Get chat participants
      const participants = await this.chatsService.getChatParticipants(data.chatId);

      // Create call session
      const callId = await this.webrtcRedis.createCallSession(
        data.chatId,
        userId,
        data.type,
        participants,
      );

      // Generate call token
      const token = this.callToken.generateCallToken(
        userId,
        callId,
        data.chatId,
        {
          canJoin: true,
          canInitiate: true,
          canScreenShare: true,
        },
      );

      // Get ICE servers
      const iceServers = this.callToken.getIceServers(userId);

      // Join call room
      client.join(`call-${callId}`);

      // Notify other participants
      participants.forEach((participantId: string) => {
        if (participantId !== userId) {
          this.server.to(`user-${participantId}`).emit('call:incoming', {
            callId,
            chatId: data.chatId,
            type: data.type,
            initiatorId: userId,
            token: this.callToken.generateCallToken(
              participantId,
              callId,
              data.chatId,
            ),
          });
        }
      });

      return {
        success: true,
        callId,
        token,
        iceServers,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Join an existing call
   */
  @SubscribeMessage('call:join')
  async handleCallJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CallJoinData,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Get call session
      const session = await this.webrtcRedis.getCallSession(data.callId);
      if (!session) {
        return { success: false, error: 'Call not found' };
      }

      // Verify user is participant
      const isParticipant = await this.chatsService.isParticipant(
        session.chatId,
        userId,
      );

      if (!isParticipant) {
        return { success: false, error: 'Not authorized for this call' };
      }

      // Update participant status
      await this.webrtcRedis.updateParticipantStatus(data.callId, userId, {
        status: 'joining',
        joinedAt: new Date(),
      });

      // Join call room
      client.join(`call-${data.callId}`);

      // Notify other participants
      client.to(`call-${data.callId}`).emit('call:participant-joined', {
        callId: data.callId,
        userId,
      });

      // Get ICE servers
      const iceServers = this.callToken.getIceServers(userId);

      return {
        success: true,
        callId: data.callId,
        session,
        iceServers,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WebRTC offer
   */
  @SubscribeMessage('call:offer')
  async handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CallOfferData,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Store offer
      await this.webrtcRedis.storeSDP(
        data.callId,
        userId,
        'offer',
        JSON.stringify(data.offer),
      );

      // Send to target user
      this.server.to(`user-${data.targetUserId}`).emit('call:offer', {
        callId: data.callId,
        fromUserId: userId,
        offer: data.offer,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WebRTC answer
   */
  @SubscribeMessage('call:answer')
  async handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CallAnswerData,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Store answer
      await this.webrtcRedis.storeSDP(
        data.callId,
        userId,
        'answer',
        JSON.stringify(data.answer),
      );

      // Update participant status to connected
      await this.webrtcRedis.updateParticipantStatus(data.callId, userId, {
        status: 'connected',
      });

      // Send to target user
      this.server.to(`user-${data.targetUserId}`).emit('call:answer', {
        callId: data.callId,
        fromUserId: userId,
        answer: data.answer,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send ICE candidate
   */
  @SubscribeMessage('call:ice-candidate')
  async handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ICECandidateData,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Store ICE candidate
      await this.webrtcRedis.addICECandidate(
        data.callId,
        userId,
        data.candidate,
      );

      // Send to target user
      this.server.to(`user-${data.targetUserId}`).emit('call:ice-candidate', {
        callId: data.callId,
        fromUserId: userId,
        candidate: data.candidate,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle media (mute/unmute, camera on/off)
   */
  @SubscribeMessage('call:toggle-media')
  async handleMediaToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaToggleData,
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Update participant status
      const updates =
        data.type === 'audio'
          ? { isMuted: !data.enabled }
          : { isVideoOn: data.enabled };

      await this.webrtcRedis.updateParticipantStatus(
        data.callId,
        userId,
        updates,
      );

      // Notify other participants
      client.to(`call-${data.callId}`).emit('call:media-toggled', {
        callId: data.callId,
        userId,
        type: data.type,
        enabled: data.enabled,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Start screen sharing
   */
  @SubscribeMessage('call:screen-share-start')
  async handleScreenShareStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Update participant status
      await this.webrtcRedis.updateParticipantStatus(data.callId, userId, {
        isScreenSharing: true,
      });

      // Notify other participants
      client.to(`call-${data.callId}`).emit('call:screen-share-started', {
        callId: data.callId,
        userId,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop screen sharing
   */
  @SubscribeMessage('call:screen-share-stop')
  async handleScreenShareStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Update participant status
      await this.webrtcRedis.updateParticipantStatus(data.callId, userId, {
        isScreenSharing: false,
      });

      // Notify other participants
      client.to(`call-${data.callId}`).emit('call:screen-share-stopped', {
        callId: data.callId,
        userId,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave call
   */
  @SubscribeMessage('call:leave')
  async handleCallLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Remove participant from call
      await this.webrtcRedis.removeParticipant(data.callId, userId);

      // Leave call room
      client.leave(`call-${data.callId}`);

      // Notify other participants
      client.to(`call-${data.callId}`).emit('call:participant-left', {
        callId: data.callId,
        userId,
      });

      // Check if call should end
      const session = await this.webrtcRedis.getCallSession(data.callId);
      if (session && session.status === 'ended') {
        this.server.to(`call-${data.callId}`).emit('call:ended', {
          callId: data.callId,
          reason: 'all_participants_left',
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * End call (by initiator or admin)
   */
  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Get call session
      const session = await this.webrtcRedis.getCallSession(data.callId);
      if (!session) {
        return { success: false, error: 'Call not found' };
      }

      // Verify user is initiator
      if (session.initiatorId !== userId) {
        return { success: false, error: 'Not authorized to end call' };
      }

      // End call
      await this.webrtcRedis.endCall(data.callId);

      // Notify all participants
      this.server.to(`call-${data.callId}`).emit('call:ended', {
        callId: data.callId,
        reason: 'ended_by_initiator',
      });

      // Remove everyone from room
      const sockets = await this.server.in(`call-${data.callId}`).fetchSockets();
      sockets.forEach((socket) => {
        socket.leave(`call-${data.callId}`);
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
