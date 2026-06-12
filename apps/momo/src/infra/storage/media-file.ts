import { extname } from 'node:path'

const MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE = {
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

/** 允许上传的媒体 MIME 类型列表 */
export const ALLOWED_MEDIA_MIME_TYPES = Object.keys(MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE)

/** 检查 MIME 类型是否在白名单内 */
export function isAllowedMediaMimeType(mimeType: string): mimeType is keyof typeof MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE {
  return Object.prototype.hasOwnProperty.call(MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE, mimeType)
}

/** 根据文件的 MIME 类型生成 UUID 文件名 */
export function createMediaFileName(file: File): string {
  const extension = isAllowedMediaMimeType(file.type)
    ? MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE[file.type]
    : extname(file.name)
  return `${crypto.randomUUID()}${extension}`
}
