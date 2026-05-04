import type { CommentStatus as DatabaseCommentStatus } from '@nexus-prisma/generated/client'
import type { Comment } from './model'
import type { CommentBaseData } from './types'
import { serializeDateTime } from '@nexus/shared/schema'

export function toDatabaseCommentStatus(status: 'pending' | 'approved' | 'hidden' | 'deleted'): DatabaseCommentStatus {
  switch (status) {
    case 'approved':
      return 'APPROVED'
    case 'hidden':
      return 'HIDDEN'
    case 'deleted':
      return 'DELETED'
    default:
      return 'PENDING'
  }
}

export function toHttpCommentStatus(status: DatabaseCommentStatus): 'pending' | 'approved' | 'hidden' | 'deleted' {
  switch (status) {
    case 'APPROVED':
      return 'approved'
    case 'HIDDEN':
      return 'hidden'
    case 'DELETED':
      return 'deleted'
    default:
      return 'pending'
  }
}

export function serializeComment(comment: CommentBaseData): Comment {
  return {
    ...comment,
    status: toHttpCommentStatus(comment.status),
    createdAt: serializeDateTime(comment.createdAt),
    updatedAt: serializeDateTime(comment.updatedAt),
  }
}
