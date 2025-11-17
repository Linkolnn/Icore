import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { CreateChatDto } from './dto/create-chat.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UpdateChatDto } from './dto/update-chat.dto';
import { toStringId, compareIds } from '../../common/utils/id.utils';
import { Server } from 'socket.io';

@Injectable()
export class ChatsService {
  private io: Server;

  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  setSocketServer(server: Server) {
    this.io = server;
  }

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: string): Promise<any[]> {
    const userIdStr = toStringId(userId);
    
    const chats = await this.chatModel
      .find({
        participants: userIdStr,
        isDeleted: false,
      })
      .populate('participants', '-password -refreshToken')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
      .lean();

    // Manually populate lastMessage.sender и добавить unreadCount для текущего пользователя
    const result: any[] = [];
    for (const chat of chats) {
      // Populate sender используя User модель
      if (chat.lastMessage?.sender) {
        const sender = await this.userModel
          .findById(chat.lastMessage.sender)
          .select('name username userId avatar')
          .lean();
        
        if (sender) {
          chat.lastMessage.sender = sender as any;
        }
      }

      // Добавляем unreadCount для текущего пользователя
      // unreadCount это Map, нужно извлечь значение
      const unreadMap = chat.unreadCount as any;
      const unreadValue = unreadMap?.[userIdStr] || unreadMap?.get?.(userIdStr) || 0;
      
      const chatWithUnread = {
        ...chat,
        unreadCount: unreadValue,
      };
      
      result.push(chatWithUnread);
    }

    return result;
  }

  /**
   * Create a new chat
   */
  async createChat(dto: CreateChatDto, currentUserId: string): Promise<any> {
    const currentUserIdStr = toStringId(currentUserId);

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
        // Return existing chat with unreadCount set to 0
        return {
          ...existingChat,
          unreadCount: 0
        };
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

    // Add unreadCount for the created chat (initially 0)
    const chatWithUnread = {
      ...createdChat,
      unreadCount: 0
    };

    // Emit chat:created event to all participants' personal rooms
    if (this.io) {
      createdChat.participants.forEach((participant: any) => {
        const participantId = participant._id || participant;
        this.io.to(`user-${participantId}`).emit('chat:created', chatWithUnread);
      });
    }

    return chatWithUnread;
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string): Promise<any> {
    const chat = await this.chatModel
      .findById(chatId)
      .populate('participants', '-password -refreshToken');

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Authorization: Check if user is participant
    const userIdStr = toStringId(userId);
    const isParticipant = chat.participants.some(
      (p: any) => compareIds(p._id, userIdStr),
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // Извлекаем unreadCount для текущего пользователя
    const chatObj = chat.toObject();
    const unreadMap = chatObj.unreadCount as any;
    const unreadValue = unreadMap?.[userIdStr] || unreadMap?.get?.(userIdStr) || 0;
    
    return {
      ...chatObj,
      unreadCount: unreadValue,
    };
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
    const currentUserIdStr = toStringId(currentUserId);
    const otherUserIdStr = toStringId(otherUserId);

    // Can't have chat with yourself
    if (currentUserIdStr === otherUserIdStr) {
      throw new BadRequestException('Cannot have chat with yourself');
    }

    return this.findPersonalChat(currentUserIdStr, otherUserIdStr);
  }

  /**
   * Check if user is participant of chat
   */
  async isParticipant(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat || chat.isDeleted) {
      return false;
    }

    const userIdStr = toStringId(userId);
    return chat.participants.some((p) => compareIds(p, userIdStr));
  }

  /**
   * Increment unread count for all participants except sender
   */
  async incrementUnreadCount(chatId: string, senderId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) return;

    const senderIdStr = toStringId(senderId);
    
    // Увеличиваем счётчик для всех участников кроме отправителя
    for (const participantId of chat.participants) {
      const participantIdStr = toStringId(participantId);
      if (participantIdStr !== senderIdStr) {
        const currentCount = chat.unreadCount.get(participantIdStr) || 0;
        chat.unreadCount.set(participantIdStr, currentCount + 1);
      }
    }

    await chat.save();
  }

  /**
   * Reset unread count for a user in a chat
   */
  async resetUnreadCount(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) return;

    const userIdStr = toStringId(userId);
    chat.unreadCount.set(userIdStr, 0);
    await chat.save();
  }

  /**
   * Update lastMessage in chat
   */
  async updateLastMessage(chatId: string, message: any): Promise<void> {
    // Извлекаем sender ID правильно (может быть ObjectId, строкой или объектом)
    let senderId;
    if (typeof message.sender === 'string') {
      senderId = new Types.ObjectId(message.sender);
    } else if (message.sender._id) {
      senderId = new Types.ObjectId(message.sender._id);
    } else {
      senderId = message.sender;
    }
    
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: message.text,
        sender: senderId,
        createdAt: message.createdAt || new Date(),
      },
    });
  }
}
