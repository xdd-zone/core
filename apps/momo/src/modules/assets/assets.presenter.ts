import type { ImageAsset } from '@xdd-zone/contracts'
import type { AssetRecord } from './types'
import { ImageAssetSchema } from '@xdd-zone/contracts'

export function toImageAsset(asset: AssetRecord, momoPublicBaseUrl: string): ImageAsset {
  return ImageAssetSchema.parse({
    alt: asset.alt,
    createdAt: asset.createdAt.toISOString(),
    fileName: asset.fileName,
    fileUrl: resolveAssetFileUrl(asset, momoPublicBaseUrl),
    id: asset.id,
    mimeType: asset.mimeType,
    size: asset.size,
    storagePath: asset.storagePath,
    updatedAt: asset.updatedAt.toISOString(),
    url: asset.url,
  })
}

function resolveAssetFileUrl(asset: AssetRecord, momoPublicBaseUrl: string): string {
  if (asset.url && URL.canParse(asset.url)) {
    return asset.url
  }

  return `${momoPublicBaseUrl.replace(/\/+$/, '')}/rpc/assets/${asset.id}/file`
}
