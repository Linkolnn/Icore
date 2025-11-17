import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chat: Types.ObjectId;

  @Prop({ required: true, maxlength: 10000 })
  text: string;

  @Prop({
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text',
  })
  type: string;

  @Prop({
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;

  // timestamps: true автоматически добавляет createdAt и updatedAt
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes для оптимизации запросов
MessageSchema.index({ chat: 1, createdAt: -1 }); // Для пагинации сообщений чата
MessageSchema.index({ sender: 1 }); // Для поиска по отправителю
