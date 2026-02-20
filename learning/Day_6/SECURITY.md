# 🔐 Security Implementation for Day 6

## 🎯 Security Overview

### Key Security Areas
1. **Group Chat Security** - роли, права, лимиты
2. **WebRTC Security** - шифрование, токены, TURN
3. **Data Validation** - санитизация, валидация
4. **Rate Limiting** - защита от спама
5. **Privacy** - защита персональных данных

---

## 🔒 Group Chat Security

### Role-Based Access Control (RBAC)

```typescript
// backend/src/modules/chats/guards/chat-permission.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ChatsService } from '../chats.service';

export enum ChatPermission {
  ADD_MEMBERS = 'canAddMembers',
  REMOVE_MEMBERS = 'canRemoveMembers',
  EDIT_INFO = 'canEditInfo',
  DELETE_MESSAGES = 'canDeleteMessages',
  PIN_MESSAGES = 'canPinMessages',
  START_CALL = 'canStartCall',
}

@Injectable()
export class ChatPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private chatsService: ChatsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<ChatPermission>(
      'permission',
      context.getHandler()
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub;
    const chatId = request.params.chatId || request.body.chatId;

    if (!chatId) {
      return false;
    }

    const chat = await this.chatsService.getChatById(chatId);
    const participant = chat.participants.find(
      p => p.user.toString() === userId
    );

    if (!participant) {
      return false;
    }

    // Owner has all permissions
    if (participant.role === 'owner') {
      return true;
    }

    // Check specific permission
    return participant.permissions[requiredPermission] === true;
  }
}

// Usage in controller
@UseGuards(ChatPermissionGuard)
@SetMetadata('permission', ChatPermission.ADD_MEMBERS)
@Post(':chatId/members')
async addMembers() { }
```

### Input Validation & Sanitization

```typescript
// backend/src/common/pipes/sanitize.pipe.ts

import { PipeTransform, Injectable } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      // Remove any HTML/script tags
      return DOMPurify.sanitize(value, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
    }
    
    if (typeof value === 'object') {
      // Recursively sanitize object properties
      const sanitized = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          sanitized[key] = this.transform(value[key]);
        }
      }
      return sanitized;
    }
    
    return value;
  }
}

// DTO with validation
export class CreateGroupChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => DOMPurify.sanitize(value))
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => DOMPurify.sanitize(value))
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(99)
  @IsMongoId({ each: true })
  memberIds: string[];
}
```

### Member Limits Enforcement

```typescript
// backend/src/modules/chats/chats.service.ts

private validateMemberLimits(
  chat: ChatDocument,
  newMembersCount: number
): void {
  const currentCount = chat.participants.length;
  const maxLimit = chat.maxMembers;
  
  if (currentCount + newMembersCount > maxLimit) {
    throw new BadRequestException(
      `Cannot add ${newMembersCount} members. ` +
      `Current: ${currentCount}/${maxLimit}`
    );
  }
  
  // Check subscription limits
  if (chat.type === 'channel' && currentCount >= 1000) {
    throw new BadRequestException('Channel has reached maximum capacity');
  }
  
  if (chat.type === 'group' && currentCount >= 100) {
    throw new BadRequestException('Group has reached maximum capacity');
  }
}
```

---

## 🔒 WebRTC Security

### Call Token System

```typescript
// backend/src/modules/webrtc/services/call-token.service.ts

import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

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
  private readonly secret = process.env.CALL_TOKEN_SECRET;
  private readonly tokenLifetime = 3600; // 1 hour

  generateCallToken(
    userId: string,
    callId: string,
    chatId: string,
    permissions: CallTokenPayload['permissions']
  ): string {
    const payload: CallTokenPayload = {
      userId,
      callId,
      chatId,
      permissions,
      exp: Math.floor(Date.now() / 1000) + this.tokenLifetime
    };

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256'
    });
  }

  verifyCallToken(token: string): CallTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as CallTokenPayload;
      
      // Additional verification
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  refreshToken(oldToken: string): string | null {
    const decoded = this.verifyCallToken(oldToken);
    if (!decoded) return null;

    return this.generateCallToken(
      decoded.userId,
      decoded.callId,
      decoded.chatId,
      decoded.permissions
    );
  }
}
```

### DTLS-SRTP Configuration

```typescript
// backend/src/modules/webrtc/config/rtc.config.ts

export const RTC_CONFIG = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']
    },
    {
      urls: process.env.TURN_SERVER_URL || 'turn:turn.example.com:3478',
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD,
      credentialType: 'password' as RTCIceCredentialType
    }
  ],
  iceTransportPolicy: 'all' as RTCIceTransportPolicy,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
  iceCandidatePoolSize: 10,
  // Force DTLS-SRTP
  encodedInsertableStreams: false,
  // Additional security constraints
  constraints: {
    mandatory: {
      DtlsSrtpKeyAgreement: true
    }
  }
};

// Validate SDP for security
export function validateSDP(sdp: string): boolean {
  // Check for required security attributes
  const requiredAttributes = [
    'a=fingerprint:',
    'a=setup:',
    'a=ice-ufrag:',
    'a=ice-pwd:'
  ];

  for (const attr of requiredAttributes) {
    if (!sdp.includes(attr)) {
      return false;
    }
  }

  // Check for insecure codecs or settings
  const insecurePatterns = [
    /a=crypto:0/, // No encryption
    /RTP\/AVP\s/, // Unencrypted RTP
  ];

  for (const pattern of insecurePatterns) {
    if (pattern.test(sdp)) {
      return false;
    }
  }

  return true;
}
```

### TURN Server Authentication

```typescript
// backend/src/modules/webrtc/services/turn.service.ts

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TurnService {
  private readonly secret = process.env.TURN_SHARED_SECRET;
  private readonly turnUrl = process.env.TURN_SERVER_URL;

  /**
   * Generate time-limited TURN credentials
   */
  generateTurnCredentials(userId: string): {
    username: string;
    credential: string;
    urls: string[];
  } {
    const timestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const username = `${timestamp}:${userId}`;
    
    // Generate HMAC-SHA1 credential
    const credential = crypto
      .createHmac('sha1', this.secret)
      .update(username)
      .digest('base64');

    return {
      username,
      credential,
      urls: [this.turnUrl]
    };
  }

  /**
   * Verify TURN credentials
   */
  verifyTurnCredentials(username: string, credential: string): boolean {
    const parts = username.split(':');
    if (parts.length !== 2) return false;

    const timestamp = parseInt(parts[0], 10);
    const now = Math.floor(Date.now() / 1000);

    // Check if expired
    if (timestamp < now) return false;

    // Verify HMAC
    const expectedCredential = crypto
      .createHmac('sha1', this.secret)
      .update(username)
      .digest('base64');

    return credential === expectedCredential;
  }
}
```

---

## 🔒 Rate Limiting

### Call Initiation Rate Limiting

```typescript
// backend/src/modules/webrtc/decorators/call-rate-limit.decorator.ts

import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CallRateLimitGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const userId = client.data?.userId;

    if (!userId) return false;

    // Check call initiation rate
    const key = `call_init:${userId}`;
    const limit = 5; // 5 calls per minute
    const ttl = 60; // 1 minute

    return this.checkLimit(key, limit, ttl);
  }

  private async checkLimit(
    key: string,
    limit: number,
    ttl: number
  ): Promise<boolean> {
    // Implementation using Redis
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, ttl);
    }

    return current <= limit;
  }
}
```

### Message Rate Limiting in Groups

```typescript
// backend/src/common/guards/group-message-rate-limit.guard.ts

@Injectable()
export class GroupMessageRateLimitGuard implements CanActivate {
  constructor(private redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub;
    const chatId = request.body.chatId || request.params.chatId;

    // Different limits for different chat types
    const chat = await this.chatsService.getChatById(chatId);
    
    let limit: number;
    let window: number;

    switch (chat.type) {
      case 'channel':
        limit = 10; // 10 messages per minute for channels
        window = 60;
        break;
      case 'group':
        limit = 30; // 30 messages per minute for groups
        window = 60;
        break;
      default:
        limit = 60; // 60 messages per minute for personal
        window = 60;
    }

    const key = `msg_rate:${chatId}:${userId}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, window);
    }

    if (count > limit) {
      throw new TooManyRequestsException(
        `Rate limit exceeded. Max ${limit} messages per ${window} seconds`
      );
    }

    return true;
  }
}
```

---

## 🔒 Privacy Protection

### User Data Protection

```typescript
// backend/src/common/interceptors/privacy.interceptor.ts

@Injectable()
export class PrivacyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.sanitizeResponse(data))
    );
  }

  private sanitizeResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponse(item));
    }

    if (data && typeof data === 'object') {
      const sanitized = { ...data };

      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.refreshToken;
      delete sanitized.emailVerificationToken;
      
      // Mask phone numbers
      if (sanitized.phone) {
        sanitized.phone = this.maskPhone(sanitized.phone);
      }

      // Mask email for non-owner
      if (sanitized.email && !this.isOwner(sanitized)) {
        sanitized.email = this.maskEmail(sanitized.email);
      }

      return sanitized;
    }

    return data;
  }

  private maskPhone(phone: string): string {
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local[0] + '***';
    return `${maskedLocal}@${domain}`;
  }

  private isOwner(data: any): boolean {
    // Check if current user is the owner of this data
    // Implementation depends on your auth system
    return false;
  }
}
```

### Call Recording Consent

```typescript
// backend/src/modules/webrtc/services/recording-consent.service.ts

@Injectable()
export class RecordingConsentService {
  private consents = new Map<string, Set<string>>();

  requestConsent(callId: string, requesterId: string): void {
    // Send consent request to all participants
    this.wsGateway.emitToCall(callId, 'recording:consent-request', {
      requesterId,
      callId
    });
  }

  grantConsent(callId: string, userId: string): void {
    if (!this.consents.has(callId)) {
      this.consents.set(callId, new Set());
    }
    this.consents.get(callId)!.add(userId);
  }

  hasFullConsent(callId: string, participants: string[]): boolean {
    const consents = this.consents.get(callId);
    if (!consents) return false;

    return participants.every(p => consents.has(p));
  }

  revokeConsent(callId: string, userId: string): void {
    this.consents.get(callId)?.delete(userId);
  }
}
```

---

## 🔒 Security Headers

### Helmet Configuration

```typescript
// backend/src/main.ts

import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'wss:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
```

---

## 🔒 Security Checklist

### Before Deployment
- [ ] All environment variables are secure
- [ ] TURN server uses authentication
- [ ] Redis has password protection
- [ ] MongoDB connection uses SSL
- [ ] JWT secrets are strong (min 32 chars)
- [ ] Rate limiting is configured
- [ ] Input validation on all endpoints
- [ ] XSS protection enabled
- [ ] CSRF protection for forms
- [ ] Content Security Policy configured
- [ ] HTTPS enforced everywhere
- [ ] WebSocket uses WSS
- [ ] Logging doesn't expose sensitive data
- [ ] Error messages don't leak system info
- [ ] Dependencies are up to date
- [ ] Security audit completed
