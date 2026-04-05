import type { Media, MediaList, MediaListQuery } from './model'
import type { MediaRecord } from './repository'

import { NotFoundError } from '@nexus/core/http'
import { MediaStorage } from '@nexus/infra/storage/media-storage'

import { MediaListSchema, MediaSchema } from './model'
import { MediaRepository } from './repository'

function serializeMedia(record: MediaRecord): Media {
  return MediaSchema.parse({
    id: record.id,
    fileName: record.fileName,
    originalName: record.originalName,
    mimeType: record.mimeType,
    size: record.size,
    url: record.url,
    uploadedBy: record.uploadedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  })
}

/**
 * 媒体服务类。
 */
export class MediaService {
  /**
   * 断言媒体记录存在。
   */
  private static async requireById(id: string): Promise<MediaRecord> {
    const media = await MediaRepository.findById(id)
    if (!media) {
      throw new NotFoundError('媒体不存在')
    }

    return media
  }

  /**
   * 获取媒体列表。
   */
  static async list(query: MediaListQuery): Promise<MediaList> {
    const result = await MediaRepository.paginate(query)

    return MediaListSchema.parse({
      ...result,
      items: result.items.map(serializeMedia),
    })
  }

  /**
   * 获取媒体详情。
   */
  static async findById(id: string): Promise<Media> {
    return serializeMedia(await this.requireById(id))
  }

  /**
   * 上传媒体文件并写入元信息。
   */
  static async upload(userId: string, file: File): Promise<Media> {
    const mediaId = crypto.randomUUID()
    const { fileName, storagePath } = await MediaStorage.save(file)

    try {
      return serializeMedia(
        await MediaRepository.create({
          id: mediaId,
          fileName,
          originalName: file.name || fileName,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          storagePath,
          url: `/api/media/${mediaId}/file`,
          uploadedBy: userId,
        }),
      )
    } catch (error) {
      await MediaStorage.remove(storagePath).catch(() => undefined)
      throw error
    }
  }

  /**
   * 读取媒体文件内容。
   */
  static async openFile(id: string): Promise<Response> {
    const media = await this.requireById(id)
    const file = await MediaStorage.read(media.storagePath)
    const fileBytes = Uint8Array.from(file)

    return new Response(fileBytes, {
      headers: {
        'content-disposition': `inline; filename="${encodeURIComponent(media.originalName)}"`,
        'content-length': String(media.size),
        'content-type': media.mimeType,
      },
      status: 200,
    })
  }

  /**
   * 删除媒体记录和本地文件。
   */
  static async remove(id: string): Promise<void> {
    const media = await this.requireById(id)

    await MediaStorage.remove(media.storagePath)
    await MediaRepository.delete(id)
  }
}
