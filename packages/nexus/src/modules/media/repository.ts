import type { PaginatedList, PaginationQuery } from '@nexus/infra/database'
import type { Prisma } from '@nexus/infra/database/prisma/generated/client'

import { prisma } from '@nexus/infra/database'
import { PrismaService } from '@nexus/infra/database/prisma.service'

import { MEDIA_BASE_SELECT } from './constants'

export type MediaRecord = Prisma.MediaGetPayload<{
  select: typeof MEDIA_BASE_SELECT
}>

/**
 * 媒体仓储类。
 */
export class MediaRepository {
  /**
   * 分页查询媒体资源。
   */
  static async paginate(query: PaginationQuery): Promise<PaginatedList<MediaRecord>> {
    return PrismaService.paginate<MediaRecord>('media', {}, query, {
      select: MEDIA_BASE_SELECT,
      orderBy: [{ createdAt: 'desc' }],
    })
  }

  /**
   * 根据 ID 查询媒体资源。
   */
  static async findById(id: string): Promise<MediaRecord | null> {
    return prisma.media.findUnique({
      where: { id },
      select: MEDIA_BASE_SELECT,
    })
  }

  /**
   * 创建媒体资源记录。
   */
  static async create(data: {
    id: string
    fileName: string
    originalName: string
    mimeType: string
    size: number
    storagePath: string
    url: string
    uploadedBy: string | null
  }): Promise<MediaRecord> {
    return prisma.media.create({
      data,
      select: MEDIA_BASE_SELECT,
    })
  }

  /**
   * 删除媒体资源记录。
   */
  static async delete(id: string) {
    return prisma.media.delete({
      where: { id },
    })
  }
}
