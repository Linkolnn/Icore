import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface CallTokenPayload {
  userId: string;
  callId: string;
  chatId: string;
  permissions: {
    canJoin: boolean;
    canInitiate: boolean;
    canScreenShare: boolean;
  };
  exp: number;
}

@Injectable()
export class CallTokenService {
  private readonly secret = process.env.CALL_TOKEN_SECRET || 'default-call-secret-change-in-production';
  private readonly tokenLifetime = 3600; // 1 hour

  /**
   * Generate a call token for user
   */
  generateCallToken(
    userId: string,
    callId: string,
    chatId: string,
    permissions: CallTokenPayload['permissions'] = {
      canJoin: true,
      canInitiate: false,
      canScreenShare: true,
    },
  ): string {
    const payload: CallTokenPayload = {
      userId,
      callId,
      chatId,
      permissions,
      exp: Math.floor(Date.now() / 1000) + this.tokenLifetime,
    };

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
    });
  }

  /**
   * Verify call token
   */
  verifyCallToken(token: string): CallTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as CallTokenPayload;
      
      // Additional verification
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh an existing token
   */
  refreshToken(oldToken: string): string | null {
    const decoded = this.verifyCallToken(oldToken);
    if (!decoded) return null;

    return this.generateCallToken(
      decoded.userId,
      decoded.callId,
      decoded.chatId,
      decoded.permissions,
    );
  }

  /**
   * Generate TURN server credentials
   */
  generateTurnCredentials(userId: string): {
    username: string;
    credential: string;
    urls: string[];
  } {
    const turnServerUrl = process.env.TURN_SERVER_URL || 'turn:turn.example.com:3478';
    const turnUsername = process.env.TURN_USERNAME || 'default';
    const turnPassword = process.env.TURN_PASSWORD || 'password';

    // For production, implement time-limited credentials
    // For now, return static credentials
    return {
      username: turnUsername,
      credential: turnPassword,
      urls: [turnServerUrl],
    };
  }

  /**
   * Get ICE servers configuration
   */
  getIceServers(userId?: string): RTCIceServer[] {
    const servers: RTCIceServer[] = [
      {
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
      },
    ];

    // Add TURN server if configured
    if (process.env.TURN_SERVER_URL) {
      const turnCredentials = this.generateTurnCredentials(userId || 'anonymous');
      servers.push({
        urls: turnCredentials.urls,
        username: turnCredentials.username,
        credential: turnCredentials.credential,
      });
    }

    return servers;
  }
}
