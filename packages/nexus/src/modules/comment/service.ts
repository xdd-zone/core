import type { Comment, CommentList, CommentListQuery, CreateCommentBody } from './model'
import type { CommentWhereInput } from './types'
import { BadRequestError, NotFoundError } from '@nexus/core/http'
import { buildKeywordSearch } from '@nexus/infra/database'
import { COMMENT_SEARCH_FIELDS } from './constants'
import { serializeComment, toDatabaseCommentStatus, toHttpCommentStatus } from './mapper'
import { CommentRepository } from './repository'

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
      where.status = toDatabaseCommentStatus(query.status)
    } else {
      where.status = {
        not: 'DELETED',
      }
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

    return {
      ...result,
      items: result.items.map(serializeComment),
    }
  }

  /**
   * 获取评论详情。
   */
  static async findById(id: string): Promise<Comment> {
    return serializeComment(await this.requireById(id))
  }

  /**
   * 创建评论。
   */
  static async create(data: CreateCommentBody): Promise<Comment> {
    const postExists = await CommentRepository.publishedPostExists(data.postId)
    if (!postExists) {
      throw new NotFoundError('文章不存在或未发布')
    }

    return serializeComment(
      await CommentRepository.create({
        postId: data.postId,
        authorName: data.authorName,
        authorEmail: data.authorEmail ?? null,
        content: data.content,
      }),
    )
  }

  /**
   * 更新评论状态。
   */
  static async updateStatus(id: string, status: 'pending' | 'approved' | 'hidden'): Promise<Comment> {
    const comment = await this.requireById(id)

    if (comment.status === 'DELETED') {
      throw new BadRequestError('已删除评论不能再修改状态')
    }

    if (toHttpCommentStatus(comment.status) === status) {
      return serializeComment(comment)
    }

    return serializeComment(await CommentRepository.updateStatus(id, toDatabaseCommentStatus(status)))
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
