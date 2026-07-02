import type { MomoRuntime } from '#momo/bootstrap'
import type { AssetsRepository } from '#momo/modules/assets/assets.repository'
import type { AssetReferenceRecord } from '#momo/modules/assets/types'
import type { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it, vi } from 'vitest'
import { createAssetsService } from '#momo/modules/assets/assets.service'

describe('assets service', () => {
  it('素材被引用时不能删除', async () => {
    const repository = createRepository({
      deleteAsset: vi.fn(),
      findAssetReferences: vi.fn(async () => [createAssetReferenceRecord()]),
      getAssetById: vi.fn(async () => createAssetRecord()),
    })
    const service = createAssetsService(createRuntime(), repository)

    await expect(service.deleteAsset('asset-id')).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: '素材正在被文章使用，先移除引用再删除',
      status: 409,
    } satisfies Partial<AppError>)
  })

  it('本地存储上传图片时写入素材读取 URL', async () => {
    const repository = createRepository({
      createAsset: vi.fn(async (input) => ({
        ...createAssetRecord(),
        id: input.id,
        url: input.url,
      })),
    })
    const runtime = createRuntime({
      save: vi.fn(async () => ({
        fileName: 'photo.png',
        storagePath: 'content/images/photo.png',
      })),
    })
    const service = createAssetsService(runtime, repository)

    const asset = await service.uploadImage(
      new File([Buffer.from('png-data')], 'photo.png', { type: 'image/png' }),
      'user-id',
    )

    expect(asset.fileUrl).toBe(`http://localhost:7788/rpc/content/assets/${asset.id}/file`)
    expect(asset.url).toBeNull()
    expect(repository.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        id: asset.id,
        url: null,
      }),
    )
  })

  it('cos 公开地址会作为素材文件 URL 返回', async () => {
    const repository = createRepository({
      createAsset: vi.fn(async (input) => ({
        ...createAssetRecord(),
        id: input.id,
        url: input.url,
      })),
    })
    const runtime = createRuntime({
      save: vi.fn(async () => ({
        fileName: 'photo.png',
        publicUrl: 'https://media.example.com/content/images/photo.png',
        storagePath: 'content/images/photo.png',
      })),
    })
    const service = createAssetsService(runtime, repository)

    const asset = await service.uploadImage(
      new File([Buffer.from('png-data')], 'photo.png', { type: 'image/png' }),
      'user-id',
    )

    expect(asset.fileUrl).toBe('https://media.example.com/content/images/photo.png')
    expect(asset.url).toBe('https://media.example.com/content/images/photo.png')
    expect(repository.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        id: asset.id,
        url: 'https://media.example.com/content/images/photo.png',
      }),
    )
  })

  it('旧的相对素材 URL 会转成当前 Momo 文件 URL 返回', async () => {
    const repository = createRepository({
      listAssets: vi.fn(async () => [
        {
          ...createAssetRecord(),
          id: 'legacy-asset-id',
          url: '/rpc/content/assets/legacy-asset-id/file',
        },
      ]),
      countAssets: vi.fn(async () => 1),
    })
    const service = createAssetsService(createRuntime(), repository)

    const result = await service.listAssets({ page: 1, pageSize: 24 })

    expect(result.assets[0]?.fileUrl).toBe('http://localhost:7788/rpc/content/assets/legacy-asset-id/file')
    expect(result.assets[0]?.url).toBe('/rpc/content/assets/legacy-asset-id/file')
  })
})

function createRepository(overrides: Partial<AssetsRepository> = {}): AssetsRepository {
  return {
    countAssets: vi.fn(),
    createAsset: vi.fn(),
    deleteAsset: vi.fn(),
    findAssetReferences: vi.fn(),
    getAssetById: vi.fn(),
    listAssets: vi.fn(),
    updateAsset: vi.fn(),
    ...overrides,
  } as AssetsRepository
}

function createRuntime(storageOverrides: Partial<MomoRuntime['storage']> = {}): MomoRuntime {
  return {
    env: {
      MOMO_PUBLIC_BASE_URL: 'http://localhost:7788',
    },
    storage: {
      openFile: vi.fn(),
      remove: vi.fn(),
      save: vi.fn(),
      ...storageOverrides,
    },
  } as unknown as MomoRuntime
}

function createAssetRecord() {
  const now = new Date()

  return {
    alt: null,
    createdAt: now,
    fileName: 'photo.png',
    id: 'asset-id',
    mimeType: 'image/png',
    size: 8,
    storagePath: 'content/images/photo.png',
    updatedAt: now,
    url: null,
  }
}

function createAssetReferenceRecord(): AssetReferenceRecord {
  return {
    postId: 'post-id',
    postSlug: 'post-slug',
    postTitle: 'Post title',
    relation: 'cover',
  }
}
