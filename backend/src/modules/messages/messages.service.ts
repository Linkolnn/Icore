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
    const messageData: any = {
      sender: new Types.ObjectId(senderId),
      chat: new Types.ObjectId(dto.chat),
      text: sanitizedText,
      type: 'text',
      status: 'sent',
    };

    // Добавляем информацию о пересылке, если есть
    if (dto.forwarded && (dto.forwarded.from || dto.forwarded.fromName)) {
      messageData.forwarded = {
        from: dto.forwarded.from ? new Types.ObjectId(dto.forwarded.from) : undefined,
        fromName: dto.forwarded.fromName,  // Save the name directly
        originalChatId: dto.forwarded.originalChatId ? new Types.ObjectId(dto.forwarded.originalChatId) : undefined,
        originalMessageId: dto.forwarded.originalMessageId ? new Types.ObjectId(dto.forwarded.originalMessageId) : undefined,
        originalCreatedAt: dto.forwarded.originalCreatedAt ? new Date(dto.forwarded.originalCreatedAt) : undefined,
      };
    }

    // Добавляем информацию об ответе, если есть
    if (dto.replyTo) {
      messageData.replyTo = new Types.ObjectId(dto.replyTo);
    }

    const message = await this.messageModel.create(messageData);

    // 4. Populate sender, chat, forwarded.from и replyTo для возврата полного объекта
    const populatedMessage = await message.populate([
      'sender',
      'chat',
      'forwarded.from',
      {
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name email'
        }
      }
    ]);
    

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
      .populate({
        path: 'forwarded.from',
        model: 'User',
        select: 'username name avatar email userId'
      })
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          model: 'User',
          select: 'username name avatar'
        }
      })
      .exec();
    
    // Debug: log first forwarded message
    const forwardedMsg = messages.find(m => m.forwarded);
    if (forwardedMsg) {
      const fromUser = forwardedMsg.forwarded?.from as any;
    }

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
   * Проверить, является ли сообщение последним в чате
   */
  async isLastMessage(messageId: string, chatId: string): Promise<boolean> {
    const lastMessage = await this.messageModel
      .findOne({ 
        chat: chatId, 
        isDeleted: false 
      })
      .sort({ createdAt: -1 })
      .limit(1);
    
    return lastMessage !== null && (lastMessage as any)._id.toString() === messageId;
  }

  /**
   * Получить последнее сообщение в чате
   */
  async getLastMessageInChat(chatId: string): Promise<any> {
    const lastMessage = await this.messageModel
      .findOne({ 
        chat: chatId, 
        isDeleted: false 
      })
      .sort({ createdAt: -1 })
      .populate('sender')
      .limit(1);
    
    return lastMessage;
  }

  /**
   * Soft delete сообщения
   * @returns новое последнее сообщение или null
   */
  async softDelete(messageId: string, userId: string): Promise<any> {
    const message = await this.findById(messageId);

    // Проверка: только отправитель может удалить сообщение
    const senderId = typeof message.sender === 'string' 
      ? message.sender 
      : (message.sender as any)._id?.toString() || message.sender.toString();
      
    if (senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Сохраняем chatId перед удалением
    const chatId = typeof message.chat === 'string' 
      ? message.chat 
      : message.chat._id || message.chat;

    // Помечаем сообщение как удаленное
    message.isDeleted = true;
    await message.save();

    // Проверяем, было ли это последним сообщением в чате
    const currentLastMessage = await this.messageModel
      .findOne({ 
        chat: chatId, 
        isDeleted: false 
      })
      .sort({ createdAt: -1 })
      .populate('sender')
      .limit(1);

    if (currentLastMessage) {
      // Обновляем lastMessage на новое последнее сообщение
      await this.chatsService.updateLastMessage(chatId.toString(), currentLastMessage);
      return currentLastMessage; // Возвращаем новое lastMessage
    } else {
      // Если сообщений больше нет, очищаем lastMessage
      await this.chatsService.clearLastMessage(chatId.toString());
      return null; // Возвращаем null если сообщений нет
    }
  }

  /**
   * Обновить статус сообщения на delivered
   */
  async markAsDelivered(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument | null> {
    const message = await this.messageModel.findById(messageId);
    
    if (!message || message.sender.toString() === userId) {
      return null; // Не помечаем свои сообщения
    }

    if (message.status === 'sent') {
      message.status = 'delivered';
      message.deliveredAt = new Date();
      await message.save();
      return message;
    }
    
    return null;
  }

  /**
   * Обновить статус сообщения на read
   */
  async markAsRead(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument | null> {
    const message = await this.messageModel.findById(messageId);
    
    if (!message || message.sender.toString() === userId) {
      return null; // Не помечаем свои сообщения
    }

    // Обновляем основной статус
    if (message.status !== 'read') {
      message.status = 'read';
      message.readAt = new Date();
    }

    // Для групповых чатов добавляем в readBy
    message.readBy.set(userId, new Date());
    
    await message.save();
    return message;
  }

  /**
   * Пометить все сообщения в чате как прочитанные
   */
  async markChatAsRead(
    chatId: string,
    userId: string,
  ): Promise<{ updatedCount: number; messages: MessageDocument[] }> {
    // Находим все непрочитанные сообщения в чате, которые НЕ от текущего пользователя
    const messages = await this.messageModel.find({
      chat: new Types.ObjectId(chatId),
      sender: { $ne: new Types.ObjectId(userId) },
      status: { $ne: 'read' },
      isDeleted: false,
    });

    if (messages.length === 0) {
      return { updatedCount: 0, messages: [] };
    }

    // Обновляем каждое сообщение
    const updatedMessages: MessageDocument[] = [];
    for (const message of messages) {
      message.status = 'read';
      message.readAt = new Date();
      message.readBy.set(userId, new Date());
      await message.save();
      updatedMessages.push(message);
    }

    return {
      updatedCount: updatedMessages.length,
      messages: updatedMessages,
    };
  }

  /**
   * Редактировать сообщение
   */
  async editMessage(
    messageId: string,
    userId: string,
    newText: string,
  ): Promise<MessageDocument> {
    const message = await this.findById(messageId);

    // Проверка: нельзя редактировать пересланные сообщения
    if (message.forwarded) {
      throw new ForbiddenException('Cannot edit forwarded messages');
    }

    // Проверка прав
    const senderId = typeof message.sender === 'string' 
      ? message.sender 
      : (message.sender as any)._id?.toString() || message.sender.toString();
      
    if (senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Проверка времени (24 часа)
    const dayInMs = 24 * 60 * 60 * 1000;
    if (Date.now() - (message as any).createdAt.getTime() > dayInMs) {
      throw new ForbiddenException('Cannot edit message older than 24 hours');
    }

    // Максимум 10 редактирований
    if (message.editHistory && message.editHistory.length >= 10) {
      throw new ForbiddenException('Maximum edit limit reached');
    }

    // Санитизация нового текста
    const sanitizedText = sanitizeHtml(newText, {
      allowedTags: [],
      allowedAttributes: {},
    });

    // Сохраняем в историю
    if (!message.editHistory) {
      message.editHistory = [];
    }
    message.editHistory.push({
      text: message.text,
      editedAt: new Date(),
    });

    // Обновляем текст
    message.text = sanitizedText;
    message.editedAt = new Date();
    
    await message.save();
    // Populate sender для полной информации
    const populatedMessage = await message.populate('sender');
    
    // Проверяем, является ли это последним сообщением в чате
    // и обновляем lastMessage в чате
    const chatId = typeof populatedMessage.chat === 'string' 
      ? populatedMessage.chat 
      : populatedMessage.chat._id || populatedMessage.chat;
    
    const lastMessageInChat = await this.messageModel
      .findOne({ 
        chat: chatId, 
        isDeleted: false 
      })
      .sort({ createdAt: -1 })
      .limit(1);
    
    if (lastMessageInChat !== null && (lastMessageInChat as any)._id.toString() === (populatedMessage as any)._id.toString()) {
      // Это последнее сообщение - обновляем lastMessage в чате
      await this.chatsService.updateLastMessage(chatId.toString(), populatedMessage);
    }
    
    return populatedMessage;
  }

  /**
   * Удалить сообщение (soft delete)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument> {
    const message = await this.findById(messageId);

    // Проверка прав
    const senderId = typeof message.sender === 'string' 
      ? message.sender 
      : (message.sender as any)._id?.toString() || message.sender.toString();
      
    if (senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = 'Сообщение удалено';
    
    await message.save();
    return message;
  }

  /**
   * Получить сообщения с cursor-based пагинацией
   */
  async getMessagesPaginated(
    chatId: string,
    userId: string,
    before?: Date,
    limit = 50,
  ): Promise<{
    messages: MessageDocument[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    // Проверка участия в чате
    const isParticipant = await this.chatsService.isParticipant(
      chatId,
      userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    // Построение запроса
    const query: any = {
      chat: new Types.ObjectId(chatId),
      isDeleted: false,
    };

    // Если есть cursor, добавляем условие
    if (before) {
      query.createdAt = { $lt: before };
    }

    // Получаем сообщения + 1 для проверки hasMore
    const messages = await this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('sender', 'username name avatar')
      .populate({
        path: 'forwarded.from',
        model: 'User',
        select: 'username name avatar email userId'
      })
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          model: 'User',
          select: 'username name avatar'
        }
      })
      .exec();

    // Проверяем, есть ли еще сообщения
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Удаляем лишнее сообщение
    }

    // Определяем nextCursor
    const nextCursor = messages.length > 0 
      ? (messages[messages.length - 1] as any).createdAt.toISOString()
      : undefined;

    return {
      messages: messages.reverse(), // Возвращаем в хронологическом порядке
      hasMore,
      nextCursor,
    };
  }

  /**
   * Поиск сообщений
   */
  async searchMessages(
    userId: string,
    query: string,
    chatId?: string,
    limit = 20,
  ): Promise<{
    messages: MessageDocument[];
    total: number;
    highlights?: Map<string, string[]>;
  }> {
    if (!query || query.trim().length < 2) {
      return { messages: [], total: 0 };
    }

    // Строим условия поиска
    const searchConditions: any = {
      isDeleted: false,
      text: { $regex: query, $options: 'i' }, // Case-insensitive regex search
    };

    // Если указан чат
    if (chatId) {
      const isParticipant = await this.chatsService.isParticipant(
        chatId,
        userId,
      );
      if (!isParticipant) {
        throw new ForbiddenException('You are not a participant of this chat');
      }
      searchConditions.chat = new Types.ObjectId(chatId);
    } else {
      // Получаем все чаты пользователя
      const userChats = await this.chatsService.getUserChats(userId);
      const chatIds = userChats.map(chat => new Types.ObjectId(chat._id));
      searchConditions.chat = { $in: chatIds };
    }

    // Выполняем поиск
    const messages = await this.messageModel
      .find(searchConditions)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'username name avatar')
      .populate('chat', 'name type')
      .exec();

    // Подсчитываем общее количество
    const total = await this.messageModel.countDocuments(searchConditions);

    // Создаем подсветку для найденных фрагментов
    const highlights = new Map<string, string[]>();
    const regex = new RegExp(`(${query})`, 'gi');
    
    messages.forEach(message => {
      const matches = message.text.match(regex);
      if (matches) {
        highlights.set((message as any)._id.toString(), matches);
      }
    });

    return {
      messages,
      total,
      highlights,
    };
  }
}
