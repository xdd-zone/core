import type { CommentStatus as DatabaseCommentStatus } from '@nexus/infra/database/prisma/generated'
import type { Comment, CommentList, CommentListQuery } from './model'
import type { CommentBaseData, CommentWhereInput } from './types'
import { BadRequestError, NotFoundError } from '@nexus/core/http'
import { buildKeywordSearch } from '@nexus/infra/database'
import { COMMENT_SEARCH_FIELDS } from './constants'
import { CommentListSchema, CommentSchema } from './model'
import { CommentRepository } from './repository'

function toDatabaseStatus(status: 'pending' | 'approved' | 'hidden' | 'deleted'): DatabaseCommentStatus {
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

function toHttpStatus(status: DatabaseCommentStatus): 'pending' | 'approved' | 'hidden' | 'deleted' {
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

function serializeComment(comment: CommentBaseData) {
  return {
    ...comment,
    status: toHttpStatus(comment.status),
  }
}

/**
 * 评论服务类。
 */
export class CommentService {
  /**
   * 构建评论列表查询条件。
   */
  private static buildWhereConditions(query: CommentListQuery): CommentWhereInput {
    const where: CommentWhereInput = {}

    if (query.status) {
      where.status = toDatabaseStatus(query.status)
    }

    if (query.postId) {
      where.postId = query.postId
    }

    if (query.createdFrom || query.createdTo) {
      where.createdAt = {
        gte: query.createdFrom ? new Date(query.createdFrom) : undefined,
        lte: query.createdTo ? new Date(query.createdTo) : undefined,
      }
    }

    const keywordSearch = buildKeywordSearch(query.keyword, [...COMMENT_SEARCH_FIELDS]) as
      | CommentWhereInput['OR']
      | undefined
    if (keywordSearch) {
      where.OR = keywordSearch
    }

    return where
  }

  /**
   * 断言评论存在。
   */
  private static async requireById(id: string) {
    const comment = await CommentRepository.findById(id)
    if (!comment) {
      throw new NotFoundError('评论不存在')
    }

    return comment
  }

  /**
   * 获取评论列表。
   */
  static async list(query: CommentListQuery): Promise<CommentList> {
    const result = await CommentRepository.paginate(this.buildWhereConditions(query), query)

    return CommentListSchema.parse({
      ...result,
      items: result.items.map(serializeComment),
    })
  }

  /**
   * 获取评论详情。
   */
  static async findById(id: string): Promise<Comment> {
    return CommentSchema.parse(serializeComment(await this.requireById(id)))
  }

  /**
   * 更新评论状态。
   */
  static async updateStatus(id: string, status: 'pending' | 'approved' | 'hidden'): Promise<Comment> {
    const comment = await this.requireById(id)

    if (comment.status === 'DELETED') {
      throw new BadRequestError('已删除评论不能再修改状态')
    }

    if (toHttpStatus(comment.status) === status) {
      return CommentSchema.parse(serializeComment(comment))
    }

    return CommentSchema.parse(serializeComment(await CommentRepository.updateStatus(id, toDatabaseStatus(status))))
  }

  /**
   * 删除评论。
   */
  static async remove(id: string): Promise<void> {
    const comment = await this.requireById(id)

    if (comment.status === 'DELETED') {
      return
    }

    await CommentRepository.updateStatus(id, 'DELETED')
  }
}
