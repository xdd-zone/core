import type { StorageDriver, StorageFileStat, StorageOpenFileOptions, StorageSaveResult } from './storage.types'
import { BizCode } from '@xdd-zone/contracts'
import COS from 'cos-nodejs-sdk-v5'
import { AppError } from '#momo/shared/app-error'

import { createMediaFileName, validateMediaFile } from './media-file'
import { validateStoragePath } from './storage-path'

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

export interface CosStorageClient {
  putObject: (params: COS.PutObjectParams) => Promise<unknown>
  deleteObject: (params: COS.DeleteObjectParams) => Promise<unknown>
  getObjectUrl: (params: COS.GetObjectUrlParams) => string
  headObject: (params: COS.HeadObjectParams) => Promise<COS.HeadObjectResult>
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
  if (error instanceof AppError) {
    throw error
  }

  if (isCosError(error) && error.statusCode === 404) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, '文件不存在', 404)
  }

  if (isCosError(error) && (error.statusCode === 401 || error.statusCode === 403)) {
    throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文件存储权限不足', 500)
  }

  throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文件存储访问失败', 500)
}

/** 腾讯云 COS 存储驱动 */
export class CosStorage implements StorageDriver {
  private readonly client: CosStorageClient

  constructor(
    private readonly config: CosStorageConfig,
    client?: CosStorageClient,
  ) {
    this.client =
      client ??
      new COS({
        SecretId: config.secretId,
        SecretKey: config.secretKey,
      })
  }

  async save(file: File): Promise<StorageSaveResult> {
    validateMediaFile(file)
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
      validateStoragePath(storagePath)
      const url = this.resolveObjectUrl(storagePath)
      return new Response(null, { status: 302, headers: { location: url } })
    } catch (error) {
      handleCosError(error)
    }
  }

  async remove(storagePath: string): Promise<void> {
    try {
      validateStoragePath(storagePath)
      await this.client.deleteObject({
        Bucket: this.config.bucket,
        Key: storagePath,
        Region: this.config.region,
      })
    } catch (error) {
      handleCosError(error)
    }
  }

  async stat(storagePath: string): Promise<StorageFileStat> {
    try {
      validateStoragePath(storagePath)
      const result = await this.client.headObject({
        Bucket: this.config.bucket,
        Key: storagePath,
        Region: this.config.region,
      })
      const headers = result.headers ?? {}
      const contentLength = headers['content-length']
      const contentType = headers['content-type']
      const lastModifiedHeader = headers['last-modified']
      const lastModified =
        typeof lastModifiedHeader === 'string' && lastModifiedHeader ? new Date(lastModifiedHeader) : undefined

      return {
        storagePath,
        size: Number(contentLength ?? 0),
        mimeType: typeof contentType === 'string' ? contentType : undefined,
        lastModified: lastModified && Number.isNaN(lastModified.getTime()) ? undefined : lastModified,
      }
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
