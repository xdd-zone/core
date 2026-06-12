import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'

/** 校验存储路径，拒绝空路径、绝对路径、反斜杠和路径遍历 */
export function validateStoragePath(storagePath: string): void {
  const segments = storagePath.split('/')

  if (
    storagePath.length === 0 ||
    storagePath.startsWith('/') ||
    storagePath.includes('\\') ||
    segments.includes('..')
  ) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
  }
}
