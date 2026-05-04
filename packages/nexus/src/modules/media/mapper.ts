import type { Media } from './model'
import type { MediaRecord } from './repository'
import { serializeDateTime } from '@nexus/shared/schema'

export function serializeMedia(record: MediaRecord): Media {
  return {
    id: record.id,
    fileName: record.fileName,
    originalName: record.originalName,
    mimeType: record.mimeType,
    size: record.size,
    url: record.url,
    uploadedBy: record.uploadedBy,
    createdAt: serializeDateTime(record.createdAt),
    updatedAt: serializeDateTime(record.updatedAt),
  }
}
