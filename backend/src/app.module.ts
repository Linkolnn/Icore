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
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://mongodb:27017/icore'
    ),
    AuthModule, 
    UsersModule, 
    MessagesModule, 
    ChatsModule, 
    WebsocketModule, 
    WebrtcModule, 
    EncryptionModule
  ],
  controllers: [AppController],
  providers: [AppService, MessagesService, WebrtcService],
})
export class AppModule {}
