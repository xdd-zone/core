import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type { CommentStatus } from '@nexus/infra/database/prisma/generated'
import type { CommentBaseData, CommentWhereInput } from './types'
import { prisma } from '@nexus/infra/database'
import { PrismaService } from '@nexus/infra/database/prisma.service'
import { COMMENT_BASE_SELECT } from './constants'

/**
 * 评论仓储类。
 */
export class CommentRepository {
  /**
   * 判断已发布文章是否存在。
   */
  static async publishedPostExists(postId: string): Promise<boolean> {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        status: 'PUBLISHED',
      },
      select: { id: true },
    })

    return Boolean(post)
  }

  /**
   * 分页查询评论。
   */
  static async paginate(where: CommentWhereInput, query: PaginationQuery): Promise<PaginatedList<CommentBaseData>> {
    return PrismaService.paginate<CommentBaseData>('comment', where, query, {
      select: COMMENT_BASE_SELECT,
      orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
    })
  }

  /**
   * 根据 ID 查询评论。
   */
  static async findById(id: string): Promise<CommentBaseData | null> {
    return prisma.comment.findUnique({
      where: { id },
      select: COMMENT_BASE_SELECT,
    })
  }

  /**
   * 创建评论。
   */
  static async create(data: {
    postId: string
    authorName: string
    authorEmail?: string | null
    content: string
  }): Promise<CommentBaseData> {
    return prisma.comment.create({
      data: {
        postId: data.postId,
        authorName: data.authorName,
        authorEmail: data.authorEmail ?? null,
        content: data.content,
        status: 'PENDING',
      },
      select: COMMENT_BASE_SELECT,
    })
  }

  /**
   * 更新评论状态。
   */
  static async updateStatus(id: string, status: CommentStatus): Promise<CommentBaseData> {
    return prisma.comment.update({
      where: { id },
      data: { status },
      select: COMMENT_BASE_SELECT,
    })
  }
}
