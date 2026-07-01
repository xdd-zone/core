import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

/** 校验存储路径，拒绝空路径、绝对路径、反斜杠和路径遍历 */
export function validateStoragePath(storagePath: string): void {
  const segments = storagePath.split('/')

  if (
    storagePath.length === 0 ||
    storagePath.startsWith('/') ||
    storagePath.includes('\\') ||
    segments.includes('') ||
    segments.includes('..')
  ) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
  }
}

/** 校验保存目录，目录必须是相对路径 */
export function validateStorageDirectory(directory: string): void {
  validateStoragePath(directory)
}

/** 拼接存储路径，返回用 / 分隔的相对路径 */
export function joinStoragePath(...parts: string[]): string {
  const storagePath = parts
    .map((part) => part.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter(Boolean)
    .join('/')

  validateStoragePath(storagePath)
  return storagePath
}
