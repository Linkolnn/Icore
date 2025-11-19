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

  // Для групповых чатов - кто прочитал
  @Prop({
    type: Map,
    of: Date,
    default: new Map(),
  })
  readBy: Map<string, Date>;

  // Timestamps для статусов
  @Prop({ type: Date })
  deliveredAt: Date;

  @Prop({ type: Date })
  readAt: Date;

  // Для редактирования
  @Prop({ type: Date })
  editedAt: Date;

  @Prop({ type: Array, default: [] })
  editHistory: Array<{
    text: string;
    editedAt: Date;
  }>;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  // Для ответов на сообщения
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo?: Types.ObjectId;

  // Для пересланных сообщений
  @Prop({
    type: {
      from: { type: Types.ObjectId, ref: 'User' },
      fromName: { type: String },  // Store the sender's name directly
      originalChatId: { type: Types.ObjectId, ref: 'Chat' },
      originalMessageId: { type: Types.ObjectId, ref: 'Message' },
      originalCreatedAt: Date,
    },
    required: false,
  })
  forwarded?: {
    from: Types.ObjectId;
    fromName?: string;  // Store the sender's name directly
    originalChatId?: Types.ObjectId;
    originalMessageId?: Types.ObjectId;
    originalCreatedAt?: Date;
  };

  // timestamps: true автоматически добавляет createdAt и updatedAt
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes для оптимизации запросов
MessageSchema.index({ chat: 1, createdAt: -1 }); // Для пагинации сообщений чата
MessageSchema.index({ sender: 1 }); // Для поиска по отправителю
