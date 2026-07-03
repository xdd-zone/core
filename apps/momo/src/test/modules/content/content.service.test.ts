import type { MomoRuntime } from '#momo/bootstrap'
import type { AssetsRepository } from '#momo/modules/assets/index'
import type { ContentRepository } from '#momo/modules/content/repositories/content.repository'
import type { TaxonomyRepository } from '#momo/modules/content/repositories/taxonomy.repository'
import type {
  ContentPostRecord,
  ContentPreviewTokenRecord,
  ContentRevisionRecord,
} from '#momo/modules/content/types/content.types'
import type { EventsService } from '#momo/modules/events/index'
import type { ProjectsRepository } from '#momo/modules/projects/projects.repository'
import type { AppError } from '#momo/shared/app-error'
import { BizCode, OperationWarning } from '@xdd-zone/contracts'
import { describe, expect, it, vi } from 'vitest'
import { createContentService } from '#momo/modules/content/services/content.service'
import { createPreviewService } from '#momo/modules/preview/preview.service'

describe('preview service', () => {
  it('预览 token 指向丢失的版本时返回系统错误', async () => {
    const repository = createRepository({
      getPostById: vi.fn(async () => createPostRecord()),
      getPreviewToken: vi.fn(async () => createPreviewTokenRecord()),
      getRevisionById: vi.fn(async () => undefined),
    })
    const service = createPreviewService(repository, createTaxonomyRepository(), createProjectsRepository())

    await expect(service.getPreview('preview-token')).rejects.toMatchObject({
      code: BizCode.SYSTEM_INTERNAL_ERROR,
      message: '文章预览版本不存在',
      status: 500,
    } satisfies Partial<AppError>)
  })
})

describe('content service', () => {
  it('归档文章时返回事件处理 warning', async () => {
    const warnings: OperationWarning[] = [
      {
        code: 'content.post.archive.side_effect_failed',
        message: '文章已归档，但 Bobo 缓存刷新或搜索索引删除失败。稍后可以重试刷新。',
      },
    ]
    const service = createContentService(
      createRuntime(),
      createRepository({
        archivePost: vi.fn(async () => createPostRecord({ status: 'archived' })),
        getRevisionById: vi.fn(async () => createRevisionRecord()),
      }),
      createTaxonomyRepository(),
      createAssetsRepository(),
      undefined,
      createEventsService({
        handleContentPostArchived: vi.fn(async () => warnings),
      }),
    )

    const result = await service.archivePost('post-id', 'user-id')

    expect(result.post.status).toBe('archived')
    expect(result.warnings).toEqual(warnings)
  })
})

function createRepository(overrides: Partial<ContentRepository> = {}): ContentRepository {
  return {
    archivePost: vi.fn(),
    createPost: vi.fn(),
    createPreviewToken: vi.fn(),
    findPostBySlug: vi.fn(),
    getAssetById: vi.fn(),
    getCategoriesByPostIds: vi.fn(),
    getPublishedCategoriesByPostIds: vi.fn(),
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

function createAssetsRepository(overrides: Partial<AssetsRepository> = {}): AssetsRepository {
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

function createEventsService(overrides: Partial<EventsService> = {}): EventsService {
  return {
    handleContentPostArchived: vi.fn(async () => []),
    handleContentPostPublished: vi.fn(async () => []),
    handleProjectArchived: vi.fn(),
    handleProjectPublished: vi.fn(),
    retryEvent: vi.fn(),
    retryPending: vi.fn(),
    ...overrides,
  } as EventsService
}

function createRuntime(): MomoRuntime {
  return {} as MomoRuntime
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
    getPublishedPostTags: vi.fn(async () => []),
    getPublishedPostTagsByPostIds: vi.fn(),
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

function createProjectsRepository(overrides: Partial<ProjectsRepository> = {}): ProjectsRepository {
  return {
    createPreviewToken: vi.fn(),
    createProject: vi.fn(),
    getProjectById: vi.fn(),
    getProjectByPublishedSlug: vi.fn(),
    listProjects: vi.fn(),
    listPublicProjects: vi.fn(),
    publishProject: vi.fn(),
    saveDraft: vi.fn(),
    archiveProject: vi.fn(),
    ...overrides,
  } as ProjectsRepository
}

function createPostRecord(overrides: Partial<ContentPostRecord> = {}): ContentPostRecord {
  const now = new Date()

  return {
    createdAt: now,
    createdBy: 'user-id',
    draftCategoryId: null,
    draftCoverAssetId: null,
    draftExcerpt: null,
    draftRevisionId: 'revision-id',
    draftSlug: 'post-slug',
    draftTitle: 'Post title',
    id: 'post-id',
    publishedAt: null,
    publishedBy: null,
    publishedCategoryId: null,
    publishedCoverAssetId: null,
    publishedExcerpt: null,
    publishedRevisionId: null,
    publishedSlug: null,
    publishedTitle: null,
    status: 'draft',
    updatedAt: now,
    updatedBy: 'user-id',
    ...overrides,
  }
}

function createRevisionRecord(overrides: Partial<ContentRevisionRecord> = {}): ContentRevisionRecord {
  const now = new Date()

  return {
    createdAt: now,
    createdBy: 'user-id',
    excerpt: null,
    id: 'revision-id',
    postId: 'post-id',
    revisionNo: 1,
    source: '# Post',
    title: 'Post title',
    ...overrides,
  }
}

function createPreviewTokenRecord(): ContentPreviewTokenRecord {
  const now = new Date()

  return {
    createdAt: now,
    createdBy: 'user-id',
    expiresAt: new Date(Date.now() + 60_000),
    id: 'preview-token-id',
    targetId: 'post-id',
    targetType: 'post',
    tokenHash: 'token-hash',
    usedAt: null,
  }
}
