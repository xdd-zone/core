import { extname } from 'node:path'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

const MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE = {
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

/** 允许上传的媒体 MIME 类型列表 */
export const ALLOWED_MEDIA_MIME_TYPES = Object.keys(MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE)

/** 允许保存的媒体文件大小上限 */
export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024

/** 检查 MIME 类型是否在白名单内 */
export function isAllowedMediaMimeType(mimeType: string): mimeType is keyof typeof MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE {
  return Object.hasOwn(MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE, mimeType)
}

/** 检查文件是否为允许保存的媒体文件 */
export function validateMediaFile(file: File): void {
  if (!isAllowedMediaMimeType(file.type)) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, '不支持的文件类型', 422)
  }

  if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, '文件大小不能超过 10 MiB', 422)
  }
}

/** 根据文件的 MIME 类型生成 UUID 文件名 */
export function createMediaFileName(file: File): string {
  const extension = isAllowedMediaMimeType(file.type)
    ? MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE[file.type]
    : extname(file.name)
  return `${crypto.randomUUID()}${extension}`
}
