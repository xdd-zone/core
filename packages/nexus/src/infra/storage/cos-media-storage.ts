import type { ResolvedConfig } from '@nexus/core/config'
import type { MediaStorageDriver, MediaStorageOpenFileOptions, MediaStorageSaveResult } from './media-storage.types'
import { InternalServerError, NotFoundError } from '@nexus/core/http'
import COS from 'cos-nodejs-sdk-v5'

import { createMediaFileName } from './media-file'

export type CosSdkClient = Pick<COS, 'deleteObject' | 'getObjectUrl' | 'putObject'>

function joinCosKey(prefix: string, fileName: string): string {
  const normalizedPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '')
  return normalizedPrefix ? `${normalizedPrefix}/${fileName}` : fileName
}

function toCosError(error: unknown): COS.CosSdkError | null {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return error as COS.CosSdkError
  }

  return null
}

function handleCosError(error: unknown): never {
  const cosError = toCosError(error)

  if (cosError?.statusCode === 404) {
    throw new NotFoundError('媒体文件不存在')
  }

  throw new InternalServerError('媒体文件存储访问失败')
}

export class CosMediaStorage implements MediaStorageDriver {
  private readonly bucket: string
  private readonly client: CosSdkClient
  private readonly keyPrefix: string
  private readonly publicBaseUrl?: string
  private readonly region: string
  private readonly signedUrlExpires: number

  constructor(config: ResolvedConfig['storage']['cos'], client?: CosSdkClient) {
    if (!config?.secretId || !config.secretKey || !config.bucket || !config.region) {
      throw new Error('COS 存储配置不完整')
    }

    this.bucket = config.bucket
    this.keyPrefix = config.keyPrefix
    this.publicBaseUrl = config.publicBaseUrl
    this.region = config.region
    this.signedUrlExpires = config.signedUrlExpires
    this.client =
      client ??
      new COS({
        SecretId: config.secretId,
        SecretKey: config.secretKey,
      })
  }

  async save(file: File): Promise<MediaStorageSaveResult> {
    const fileName = createMediaFileName(file)
    const storagePath = joinCosKey(this.keyPrefix, fileName)

    try {
      await this.client.putObject({
        Body: Buffer.from(await file.arrayBuffer()),
        Bucket: this.bucket,
        ContentLength: file.size,
        ContentType: file.type,
        Key: storagePath,
        Region: this.region,
      })
    } catch (error) {
      handleCosError(error)
    }

    return {
      fileName,
      storagePath,
    }
  }

  private resolveObjectUrl(storagePath: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${storagePath}`
    }

    return this.client.getObjectUrl({
      Bucket: this.bucket,
      Expires: this.signedUrlExpires,
      Key: storagePath,
      Method: 'GET',
      Protocol: 'https:',
      Region: this.region,
      Sign: true,
    })
  }

  async openFile(storagePath: string, _options: MediaStorageOpenFileOptions): Promise<Response> {
    try {
      const url = this.resolveObjectUrl(storagePath)

      return new Response(null, {
        headers: {
          location: url,
        },
        status: 302,
      })
    } catch (error) {
      handleCosError(error)
    }
  }

  async remove(storagePath: string): Promise<void> {
    try {
      await this.client.deleteObject({
        Bucket: this.bucket,
        Key: storagePath,
        Region: this.region,
      })
    } catch (error) {
      handleCosError(error)
    }
  }
}
