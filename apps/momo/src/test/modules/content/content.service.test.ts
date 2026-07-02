import type { MomoRuntime } from '#momo/bootstrap'
import type { ContentRepository } from '#momo/modules/content/repositories/content.repository'
import type { TaxonomyRepository } from '#momo/modules/content/repositories/taxonomy.repository'
import type { ContentPostRecord, ContentPreviewTokenRecord } from '#momo/modules/content/types/content.types'
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

})

function createRepository(overrides: Partial<ContentRepository> = {}): ContentRepository {
  return {
    createPost: vi.fn(),
    createPreviewToken: vi.fn(),
    findPostBySlug: vi.fn(),
    getAssetById: vi.fn(),
    getCategoriesByPostIds: vi.fn(),
    getPostById: vi.fn(),
    getPostBySlug: vi.fn(),
    getPreviewToken: vi.fn(),
    getRevisionById: vi.fn(),
    listPosts: vi.fn(),
    listPublicPosts: vi.fn(),
    markPreviewTokenUsed: vi.fn(),
    publishPost: vi.fn(),
    saveDraft: vi.fn(),
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
    draftCoverAssetId: null,
    draftExcerpt: null,
    draftRevisionId: 'revision-id',
    draftSlug: 'post-slug',
    draftTitle: 'Post title',
    excerpt: null,
    id: 'post-id',
    publishedAt: null,
    publishedBy: null,
    publishedCoverAssetId: null,
    publishedExcerpt: null,
    publishedRevisionId: null,
    publishedSlug: null,
    publishedTitle: null,
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
    targetId: 'post-id',
    targetType: 'post',
    tokenHash: 'token-hash',
    usedAt: null,
  }
}
