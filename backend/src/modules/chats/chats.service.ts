import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    // Convert userId to string in case it's an ObjectId
    const userIdStr = userId.toString();
    return this.chatModel
      .find({
        participants: userIdStr,
        isDeleted: false,
      })
      .populate('participants', '-password -refreshToken')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
      .lean();
  }

  /**
   * Create a new chat
   */
  async createChat(dto: CreateChatDto, currentUserId: string): Promise<Chat> {
    // Convert userId to string in case it's an ObjectId
    const currentUserIdStr = currentUserId.toString();

    // Validation: Can't create chat with yourself
    if (dto.participantId === currentUserIdStr) {
      throw new BadRequestException('Cannot create chat with yourself');
    }

    // For personal chats, check if chat already exists
    if (dto.type === 'personal') {
      const existingChat = await this.findPersonalChat(
        currentUserIdStr,
        dto.participantId,
      );
      if (existingChat) {
        return existingChat;
      }
    }

    // Create new chat
    const chat = new this.chatModel({
      type: dto.type,
      participants: [currentUserIdStr, dto.participantId],
      name: dto.name || null,
    });

    await chat.save();

    // Return with populated participants
    const createdChat = await this.chatModel
      .findById(chat._id)
      .populate('participants', '-password -refreshToken')
      .lean();

    if (!createdChat) {
      throw new Error('Failed to create chat');
    }

    return createdChat;
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string): Promise<Chat> {
    const chat = await this.chatModel
      .findById(chatId)
      .populate('participants', '-password -refreshToken');

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Authorization: Check if user is participant
    // Convert userId to string in case it's an ObjectId
    const userIdStr = userId.toString();
    const isParticipant = chat.participants.some(
      (p: any) => p._id.toString() === userIdStr,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    return chat.toObject();
  }

  /**
   * Update chat (e.g., change name)
   */
  async updateChat(
    chatId: string,
    dto: UpdateChatDto,
    userId: string,
  ): Promise<Chat> {
    // Get chat and verify authorization
    const chat = await this.getChatById(chatId, userId);

    // Update fields
    if (dto.name !== undefined) {
      await this.chatModel.findByIdAndUpdate(chatId, { name: dto.name });
    }

    // Return updated chat
    return this.getChatById(chatId, userId);
  }

  /**
   * Delete chat (soft delete)
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    // Get chat and verify authorization
    await this.getChatById(chatId, userId);

    // Soft delete
    await this.chatModel.findByIdAndUpdate(chatId, { isDeleted: true });
  }

  /**
   * Find existing personal chat between two users
   */
  private async findPersonalChat(
    user1Id: string,
    user2Id: string,
  ): Promise<any> {
    const chat = await this.chatModel
      .findOne({
        type: 'personal',
        participants: {
          $all: [user1Id, user2Id],
          $size: 2,
        },
        isDeleted: false,
      })
      .populate('participants', '-password -refreshToken')
      .lean();

    return chat;
  }

  /**
   * Find or return null for existing personal chat
   * Used for preview mode - checks if chat exists without creating it
   */
  async findExistingPersonalChat(
    currentUserId: string,
    otherUserId: string,
  ): Promise<Chat | null> {
    const currentUserIdStr = currentUserId.toString();
    const otherUserIdStr = otherUserId.toString();

    // Can't have chat with yourself
    if (currentUserIdStr === otherUserIdStr) {
      throw new BadRequestException('Cannot have chat with yourself');
    }

    return this.findPersonalChat(currentUserIdStr, otherUserIdStr);
  }
}
