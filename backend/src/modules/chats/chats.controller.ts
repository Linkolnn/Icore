import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import {
  CreateGroupDto,
  AddMembersDto,
  UpdateMemberRoleDto,
  UpdateGroupInfoDto,
  GenerateInviteLinkDto,
} from './dto/create-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * GET /chats - Get all chats for current user
   */
  @Get()
  async getUserChats(@User() user: UserPayload) {
    return this.chatsService.getUserChats(user.sub);
  }

  /**
   * POST /chats - Create new chat
   */
  @Post()
  async createChat(@Body() createChatDto: CreateChatDto, @User() user: UserPayload) {
    return this.chatsService.createChat(createChatDto, user.sub);
  }

  /**
   * POST /chats/group - Create new group chat
   */
  @Post('group')
  async createGroupChat(@Body() createGroupDto: CreateGroupDto, @User() user: UserPayload) {
    return this.chatsService.createGroupChat(createGroupDto, user.sub);
  }

  /**
   * POST /chats/join/:token - Join chat by invite link
   */
  @Post('join/:token')
  async joinByInviteLink(@Param('token') token: string, @User() user: UserPayload) {
    return this.chatsService.joinByInviteLink(token, user.sub);
  }

  /**
   * POST /chats/find-or-check/:userId - Find existing chat with user
   * Используется для preview режима - проверяет существует ли чат с пользователем
   * Возвращает чат если существует, или null если не существует
   */
  @Post('find-or-check/:userId')
  async findOrCheckChat(@Param('userId') otherUserId: string, @User() user: UserPayload) {
    const chat = await this.chatsService.findExistingPersonalChat(
      user.sub,
      otherUserId,
    );

    return {
      exists: !!chat,
      chat: chat || null,
    };
  }

  /**
   * PATCH /chats/:id/read - Mark chat as read (reset unread count)
   * ВАЖНО: Должен быть ПЕРЕД /:id чтобы не конфликтовать
   */
  @Patch(':id/read')
  async markChatAsRead(@Param('id') chatId: string, @User() user: UserPayload) {
    await this.chatsService.resetUnreadCount(chatId, user.sub);
    return { success: true };
  }

  /**
   * POST /chats/:id/members - Add members to group chat
   */
  @Post(':id/members')
  async addMembers(
    @Param('id') chatId: string,
    @Body() dto: AddMembersDto,
    @User() user: UserPayload,
  ) {
    return this.chatsService.addMembers(chatId, dto, user.sub);
  }

  /**
   * DELETE /chats/:id/members/:memberId - Remove member from group chat
   */
  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') chatId: string,
    @Param('memberId') memberId: string,
    @User() user: UserPayload,
  ) {
    return this.chatsService.removeMember(chatId, memberId, user.sub);
  }

  /**
   * PATCH /chats/:id/members/:memberId/role - Update member role
   */
  @Patch(':id/members/:memberId/role')
  async updateMemberRole(
    @Param('id') chatId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: UserPayload,
  ) {
    return this.chatsService.updateMemberRole(chatId, memberId, dto, user.sub);
  }

  /**
   * PATCH /chats/:id/info - Update group info
   */
  @Patch(':id/info')
  async updateGroupInfo(
    @Param('id') chatId: string,
    @Body() dto: UpdateGroupInfoDto,
    @User() user: UserPayload,
  ) {
    return this.chatsService.updateGroupInfo(chatId, dto, user.sub);
  }

  /**
   * POST /chats/:id/invite-link - Generate invite link
   */
  @Post(':id/invite-link')
  async generateInviteLink(
    @Param('id') chatId: string,
    @Body() dto: GenerateInviteLinkDto,
    @User() user: UserPayload,
  ) {
    return this.chatsService.generateInviteLink(chatId, dto, user.sub);
  }

  /**
   * POST /chats/:id/leave - Leave group chat
   */
  @Post(':id/leave')
  async leaveGroup(@Param('id') chatId: string, @User() user: UserPayload) {
    await this.chatsService.leaveGroup(chatId, user.sub);
    return { success: true };
  }

  /**
   * GET /chats/:id - Get chat by ID
   */
  @Get(':id')
  async getChatById(@Param('id') chatId: string, @User() user: UserPayload) {
    return this.chatsService.getChatById(chatId, user.sub);
  }

  /**
   * DELETE /chats/:id - Delete chat (soft delete)
   */
  @Delete(':id')
  async deleteChat(@Param('id') chatId: string, @User() user: UserPayload) {
    return this.chatsService.deleteChat(chatId, user.sub);
  }
}
