import type { MomoRuntime } from '#momo/bootstrap'
import type { ContentRepository } from '#momo/modules/content/content.repository'
import type {
  ContentAssetReferenceRecord,
  ContentPostRecord,
  ContentPreviewTokenRecord,
} from '#momo/modules/content/content.types'
import type { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'
import { describe, expect, it, vi } from 'vitest'
import { createContentService } from '#momo/modules/content/content.service'

describe('content service', () => {
  it('预览 token 指向丢失的版本时返回系统错误', async () => {
    const repository = createRepository({
      getPostById: vi.fn(async () => createPostRecord()),
      getPreviewToken: vi.fn(async () => createPreviewTokenRecord()),
      getRevisionById: vi.fn(async () => undefined),
    })
    const service = createContentService(createRuntime(), repository)

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
    const service = createContentService(createRuntime(), repository)

    await expect(service.deleteAsset('asset-id')).rejects.toMatchObject({
      code: BizCode.BIZ_RULE_VIOLATION,
      message: '素材正在被文章使用，先移除引用再删除',
      status: 409,
    } satisfies Partial<AppError>)
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

function createRuntime(): MomoRuntime {
  return {
    storage: {
      remove: vi.fn(),
      save: vi.fn(),
    },
  } as unknown as MomoRuntime
}

function createPostRecord(): ContentPostRecord {
  const now = new Date()

  return {
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
