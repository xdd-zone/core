import type { StorageDriver, StorageOpenFileOptions, StorageSaveResult } from './storage.types'
import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'
import COS from 'cos-nodejs-sdk-v5'

import { createMediaFileName } from './media-file'

/** COS 存储配置 */
export interface CosStorageConfig {
  secretId: string
  secretKey: string
  bucket: string
  region: string
  keyPrefix: string
  publicBaseUrl?: string
  signedUrlExpires: number
}

/** 拼接 COS 对象 key */
function joinCosKey(prefix: string, fileName: string): string {
  const normalizedPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '')
  return normalizedPrefix ? `${normalizedPrefix}/${fileName}` : fileName
}

/** 判断是否为 COS SDK 错误 */
function isCosError(error: unknown): error is { statusCode: number } {
  return error !== null && typeof error === 'object' && 'statusCode' in error
}

/** 统一处理 COS SDK 错误 */
function handleCosError(error: unknown): never {
  if (isCosError(error) && error.statusCode === 404) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
  }

  throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文件存储访问失败', 500)
}

/** 腾讯云 COS 存储驱动 */
export class CosStorage implements StorageDriver {
  private readonly client: COS

  constructor(private readonly config: CosStorageConfig) {
    this.client = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
    })
  }

  async save(file: File): Promise<StorageSaveResult> {
    const fileName = createMediaFileName(file)
    const storagePath = joinCosKey(this.config.keyPrefix, fileName)

    try {
      await this.client.putObject({
        Body: Buffer.from(await file.arrayBuffer()),
        Bucket: this.config.bucket,
        ContentLength: file.size,
        ContentType: file.type,
        Key: storagePath,
        Region: this.config.region,
      })
    } catch (error) {
      handleCosError(error)
    }

    return {
      fileName,
      storagePath,
      publicUrl: this.config.publicBaseUrl
        ? `${this.config.publicBaseUrl.replace(/\/+$/, '')}/${storagePath}`
        : undefined,
    }
  }

  async openFile(storagePath: string, _options: StorageOpenFileOptions): Promise<Response> {
    try {
      const url = this.resolveObjectUrl(storagePath)
      return new Response(null, { status: 302, headers: { location: url } })
    } catch (error) {
      handleCosError(error)
    }
  }

  async remove(storagePath: string): Promise<void> {
    try {
      await this.client.deleteObject({
        Bucket: this.config.bucket,
        Key: storagePath,
        Region: this.config.region,
      })
    } catch (error) {
      handleCosError(error)
    }
  }

  /** 获取对象访问 URL：有公开域名时拼接静态地址，否则生成带签名的临时链接 */
  private resolveObjectUrl(storagePath: string): string {
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl.replace(/\/+$/, '')}/${storagePath}`
    }

    return this.client.getObjectUrl({
      Bucket: this.config.bucket,
      Expires: this.config.signedUrlExpires,
      Key: storagePath,
      Method: 'GET',
      Protocol: 'https:',
      Region: this.config.region,
      Sign: true,
    })
  }
}
