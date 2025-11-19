import type { User } from './user.types'
import type { Chat } from './chat.types'

/**
 * Message type enum
 */
export type MessageType = 'text' | 'image' | 'file' | 'voice'

/**
 * Message status enum
 * - pending: optimistic UI, waiting for server confirmation
 * - sent: confirmed by server
 * - delivered: delivered to recipient
 * - read: read by recipient
 * - failed: failed to send
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

/**
 * Reply message info
 */
export interface ReplyInfo {
  _id: string
  sender: User | string
  text: string
  createdAt: string
  replyTo?: {
    _id: string
    text: string
    sender: string | User
  }
  
  // Forward (old format - for backward compatibility)
  forwardInfo?: {
    originalSender: string | User
    originalChatId: string
    originalMessageId: string
    originalCreatedAt: string
  }
  
  // Forward (new format)
  forwarded?: {
    from: string | User
    originalChatId?: string
    originalMessageId?: string
    originalCreatedAt?: string
  }
  
  // Multiple forward
  forwardedMessages?: Message[]
}

/**
 * Forwarded message info
 */
export interface ForwardInfo {
  originalSender: User | string
  originalChat?: Chat | string
  forwardedAt: string
  forwardedBy?: User | string
}

/**
 * Message interface
 */
export interface Message {
  _id: string
  sender: User | string // Can be populated User object or just ID string
  chat: Chat | string // Can be populated Chat object or just ID string
  text: string
  type: MessageType
  status?: MessageStatus
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
  
  // Read receipts
  deliveredAt?: string
  readAt?: string
  readBy?: Map<string, Date> | Record<string, Date>
  
  // Edit history
  editedAt?: string
  editHistory?: Array<{
    text: string
    editedAt: string
  }>
  
  // Soft delete
  deletedAt?: string
  
  // Reply to message
  replyTo?: ReplyInfo | null
  
  // Forwarded message
  forwardInfo?: ForwardInfo | null
  forwarded?: {
    from: string | User
    fromName?: string  // Store the sender's name directly
    originalChatId?: string
    originalMessageId?: string
    originalCreatedAt?: string
  }
  forwardedMessages?: Message[] // For multiple forwarded messages
}

/**
 * WebSocket event payloads
 */
export interface ChatJoinPayload {
  chatId: string
}

export interface ChatLeavePayload {
  chatId: string
}

export interface MessageSendPayload {
  chatId: string
  text: string
}

export interface MessageTypingPayload {
  chatId: string
  isTyping: boolean
}

export interface MessageTypingResponse {
  chatId: string
  userId: string
  isTyping: boolean
}

/**
 * WebSocket response interfaces
 */
export interface WsResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export interface MessageSendResponse extends WsResponse<Message> {
  // data будет содержать Message
}
