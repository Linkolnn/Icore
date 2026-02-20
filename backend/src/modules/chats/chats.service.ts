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
import {
  CreateGroupDto,
  AddMembersDto,
  UpdateMemberRoleDto,
  UpdateGroupInfoDto,
  GenerateInviteLinkDto,
} from './dto/create-group.dto';
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
        $or: [
          { participants: userIdStr }, // For old format (string array)
          { 'participants.user': userIdStr }, // For new format (object array)
        ],
        isDeleted: false,
      })
      .populate('participants', '-password -refreshToken')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 })
      .lean();

    // Manually populate lastMessage.sender и добавить unreadCount для текущего пользователя
    const result: any[] = [];
    for (const chat of chats) {
      // Normalize participants to handle both old and new formats
      if (chat.participants && chat.participants.length > 0) {
        const firstParticipant = chat.participants[0];
        // If it's the new format with user object
        if (firstParticipant && typeof firstParticipant === 'object' && 'user' in firstParticipant) {
          // Transform to simple array for frontend compatibility
          chat.participants = chat.participants.map((p: any) => p.user || p);
        }
        // If it's already the old format (string array or populated users), leave as is
      }
      // Populate sender используя User модель
      // Проверяем что lastMessage существует и не пустой
      if (chat.lastMessage && chat.lastMessage.text && chat.lastMessage.sender) {
        const sender = await this.userModel
          .findById(chat.lastMessage.sender)
          .select('name username userId avatar')
          .lean();
        
        if (sender) {
          chat.lastMessage.sender = sender as any;
        }
      } else if (chat.lastMessage && !chat.lastMessage.text) {
        // Если lastMessage существует но text пустой, удаляем его
        delete (chat as any).lastMessage;
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
    
    // Handle both old format (string array) and new format (object array with user field)
    const isParticipant = chat.participants.some((p: any) => {
      if (typeof p === 'string') {
        return compareIds(p, userIdStr);
      } else if (p && typeof p === 'object') {
        // Check if it's a populated user object or participant object with user field
        if (p._id && !p.user) {
          return compareIds(p._id, userIdStr);
        } else if (p.user) {
          const participantUserId = typeof p.user === 'object' ? p.user._id : p.user;
          return compareIds(participantUserId, userIdStr);
        }
      }
      return false;
    });

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // Normalize participants for frontend
    if (chat.participants && chat.participants.length > 0) {
      const firstParticipant = chat.participants[0];
      if (firstParticipant && typeof firstParticipant === 'object' && 'user' in firstParticipant) {
        chat.participants = chat.participants.map((p: any) => p.user || p);
      }
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
    // Если message пустой или без текста, устанавливаем null
    if (!message || !message.text) {
      await this.chatModel.findByIdAndUpdate(chatId, {
        lastMessage: null,
      });
      return;
    }
    
    // Извлекаем sender ID правильно (может быть ObjectId, строкой или объектом)
    let senderId: any = null;
    if (message.sender) {
      if (typeof message.sender === 'string') {
        senderId = new Types.ObjectId(message.sender);
      } else if (message.sender._id) {
        senderId = new Types.ObjectId(message.sender._id);
      } else {
        senderId = message.sender;
      }
    }
    
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: message.text,
        sender: senderId,
        createdAt: message.createdAt || new Date(),
      },
    });
  }

  /**
   * Clear lastMessage in chat
   */
  async clearLastMessage(chatId: string): Promise<void> {
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: null,
    });
  }

  /**
   * Get chat participants (for WebSocket events)
   * Без проверки прав доступа - только для внутреннего использования
   */
  async getChatParticipants(chatId: string): Promise<string[]> {
    const chat = await this.chatModel
      .findById(chatId)
      .select('participants')
      .lean();
    
    if (!chat) {
      return [];
    }
    
    return chat.participants.map((p: any) => {
      // Handle both old format (just ObjectId) and new format (object with user field)
      if (typeof p === 'string') return p;
      if (p.user) return p.user.toString();
      return p.toString();
    });
  }

  /**
   * Create a group chat
   */
  async createGroupChat(dto: CreateGroupDto, creatorId: string): Promise<Chat> {
    const creatorIdStr = toStringId(creatorId);

    // Validate member IDs exist
    const validMembers = await this.userModel
      .find({ _id: { $in: dto.memberIds } })
      .select('_id')
      .lean();

    if (validMembers.length !== dto.memberIds.length) {
      throw new BadRequestException('Some member IDs are invalid');
    }

    // Validate member limits based on type
    const maxMembers = dto.type === 'channel' ? 1000 : 100;
    if (dto.memberIds.length >= maxMembers) {
      throw new BadRequestException(
        `${dto.type === 'channel' ? 'Channel' : 'Group'} cannot have more than ${maxMembers} members`,
      );
    }

    // Create participants array with roles and permissions
    const participants = [
      {
        user: new Types.ObjectId(creatorIdStr),
        role: 'owner' as const,
        joinedAt: new Date(),
        permissions: {
          canAddMembers: true,
          canRemoveMembers: true,
          canEditInfo: true,
          canDeleteMessages: true,
          canPinMessages: true,
          canStartCall: true,
        },
      },
      ...dto.memberIds.map((id) => ({
        user: new Types.ObjectId(id),
        role: 'member' as const,
        joinedAt: new Date(),
        permissions: {
          canAddMembers: false,
          canRemoveMembers: false,
          canEditInfo: false,
          canDeleteMessages: false,
          canPinMessages: false,
          canStartCall: true,
        },
      })),
    ];

    const chat = await this.chatModel.create({
      type: dto.type,
      name: dto.name,
      description: dto.description,
      avatar: dto.avatar,
      participants,
      maxMembers,
      settings: {
        muteNotifications: false,
        allowJoinByLink: true,
        approveNewMembers: false,
      },
    });

    return chat.populate('participants.user', '-password -refreshToken');
  }

  /**
   * Add members to group chat
   */
  async addMembers(
    chatId: string,
    dto: AddMembersDto,
    requesterId: string,
  ): Promise<Chat> {
    const requesterIdStr = toStringId(requesterId);
    const chat = await this.chatModel.findById(chatId);

    if (!chat || chat.isDeleted) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type === 'personal') {
      throw new BadRequestException('Cannot add members to personal chat');
    }

    // Check requester permissions
    const requester = chat.participants.find(
      (p) => p.user.toString() === requesterIdStr,
    );

    if (!requester) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    if (requester.role !== 'owner' && requester.role !== 'admin' && !requester.permissions?.canAddMembers) {
      throw new ForbiddenException('No permission to add members');
    }

    // Check member limits
    const currentCount = chat.participants.length;
    const newCount = dto.userIds.length;
    
    if (currentCount + newCount > chat.maxMembers) {
      throw new BadRequestException(
        `Cannot add ${newCount} members. Current: ${currentCount}/${chat.maxMembers}`,
      );
    }

    // Validate new member IDs
    const validMembers = await this.userModel
      .find({ _id: { $in: dto.userIds } })
      .select('_id')
      .lean();

    // Filter out existing members
    const existingMemberIds = chat.participants.map((p) => p.user.toString());
    const newMemberIds = validMembers
      .map((m) => m._id.toString())
      .filter((id) => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      throw new BadRequestException('All users are already members');
    }

    // Add new members
    const newParticipants = newMemberIds.map((id) => ({
      user: new Types.ObjectId(id),
      role: 'member' as const,
      joinedAt: new Date(),
      permissions: {
        canAddMembers: false,
        canRemoveMembers: false,
        canEditInfo: false,
        canDeleteMessages: false,
        canPinMessages: false,
        canStartCall: true,
      },
    }));

    chat.participants.push(...newParticipants);
    await chat.save();

    return chat.populate('participants.user', '-password -refreshToken');
  }

  /**
   * Remove member from group chat
   */
  async removeMember(
    chatId: string,
    memberId: string,
    requesterId: string,
  ): Promise<Chat> {
    const requesterIdStr = toStringId(requesterId);
    const memberIdStr = toStringId(memberId);
    const chat = await this.chatModel.findById(chatId);

    if (!chat || chat.isDeleted) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type === 'personal') {
      throw new BadRequestException('Cannot remove members from personal chat');
    }

    // Check requester permissions
    const requester = chat.participants.find(
      (p) => p.user.toString() === requesterIdStr,
    );

    if (!requester) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // Check if user wants to leave (remove themselves)
    const isSelfRemoval = requesterIdStr === memberIdStr;

    if (!isSelfRemoval) {
      // Check permissions for removing others
      if (requester.role !== 'owner' && requester.role !== 'admin' && !requester.permissions?.canRemoveMembers) {
        throw new ForbiddenException('No permission to remove members');
      }

      // Cannot remove owner
      const memberToRemove = chat.participants.find(
        (p) => p.user.toString() === memberIdStr,
      );

      if (memberToRemove?.role === 'owner') {
        throw new BadRequestException('Cannot remove chat owner');
      }
    }

    // Remove member
    chat.participants = chat.participants.filter(
      (p) => p.user.toString() !== memberIdStr,
    );

    // If owner left, transfer ownership to oldest admin or member
    if (isSelfRemoval && requester.role === 'owner' && chat.participants.length > 0) {
      const newOwner =
        chat.participants.find((p) => p.role === 'admin') ||
        chat.participants[0];
      
      if (newOwner) {
        newOwner.role = 'owner';
        newOwner.permissions = {
          canAddMembers: true,
          canRemoveMembers: true,
          canEditInfo: true,
          canDeleteMessages: true,
          canPinMessages: true,
          canStartCall: true,
        };
      }
    }

    await chat.save();
    return chat.populate('participants.user', '-password -refreshToken');
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    chatId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    requesterId: string,
  ): Promise<Chat> {
    const requesterIdStr = toStringId(requesterId);
    const memberIdStr = toStringId(memberId);
    const chat = await this.chatModel.findById(chatId);

    if (!chat || chat.isDeleted) {
      throw new NotFoundException('Chat not found');
    }

    // Check requester is owner
    const requester = chat.participants.find(
      (p) => p.user.toString() === requesterIdStr,
    );

    if (!requester || requester.role !== 'owner') {
      throw new ForbiddenException('Only owner can change member roles');
    }

    // Find member to update
    const member = chat.participants.find(
      (p) => p.user.toString() === memberIdStr,
    );

    if (!member) {
      throw new NotFoundException('Member not found in chat');
    }

    // Cannot change owner's role
    if (member.role === 'owner') {
      throw new BadRequestException('Cannot change owner role');
    }

    // Update role and permissions
    member.role = dto.role;
    
    if (dto.role === 'admin') {
      member.permissions = {
        canAddMembers: true,
        canRemoveMembers: true,
        canEditInfo: false,
        canDeleteMessages: true,
        canPinMessages: true,
        canStartCall: true,
      };
    } else {
      member.permissions = {
        canAddMembers: false,
        canRemoveMembers: false,
        canEditInfo: false,
        canDeleteMessages: false,
        canPinMessages: false,
        canStartCall: true,
      };
    }

    await chat.save();
    return chat.populate('participants.user', '-password -refreshToken');
  }

  /**
   * Update group info
   */
  async updateGroupInfo(
    chatId: string,
    dto: UpdateGroupInfoDto,
    requesterId: string,
  ): Promise<Chat> {
    const requesterIdStr = toStringId(requesterId);
    const chat = await this.chatModel.findById(chatId);

    if (!chat || chat.isDeleted) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type === 'personal') {
      throw new BadRequestException('Cannot update personal chat info');
    }

    // Check requester permissions
    const requester = chat.participants.find(
      (p) => p.user.toString() === requesterIdStr,
    );

    if (!requester) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    if (requester.role !== 'owner' && requester.role !== 'admin' && !requester.permissions?.canEditInfo) {
      throw new ForbiddenException('No permission to edit group info');
    }

    // Update allowed fields
    if (dto.name !== undefined) chat.name = dto.name;
    if (dto.description !== undefined) chat.description = dto.description;
    if (dto.avatar !== undefined) chat.avatar = dto.avatar;
    if (dto.settings) {
      chat.settings = {
        muteNotifications: dto.settings.muteNotifications ?? chat.settings?.muteNotifications ?? false,
        allowJoinByLink: dto.settings.allowJoinByLink ?? chat.settings?.allowJoinByLink ?? true,
        approveNewMembers: dto.settings.approveNewMembers ?? chat.settings?.approveNewMembers ?? false,
      };
    }

    await chat.save();
    return chat.populate('participants.user', '-password -refreshToken');
  }

  /**
   * Generate invite link
   */
  async generateInviteLink(
    chatId: string,
    dto: GenerateInviteLinkDto,
    requesterId: string,
  ): Promise<{ link: string; token: string; expiresAt: Date }> {
    const requesterIdStr = toStringId(requesterId);
    const chat = await this.chatModel.findById(chatId);

    if (!chat || chat.isDeleted) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type === 'personal') {
      throw new BadRequestException('Cannot generate invite link for personal chat');
    }

    // Check requester permissions
    const requester = chat.participants.find(
      (p) => p.user.toString() === requesterIdStr,
    );

    if (!requester) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    if (requester.role !== 'owner' && requester.role !== 'admin' && !requester.permissions?.canAddMembers) {
      throw new ForbiddenException('No permission to generate invite links');
    }

    // Generate token
    const token = this.generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (dto.expiresIn || 24));

    chat.inviteLink = {
      token,
      expiresAt,
      maxUses: dto.maxUses,
      uses: 0,
    };

    await chat.save();

    const link = `${process.env.FRONTEND_URL}/join/${token}`;
    return { link, token, expiresAt };
  }

  /**
   * Join chat by invite link
   */
  async joinByInviteLink(token: string, userId: string): Promise<Chat> {
    const userIdStr = toStringId(userId);
    
    const chat = await this.chatModel.findOne({
      'inviteLink.token': token,
      isDeleted: false,
    });

    if (!chat || !chat.inviteLink) {
      throw new NotFoundException('Invalid invite link');
    }

    // Check if link is expired
    if (chat.inviteLink.expiresAt < new Date()) {
      throw new BadRequestException('Invite link has expired');
    }

    // Check max uses
    if (chat.inviteLink.maxUses && chat.inviteLink.uses >= chat.inviteLink.maxUses) {
      throw new BadRequestException('Invite link has reached maximum uses');
    }

    // Check if user is already a member
    const isAlreadyMember = chat.participants.some(
      (p) => p.user.toString() === userIdStr,
    );

    if (isAlreadyMember) {
      throw new BadRequestException('You are already a member of this chat');
    }

    // Check member limit
    if (chat.participants.length >= chat.maxMembers) {
      throw new BadRequestException('Chat has reached maximum capacity');
    }

    // Add user as member
    chat.participants.push({
      user: new Types.ObjectId(userIdStr),
      role: 'member',
      joinedAt: new Date(),
      permissions: {
        canAddMembers: false,
        canRemoveMembers: false,
        canEditInfo: false,
        canDeleteMessages: false,
        canPinMessages: false,
        canStartCall: true,
      },
    });

    // Increment uses (inviteLink is guaranteed to exist here)
    chat.inviteLink!.uses += 1;

    await chat.save();
    return chat.populate('participants.user', '-password -refreshToken');
  }

  /**
   * Leave group chat
   */
  async leaveGroup(chatId: string, userId: string): Promise<void> {
    const userIdStr = toStringId(userId);
    await this.removeMember(chatId, userIdStr, userIdStr);
  }

  /**
   * Helper: Generate unique invite token
   */
  private generateInviteToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
