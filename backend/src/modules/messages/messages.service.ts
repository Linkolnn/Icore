import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @Inject(forwardRef(() => ChatsService))
    private chatsService: ChatsService,
  ) {}

  /**
   * Создать новое сообщение
   */
  async create(
    dto: CreateMessageDto,
    senderId: string,
  ): Promise<MessageDocument> {
    // 1. Проверка: является ли пользователь участником чата
    const isParticipant = await this.chatsService.isParticipant(
      dto.chat,
      senderId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // 2. Sanitize текст (защита от XSS)
    const sanitizedText = sanitizeHtml(dto.text, {
      allowedTags: [], // Никаких HTML тегов
      allowedAttributes: {},
    });

    // 3. Создание сообщения
    const message = await this.messageModel.create({
      sender: new Types.ObjectId(senderId),
      chat: new Types.ObjectId(dto.chat),
      text: sanitizedText,
      type: 'text',
      status: 'sent',
    });

    // 4. Populate sender и chat для возврата полного объекта
    const populatedMessage = await message.populate(['sender', 'chat']);

    // 5. Обновление lastMessage в чате (передаём весь объект сообщения)
    await this.chatsService.updateLastMessage(dto.chat, {
      text: message.text,
      sender: message.sender,
      createdAt: (message as any).createdAt || new Date(),
    });

    // 6. Увеличение unreadCount для всех участников кроме отправителя
    await this.chatsService.incrementUnreadCount(dto.chat, senderId);

    return populatedMessage;
  }

  /**
   * Получить сообщения чата с пагинацией
   */
  async getMessages(
    chatId: string,
    userId: string,
    limit = 50,
    skip = 0,
  ): Promise<{ messages: MessageDocument[]; hasMore: boolean }> {
    // 1. Проверка: является ли пользователь участником чата
    const isParticipant = await this.chatsService.isParticipant(
      chatId,
      userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // 2. Получение сообщений (от новых к старым)
    const messages = await this.messageModel
      .find({ chat: new Types.ObjectId(chatId), isDeleted: false })
      .sort({ createdAt: -1 }) // Сортировка: новые сверху
      .skip(skip)
      .limit(limit + 1) // +1 для проверки hasMore
      .populate('sender', 'username name avatar')
      .exec();

    // 3. Проверка hasMore
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Удаляем лишнее сообщение
    }

    return { messages, hasMore };
  }

  /**
   * Найти сообщение по ID
   */
  async findById(messageId: string): Promise<MessageDocument> {
    const message = await this.messageModel
      .findById(messageId)
      .populate(['sender', 'chat'])
      .exec();

    if (!message || message.isDeleted) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  /**
   * Soft delete сообщения
   */
  async softDelete(messageId: string, userId: string): Promise<void> {
    const message = await this.findById(messageId);

    // Проверка: только отправитель может удалить сообщение
    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    await message.save();
  }

  /**
   * Обновить статус сообщения
   */
  async updateStatus(
    messageId: string,
    status: 'sent' | 'delivered' | 'read',
  ): Promise<void> {
    await this.messageModel.findByIdAndUpdate(messageId, { status });
  }

  /**
   * Пометить все сообщения в чате как прочитанные
   */
  async markChatMessagesAsRead(
    chatId: string,
    userId: string,
  ): Promise<{ updatedCount: number; messageIds: string[] }> {
    // Находим все непрочитанные сообщения в чате, которые НЕ от текущего пользователя
    const messages = await this.messageModel.find({
      chat: chatId,
      sender: { $ne: userId },
      status: { $ne: 'read' },
    });

    const messageIds = messages.map((m) => (m as any)._id.toString());

    if (messageIds.length === 0) {
      return { updatedCount: 0, messageIds: [] };
    }

    // Обновляем статус на 'read'
    const result = await this.messageModel.updateMany(
      {
        _id: { $in: messageIds },
      },
      {
        status: 'read',
      },
    );

    return {
      updatedCount: result.modifiedCount || 0,
      messageIds,
    };
  }
}
