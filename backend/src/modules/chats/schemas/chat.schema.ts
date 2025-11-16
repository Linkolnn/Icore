import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

/**
 * Chat Schema
 * Represents a chat/conversation between users
 */
@Schema({ timestamps: true })
export class Chat {
  /**
   * Chat type: personal (1-1), group, or channel
   */
  @Prop({
    type: String,
    enum: ['personal', 'group', 'channel'],
    required: true,
  })
  type: string;

  /**
   * Array of user IDs participating in the chat
   */
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  participants: Types.ObjectId[];

  /**
   * Chat name (optional, mainly for groups/channels)
   */
  @Prop({ type: String, required: false })
  name?: string;

  /**
   * Last message in the chat (for sorting and preview)
   */
  @Prop({
    type: {
      text: String,
      sender: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
    required: false,
  })
  lastMessage?: {
    text: string;
    sender: Types.ObjectId;
    createdAt: Date;
  };

  /**
   * Soft delete flag
   */
  @Prop({ default: false })
  isDeleted: boolean;

  /**
   * Auto-generated timestamps
   */
  createdAt: Date;
  updatedAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

/**
 * Indexes for optimization
 */
ChatSchema.index({ participants: 1, isDeleted: 1 });
