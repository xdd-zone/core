import type { MediaStorageDriver, MediaStorageSaveResult } from './media-storage.types'
import { CONFIG } from '@nexus/core/config'

import { CosMediaStorage } from './cos-media-storage'
import { LocalMediaStorage, resolveMediaStorageDir } from './local-media-storage'
import { ALLOWED_MEDIA_MIME_TYPES, isAllowedMediaMimeType } from './media-file'

function createMediaStorageDriver(): MediaStorageDriver {
  if (CONFIG.storage.provider === 'cos') {
    return new CosMediaStorage(CONFIG.storage.cos)
  }

  return new LocalMediaStorage()
}

export { ALLOWED_MEDIA_MIME_TYPES, isAllowedMediaMimeType, resolveMediaStorageDir }

export class MediaStorage {
  private static driver: MediaStorageDriver | null = null

  private static getDriver(): MediaStorageDriver {
    this.driver ??= createMediaStorageDriver()
    return this.driver
  }

  static useDriver(driver: MediaStorageDriver): void {
    this.driver = driver
  }

  static resetDriver(): void {
    this.driver = createMediaStorageDriver()
  }

  static async save(file: File): Promise<MediaStorageSaveResult> {
    return await this.getDriver().save(file)
  }

  static async openFile(storagePath: string, options: Parameters<MediaStorageDriver['openFile']>[1]): Promise<Response> {
    return await this.getDriver().openFile(storagePath, options)
  }

  static async remove(storagePath: string): Promise<void> {
    return await this.getDriver().remove(storagePath)
  }
}
