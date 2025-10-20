import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MessagesService } from './modules/messages/messages.service';
import { MessagesModule } from './modules/messages/messages.module';
import { ChatsModule } from './modules/chats/chats.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { WebrtcService } from './modules/webrtc/webrtc.service';
import { WebrtcModule } from './modules/webrtc/webrtc.module';
import { EncryptionModule } from './modules/encryption/encryption.module';

@Module({
  imports: [AuthModule, UsersModule, MessagesModule, ChatsModule, WebsocketModule, WebrtcModule, EncryptionModule],
  controllers: [AppController],
  providers: [AppService, MessagesService, WebrtcService],
})
export class AppModule {}
