import type { UpdateMyPasswordResponse, User } from './model'
import type { UserBaseData } from './types'
import { serializeDateTime } from '@nexus/shared/schema'

export function serializeUser(user: UserBaseData): User {
  return {
    ...user,
    emailVerifiedAt: serializeDateTime(user.emailVerifiedAt),
    phoneVerifiedAt: serializeDateTime(user.phoneVerifiedAt),
    lastLogin: serializeDateTime(user.lastLogin),
    createdAt: serializeDateTime(user.createdAt),
    updatedAt: serializeDateTime(user.updatedAt),
    deletedAt: serializeDateTime(user.deletedAt),
  }
}

export function serializeUserList(items: UserBaseData[]): User[] {
  return items.map(serializeUser)
}

export function createUpdateMyPasswordResponse(): UpdateMyPasswordResponse {
  return {
    hasPassword: true,
  }
}
