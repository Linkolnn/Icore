import type { User } from './auth.types'

// Re-export User type
export type { User } from './auth.types'

export interface SearchUsersParams {
  query: string
  page?: number
  limit?: number
}

export interface SearchUsersResponse {
  users: User[]
  total: number
  limit: number
  skip: number
  hasMore: boolean
}
