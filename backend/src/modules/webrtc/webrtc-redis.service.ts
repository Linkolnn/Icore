import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { nanoid } from 'nanoid';

export interface CallSession {
  callId: string;
  chatId: string;
  type: 'audio' | 'video';
  initiatorId: string;
  participants: CallParticipant[];
  status: 'pending' | 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
}

export interface CallParticipant {
  userId: string;
  status: 'invited' | 'joining' | 'connected' | 'disconnected';
  joinedAt?: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
}

@Injectable()
export class WebRTCRedisService {
  private readonly CALL_TTL = 12 * 60 * 60; // 12 hours in seconds
  private readonly SESSION_PREFIX = 'call:';
  private readonly SDP_PREFIX = 'sdp:';
  private readonly ICE_PREFIX = 'ice:';
  private redis: Redis;

  constructor(private readonly redisService: RedisService) {
    // We'll get the default redis client
    this.redis = this.redisService.getOrThrow();
  }

  /**
   * Create a new call session
   */
  async createCallSession(
    chatId: string,
    initiatorId: string,
    type: 'audio' | 'video',
    participantIds: string[],
  ): Promise<string> {
    const callId = nanoid();
    const session: CallSession = {
      callId,
      chatId,
      type,
      initiatorId,
      participants: [
        {
          userId: initiatorId,
          status: 'connected',
          joinedAt: new Date(),
          isMuted: false,
          isVideoOn: type === 'video',
          isScreenSharing: false,
        },
        ...participantIds.filter(id => id !== initiatorId).map(userId => ({
          userId,
          status: 'invited' as const,
          isMuted: false,
          isVideoOn: false,
          isScreenSharing: false,
        })),
      ],
      status: 'pending',
      startedAt: new Date(),
    };

    const key = `${this.SESSION_PREFIX}${callId}`;
    await this.redis.set(key, JSON.stringify(session), 'EX', this.CALL_TTL);
    
    // Create index for chat
    await this.redis.sadd(`${this.SESSION_PREFIX}chat:${chatId}`, callId);
    await this.redis.expire(`${this.SESSION_PREFIX}chat:${chatId}`, this.CALL_TTL);

    return callId;
  }

  /**
   * Get call session
   */
  async getCallSession(callId: string): Promise<CallSession | null> {
    const key = `${this.SESSION_PREFIX}${callId}`;
    const data = await this.redis.get(key);
    
    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Update call session
   */
  async updateCallSession(callId: string, updates: Partial<CallSession>): Promise<void> {
    const session = await this.getCallSession(callId);
    
    if (!session) {
      throw new Error('Call session not found');
    }

    const updatedSession = { ...session, ...updates };
    const key = `${this.SESSION_PREFIX}${callId}`;
    
    await this.redis.set(key, JSON.stringify(updatedSession), 'EX', this.CALL_TTL);
  }

  /**
   * Update participant status
   */
  async updateParticipantStatus(
    callId: string,
    userId: string,
    status: Partial<CallParticipant>,
  ): Promise<void> {
    const session = await this.getCallSession(callId);
    
    if (!session) {
      throw new Error('Call session not found');
    }

    let participant = session.participants.find(p => p.userId === userId);
    
    if (!participant) {
      // Add new participant if not exists
      participant = {
        userId,
        status: 'joining',
        isMuted: false,
        isVideoOn: false,
        isScreenSharing: false,
        ...status,
      };
      session.participants.push(participant);
    } else {
      // Update existing participant
      Object.assign(participant, status);
    }

    // Update session status if needed
    if (session.status === 'pending') {
      const connectedCount = session.participants.filter(
        p => p.status === 'connected',
      ).length;
      
      if (connectedCount >= 2) {
        session.status = 'active';
      }
    }

    await this.updateCallSession(callId, session);
  }

  /**
   * Store SDP offer/answer
   */
  async storeSDP(
    callId: string,
    userId: string,
    type: 'offer' | 'answer',
    sdp: string,
  ): Promise<void> {
    const key = `${this.SDP_PREFIX}${callId}:${userId}:${type}`;
    await this.redis.set(key, sdp, 'EX', this.CALL_TTL);
  }

  /**
   * Get SDP offer/answer
   */
  async getSDP(
    callId: string,
    userId: string,
    type: 'offer' | 'answer',
  ): Promise<string | null> {
    const key = `${this.SDP_PREFIX}${callId}:${userId}:${type}`;
    return await this.redis.get(key);
  }

  /**
   * Add ICE candidate
   */
  async addICECandidate(
    callId: string,
    userId: string,
    candidate: any,
  ): Promise<void> {
    const key = `${this.ICE_PREFIX}${callId}:${userId}`;
    await this.redis.rpush(key, JSON.stringify(candidate));
    await this.redis.expire(key, this.CALL_TTL);
  }

  /**
   * Get ICE candidates
   */
  async getICECandidates(callId: string, userId: string): Promise<any[]> {
    const key = `${this.ICE_PREFIX}${callId}:${userId}`;
    const candidates = await this.redis.lrange(key, 0, -1);
    return candidates.map(c => JSON.parse(c));
  }

  /**
   * Remove participant from call
   */
  async removeParticipant(callId: string, userId: string): Promise<void> {
    const session = await this.getCallSession(callId);
    
    if (!session) {
      return;
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.status = 'disconnected';
      participant.leftAt = new Date();
    }

    // Check if call should end
    const activeParticipants = session.participants.filter(
      p => p.status === 'connected' || p.status === 'joining',
    );

    if (activeParticipants.length === 0) {
      session.status = 'ended';
      session.endedAt = new Date();
    }

    await this.updateCallSession(callId, session);
  }

  /**
   * End call
   */
  async endCall(callId: string): Promise<void> {
    const session = await this.getCallSession(callId);
    
    if (!session) {
      return;
    }

    session.status = 'ended';
    session.endedAt = new Date();
    
    // Mark all participants as disconnected
    session.participants.forEach(p => {
      if (p.status !== 'disconnected') {
        p.status = 'disconnected';
        p.leftAt = new Date();
      }
    });

    await this.updateCallSession(callId, session);
    
    // Clean up related data
    await this.cleanupCallData(callId);
  }

  /**
   * Clean up all call-related data
   */
  private async cleanupCallData(callId: string): Promise<void> {
    const session = await this.getCallSession(callId);
    if (!session) return;

    const keys: string[] = [];
    
    // Collect all keys to delete
    session.participants.forEach(p => {
      keys.push(
        `${this.SDP_PREFIX}${callId}:${p.userId}:offer`,
        `${this.SDP_PREFIX}${callId}:${p.userId}:answer`,
        `${this.ICE_PREFIX}${callId}:${p.userId}`,
      );
    });

    // Delete all keys
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    // Remove from chat index
    await this.redis.srem(`${this.SESSION_PREFIX}chat:${session.chatId}`, callId);
  }

  /**
   * Get active calls for a chat
   */
  async getActiveCallsForChat(chatId: string): Promise<CallSession[]> {
    const callIds = await this.redis.smembers(`${this.SESSION_PREFIX}chat:${chatId}`);
    const calls: CallSession[] = [];

    for (const callId of callIds) {
      const session = await this.getCallSession(callId);
      if (session && session.status !== 'ended') {
        calls.push(session);
      }
    }

    return calls;
  }

  /**
   * Check if user is in any active call
   */
  async isUserInActiveCall(userId: string): Promise<boolean> {
    // This would need an additional index for efficiency
    // For now, we'll scan through active calls (not ideal for production)
    const keys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
    
    for (const key of keys) {
      if (key.includes('chat:')) continue; // Skip index keys
      
      const data = await this.redis.get(key);
      if (!data) continue;
      
      const session: CallSession = JSON.parse(data);
      if (session.status === 'ended') continue;
      
      const participant = session.participants.find(
        p => p.userId === userId && 
        (p.status === 'connected' || p.status === 'joining'),
      );
      
      if (participant) {
        return true;
      }
    }

    return false;
  }
}
