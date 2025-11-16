import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({
    type: {
      _id: { type: Types.ObjectId, ref: 'Message' },
      text: String,
      sender: { type: Types.ObjectId, ref: 'User' },
      timestamp: Date,
    },
  })
  lastMessage: {
    _id: Types.ObjectId;
    text: string;
    sender: Types.ObjectId;
    timestamp: Date;
  };

  @Prop({ type: Map, of: Number, default: {} })
  unreadCount: Map<string, number>;

  createdAt: Date;
  updatedAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Indexes for performance
ChatSchema.index({ participants: 1 });
ChatSchema.index({ 'lastMessage.timestamp': -1 });
ChatSchema.index({ participants: 1, 'lastMessage.timestamp': -1 });
