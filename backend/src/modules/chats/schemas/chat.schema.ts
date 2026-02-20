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
   * Array of participants with roles and permissions
   * For personal chats - simple array of user IDs
   * For groups/channels - objects with user, role, permissions
   */
  @Prop({
    type: [
      {
        user: { type: MongooseSchema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        permissions: {
          canAddMembers: { type: Boolean, default: false },
          canRemoveMembers: { type: Boolean, default: false },
          canEditInfo: { type: Boolean, default: false },
          canDeleteMessages: { type: Boolean, default: false },
          canPinMessages: { type: Boolean, default: false },
          canStartCall: { type: Boolean, default: true },
        },
      },
    ],
    required: true,
  })
  participants: Array<{
    user: Types.ObjectId;
    role?: 'owner' | 'admin' | 'member';
    joinedAt?: Date;
    permissions?: {
      canAddMembers?: boolean;
      canRemoveMembers?: boolean;
      canEditInfo?: boolean;
      canDeleteMessages?: boolean;
      canPinMessages?: boolean;
      canStartCall?: boolean;
    };
  }>;

  /**
   * Chat name (optional, mainly for groups/channels)
   */
  @Prop({ type: String, required: false, maxlength: 100 })
  name?: string;

  /**
   * Chat description (for groups/channels)
   */
  @Prop({ type: String, required: false, maxlength: 500 })
  description?: string;

  /**
   * Chat avatar URL (for groups/channels)
   */
  @Prop({ type: String, required: false })
  avatar?: string;

  /**
   * Maximum number of participants allowed
   */
  @Prop({ type: Number, default: 100 })
  maxMembers: number;

  /**
   * Invite link for joining the group
   */
  @Prop({
    type: {
      token: String,
      expiresAt: Date,
      maxUses: Number,
      uses: { type: Number, default: 0 },
    },
    required: false,
  })
  inviteLink?: {
    token: string;
    expiresAt: Date;
    maxUses?: number;
    uses: number;
  };

  /**
   * Pinned messages IDs
   */
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Message' }],
    default: [],
  })
  pinnedMessages: Types.ObjectId[];

  /**
   * Settings for the chat
   */
  @Prop({
    type: {
      muteNotifications: { type: Boolean, default: false },
      allowJoinByLink: { type: Boolean, default: true },
      approveNewMembers: { type: Boolean, default: false },
    },
    required: false,
  })
  settings?: {
    muteNotifications: boolean;
    allowJoinByLink: boolean;
    approveNewMembers: boolean;
  };

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
   * Unread message count per participant
   * Map of userId -> unread count
   */
  @Prop({
    type: MongooseSchema.Types.Map,
    of: Number,
    default: {},
  })
  unreadCount: Map<string, number>;

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
