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
