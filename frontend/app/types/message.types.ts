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
 * Message interface
 */
export interface Message {
  _id: string
  sender: User | string // Can be populated User object or just ID string
  chat: Chat | string // Can be populated Chat object or just ID string
  text: string
  type: MessageType
  status: MessageStatus
  isDeleted: boolean
  createdAt: string
  updatedAt: string
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

export interface MessageSendResponse extends WsResponse {
  message: Message
}
