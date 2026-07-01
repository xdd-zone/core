import type { MomoRuntime } from '#momo/bootstrap'
import type { ContentRepository } from '#momo/modules/content/repositories/content.repository'
import type { TaxonomyRepository } from '#momo/modules/content/repositories/taxonomy.repository'
import type {
  ContentAssetReferenceRecord,
  ContentPostRecord,
  ContentPreviewTokenRecord,
} from '#momo/modules/content/types/content.types'
import type { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it, vi } from 'vitest'
import { createContentService } from '#momo/modules/content/services/content.service'

describe('content service', () => {
  it('预览 token 指向丢失的版本时返回系统错误', async () => {
    const repository = createRepository({
      getPostById: vi.fn(async () => createPostRecord()),
      getPreviewToken: vi.fn(async () => createPreviewTokenRecord()),
      getRevisionById: vi.fn(async () => undefined),
    })
    const service = createContentService(createRuntime(), repository, createTaxonomyRepository())

    await expect(service.getPreviewPost('preview-token')).rejects.toMatchObject({
      code: BizCode.SYSTEM_INTERNAL_ERROR,
      message: '文章预览版本不存在',
      status: 500,
    } satisfies Partial<AppError>)
  })

  it('素材被引用时不能删除', async () => {
    const repository = createRepository({
      deleteAsset: vi.fn(),
      findAssetReferences: vi.fn(async () => [createAssetReferenceRecord()]),
      getAssetById: vi.fn(async () => createAssetRecord()),
    })
    const service = createContentService(createRuntime(), repository, createTaxonomyRepository())

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
    const service = createContentService(runtime, repository, createTaxonomyRepository())

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

  it('cOS 公开地址会作为素材文件 URL 返回', async () => {
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
    const service = createContentService(runtime, repository, createTaxonomyRepository())

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
    const service = createContentService(createRuntime(), repository, createTaxonomyRepository())

    const result = await service.listAssets({ page: 1, pageSize: 24 })

    expect(result.assets[0]?.fileUrl).toBe('http://localhost:7788/rpc/content/assets/legacy-asset-id/file')
    expect(result.assets[0]?.url).toBe('/rpc/content/assets/legacy-asset-id/file')
  })
})

function createRepository(overrides: Partial<ContentRepository> = {}): ContentRepository {
  return {
    countAssets: vi.fn(),
    createAsset: vi.fn(),
    createPost: vi.fn(),
    createPreviewToken: vi.fn(),
    deleteAsset: vi.fn(),
    findAssetReferences: vi.fn(),
    findPostBySlug: vi.fn(),
    getAssetById: vi.fn(),
    getCategoriesByPostIds: vi.fn(),
    getPostById: vi.fn(),
    getPostBySlug: vi.fn(),
    getPreviewToken: vi.fn(),
    getRevisionById: vi.fn(),
    listAssets: vi.fn(),
    listPosts: vi.fn(),
    listPublicPosts: vi.fn(),
    markPreviewTokenUsed: vi.fn(),
    publishPost: vi.fn(),
    saveDraft: vi.fn(),
    updateAsset: vi.fn(),
    ...overrides,
  } as ContentRepository
}

function createTaxonomyRepository(overrides: Partial<TaxonomyRepository> = {}): TaxonomyRepository {
  return {
    countPostsByCategory: vi.fn(),
    countPostsByTag: vi.fn(),
    createCategory: vi.fn(),
    createTag: vi.fn(),
    deleteCategory: vi.fn(),
    deleteTag: vi.fn(),
    findCategoryBySlug: vi.fn(),
    findTagBySlug: vi.fn(),
    getCategoryById: vi.fn(),
    getCategoryBySlug: vi.fn(),
    getPostTags: vi.fn(async () => []),
    getPostTagsByPostIds: vi.fn(),
    getTagById: vi.fn(),
    getTagBySlug: vi.fn(),
    listCategories: vi.fn(),
    listCategoriesWithCount: vi.fn(),
    listTags: vi.fn(),
    listTagsWithCount: vi.fn(),
    setPostTags: vi.fn(),
    updateCategory: vi.fn(),
    updateTag: vi.fn(),
    ...overrides,
  } as TaxonomyRepository
}

function createRuntime(storageOverrides: Partial<MomoRuntime['storage']> = {}): MomoRuntime {
  return {
    env: {
      MOMO_PUBLIC_BASE_URL: 'http://localhost:7788',
    },
    storage: {
      remove: vi.fn(),
      save: vi.fn(),
      ...storageOverrides,
    },
  } as unknown as MomoRuntime
}

function createPostRecord(): ContentPostRecord {
  const now = new Date()

  return {
    categoryId: null,
    coverAssetId: null,
    createdAt: now,
    createdBy: 'user-id',
    draftRevisionId: 'revision-id',
    excerpt: null,
    id: 'post-id',
    publishedAt: null,
    publishedBy: null,
    publishedRevisionId: null,
    slug: 'post-slug',
    status: 'draft',
    title: 'Post title',
    updatedAt: now,
    updatedBy: 'user-id',
  }
}

function createPreviewTokenRecord(): ContentPreviewTokenRecord {
  const now = new Date()

  return {
    createdAt: now,
    createdBy: 'user-id',
    expiresAt: new Date(Date.now() + 60_000),
    id: 'preview-token-id',
    postId: 'post-id',
    revisionId: 'missing-revision',
    tokenHash: 'token-hash',
    usedAt: null,
  }
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

function createAssetReferenceRecord(): ContentAssetReferenceRecord {
  return {
    postId: 'post-id',
    postSlug: 'post-slug',
    postTitle: 'Post title',
    relation: 'cover',
  }
}
