import type { User } from './user.types'

/**
 * Chat types
 */
export type ChatType = 'personal' | 'group' | 'channel'

/**
 * Last message in chat
 */
export interface LastMessage {
  text: string
  sender: User
  createdAt: string
}

/**
 * Chat interface
 */
export interface Chat {
  _id: string
  type: ChatType
  participants: User[]
  name?: string
  lastMessage?: LastMessage
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Create chat DTO
 */
export interface CreateChatDto {
  type: ChatType
  participantId: string
  name?: string
}

/**
 * Update chat DTO
 */
export interface UpdateChatDto {
  name?: string
}
