import type {
  AssetDetailResponse,
  AssetListResponse,
  AssetReference,
  ImageAsset,
  UpdateAssetRequest,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { AssetsRepository } from './assets.repository'
import type { AssetReferenceRecord } from './types'
import { randomUUID } from 'node:crypto'
import { BizCode } from '@xdd-zone/contracts'
import { validateMediaFile } from '#momo/infra/storage'
import { AppError } from '#momo/shared/app-error'

import { toImageAsset } from './assets.presenter'

const ASSET_LIST_DEFAULT_PAGE_SIZE = 24
const ASSET_LIST_MAX_PAGE_SIZE = 100

export function createAssetsService(runtime: MomoRuntime, repository: AssetsRepository) {
  async function listAssets(params: {
    keyword?: string
    mimeType?: string
    page?: number
    pageSize?: number
  }): Promise<AssetListResponse> {
    const page = normalizePage(params.page)
    const pageSize = normalizePageSize(params.pageSize)
    const keyword = normalizeText(params.keyword)
    const mimeType = normalizeText(params.mimeType)
    const offset = (page - 1) * pageSize
    const [assets, total] = await Promise.all([
      repository.listAssets({ keyword, limit: pageSize, mimeType, offset }),
      repository.countAssets({ keyword, mimeType }),
    ])

    return {
      assets: assets.map((asset) => toImageAsset(asset, runtime.env.MOMO_PUBLIC_BASE_URL)),
      page,
      pageSize,
      total,
    }
  }

  async function getAssetById(id: string): Promise<AssetDetailResponse> {
    const asset = await repository.getAssetById(id)

    if (!asset) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '素材不存在', 404)
    }

    const references = await repository.findAssetReferences(id, buildAssetFileUrl(id))
    return {
      asset: toImageAsset(asset, runtime.env.MOMO_PUBLIC_BASE_URL),
      references: references.map((reference) => toAssetReference(reference)),
    }
  }

  async function openAssetFile(id: string): Promise<Response> {
    const asset = await repository.getAssetById(id)

    if (!asset) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '素材不存在', 404)
    }

    return runtime.storage.openFile(asset.storagePath, {
      originalName: asset.fileName,
      mimeType: asset.mimeType,
      size: asset.size,
    })
  }

  async function uploadImage(file: File, userId: string): Promise<ImageAsset> {
    validateMediaFile(file)

    const saved = await runtime.storage.save(file)
    const assetId = randomUUID()

    try {
      const asset = await repository.createAsset({
        alt: null,
        createdBy: userId,
        fileName: saved.fileName,
        id: assetId,
        mimeType: file.type,
        size: file.size,
        storagePath: saved.storagePath,
        url: saved.publicUrl ?? null,
      })
      return toImageAsset(asset, runtime.env.MOMO_PUBLIC_BASE_URL)
    } catch (error) {
      await runtime.storage.remove(saved.storagePath).catch(() => undefined)
      throw error
    }
  }

  async function updateAsset(id: string, input: UpdateAssetRequest): Promise<ImageAsset> {
    const updated = await repository.updateAsset({
      alt: input.alt,
      id,
      updatedAt: new Date(),
    })

    if (!updated) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '素材不存在', 404)
    }

    return toImageAsset(updated, runtime.env.MOMO_PUBLIC_BASE_URL)
  }

  async function deleteAsset(id: string): Promise<{ assetId: string }> {
    const references = await repository.findAssetReferences(id, buildAssetFileUrl(id))

    if (references.length > 0) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '素材正在被内容使用，先移除引用再删除', 409, {
        references,
      })
    }

    const asset = await repository.deleteAsset(id)

    if (!asset) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '素材不存在', 404)
    }

    await runtime.storage.remove(asset.storagePath).catch(() => undefined)
    return { assetId: id }
  }

  function buildAssetFileUrl(assetId: string): string {
    return `${runtime.env.MOMO_PUBLIC_BASE_URL.replace(/\/+$/, '')}/rpc/assets/${assetId}/file`
  }

  return {
    deleteAsset,
    getAssetById,
    listAssets,
    openAssetFile,
    updateAsset,
    uploadImage,
  }
}

function toAssetReference(reference: AssetReferenceRecord): AssetReference {
  return {
    relation: reference.relation,
    targetId: reference.targetId,
    targetSlug: reference.targetSlug ?? '',
    targetTitle: reference.targetTitle ?? '',
    targetType: reference.targetType,
  }
}

function normalizePage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) {
    return 1
  }

  return Math.max(1, Math.floor(value))
}

function normalizePageSize(value: number | undefined): number {
  if (!value || Number.isNaN(value)) {
    return ASSET_LIST_DEFAULT_PAGE_SIZE
  }

  return Math.min(ASSET_LIST_MAX_PAGE_SIZE, Math.max(1, Math.floor(value)))
}

function normalizeText(value: string | undefined): string | undefined {
  return value?.trim() || undefined
}

export type AssetsService = ReturnType<typeof createAssetsService>
