import { Module } from '@nestjs/common';
import { WebRTCGateway } from './webrtc.gateway';
import { WebRTCRedisService } from './webrtc-redis.service';
import { CallTokenService } from './call-token.service';
import { ChatsModule } from '../chats/chats.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    ChatsModule,
  ],
  providers: [
    WebRTCGateway,
    WebRTCRedisService,
    CallTokenService,
  ],
  exports: [
    WebRTCGateway,
    WebRTCRedisService,
    CallTokenService,
  ],
})
export class WebRTCModule {}
