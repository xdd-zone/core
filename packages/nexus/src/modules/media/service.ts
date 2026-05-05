import type { Media, MediaList, MediaListQuery } from './model'
import type { MediaRecord } from './repository'

import { BadRequestError, NotFoundError } from '@nexus/core/http'
import { ALLOWED_MEDIA_MIME_TYPES, isAllowedMediaMimeType, MediaStorage } from '@nexus/infra/storage/media-storage'

import { serializeMedia } from './mapper'
import { MediaRepository } from './repository'

function assertAllowedMediaFile(file: File): void {
  if (!isAllowedMediaMimeType(file.type)) {
    throw new BadRequestError(
      `不支持的文件类型。只允许上传 ${ALLOWED_MEDIA_MIME_TYPES.join('、')} 图片`,
      'MEDIA_UNSUPPORTED_MIME_TYPE',
    )
  }
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

    return {
      ...result,
      items: result.items.map(serializeMedia),
    }
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
    assertAllowedMediaFile(file)

    const mediaId = crypto.randomUUID()
    const { fileName, publicUrl, storagePath } = await MediaStorage.save(file)

    try {
      return serializeMedia(
        await MediaRepository.create({
          id: mediaId,
          fileName,
          originalName: file.name || fileName,
          mimeType: file.type,
          size: file.size,
          storagePath,
          url: publicUrl ?? `/api/media/${mediaId}/file`,
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
    return await MediaStorage.openFile(media.storagePath, {
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
    })
  }

  /**
   * 删除媒体记录和本地文件。
   */
  static async remove(id: string): Promise<void> {
    const media = await this.requireById(id)

    await MediaRepository.delete(id)
    await MediaStorage.remove(media.storagePath).catch((error: unknown) => {
      console.error(`媒体文件删除失败: ${media.storagePath}`, error)
    })
  }
}
