import { extname } from 'node:path'

const MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE = {
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

export const ALLOWED_MEDIA_MIME_TYPES = Object.keys(MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE)

export function isAllowedMediaMimeType(mimeType: string): mimeType is keyof typeof MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE {
  return Object.prototype.hasOwnProperty.call(MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE, mimeType)
}

export function createMediaFileName(file: File): string {
  const extension = isAllowedMediaMimeType(file.type) ? MEDIA_FILE_EXTENSIONS_BY_MIME_TYPE[file.type] : extname(file.name)
  return `${crypto.randomUUID()}${extension}`
}
