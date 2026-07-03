import type {
  CreatePostRequest,
  GeneratePostMetaRequest,
  GeneratePostMetaResponse,
  OperationWarning,
  PostDetail,
  PostSummary,
  PreviewTokenResponse,
  SavePostDraftRequest,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { AssetsRepository } from '#momo/modules/assets/index'
import type { EventsService } from '#momo/modules/events/index'
import type { LlmService } from '#momo/modules/llm/index'
import type { ContentRepository } from '../repositories/content.repository'
import type { TaxonomyRepository } from '../repositories/taxonomy.repository'
import type { ContentPostRecord } from '../types/content.types'
import { createHash, randomUUID } from 'node:crypto'
import { BizCode } from '@xdd-zone/contracts'
import { createLlmService } from '#momo/modules/llm/index'
import { AppError } from '#momo/shared/app-error'

import { toPostDetail, toPostSummary, toPreviewTokenResponse } from '../content.presenter'
import { findUnknownMdxComponents, MDX_COMPONENTS } from '../mdx-components'
import { ContentAssetNotFoundError, ContentSlugConflictError } from '../repositories/content.repository'

const PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000

export function createContentService(
  runtime: MomoRuntime,
  repository: ContentRepository,
  taxonomyRepository: TaxonomyRepository,
  assetsRepository: AssetsRepository,
  llmService?: LlmService,
  eventsService?: EventsService,
) {
  function readCreateDraft(input: CreatePostRequest) {
    return input.draft
  }

  function readSaveDraft(input: SavePostDraftRequest) {
    return input.draft
  }

  async function listPosts(): Promise<PostSummary[]> {
    const posts = await repository.listPosts()
    return enrichPostsWithTaxonomy(posts)
  }

  async function getPostById(id: string): Promise<PostDetail> {
    const post = await repository.getPostById(id)

    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const source = post.draftRevisionId
      ? (await getRequiredRevisionById(post.draftRevisionId, '文章草稿版本不存在')).source
      : ''

    const [draftCategory, draftTags, publishedCategory, publishedTags] = await Promise.all([
      post.draftCategoryId ? taxonomyRepository.getCategoryById(post.draftCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
      post.publishedCategoryId ? taxonomyRepository.getCategoryById(post.publishedCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPublishedPostTags(id),
    ])

    return toPostDetail(post, source, draftCategory ?? null, draftTags, publishedCategory ?? null, publishedTags)
  }

  async function createPost(input: CreatePostRequest, userId: string): Promise<PostDetail> {
    const draft = readCreateDraft(input)
    const duplicate = await repository.findPostBySlug(draft.slug)
    if (duplicate) {
      throw new AppError(BizCode.CONTENT_SLUG_CONFLICT, 'slug 已存在', 409)
    }

    await ensureCoverAssetExists(draft.coverAssetId)
    await ensureCategoryExists(draft.categoryId)
    await ensureTagsExist(draft.tagIds)
    assertKnownMdxComponents(draft.source)

    const id = randomUUID()
    const revisionId = randomUUID()

    const post = await runContentRepositoryAction(() =>
      repository.createPost({
        categoryId: draft.categoryId,
        coverAssetId: draft.coverAssetId,
        excerpt: draft.excerpt,
        id,
        revisionId,
        slug: draft.slug,
        source: draft.source,
        tagIds: draft.tagIds,
        title: draft.title,
        userId,
      }),
    )

    if (!post) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '保存文章失败', 500)
    }

    const [draftCategory, draftTags, publishedCategory, publishedTags] = await Promise.all([
      post.draftCategoryId ? taxonomyRepository.getCategoryById(post.draftCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
      post.publishedCategoryId ? taxonomyRepository.getCategoryById(post.publishedCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPublishedPostTags(id),
    ])

    return toPostDetail(post, draft.source, draftCategory ?? null, draftTags, publishedCategory ?? null, publishedTags)
  }

  async function generatePostMetaSuggestion(
    input: GeneratePostMetaRequest,
    context: { actorId?: string | null; requestId?: string | null } = {},
  ): Promise<GeneratePostMetaResponse> {
    const result = await (llmService ?? createLlmService(runtime)).generatePostMetaSuggestion(input, {
      actorId: context.actorId,
      requestId: context.requestId,
      sourceId: input.postId ?? null,
      sourceType: input.postId ? 'content.post' : null,
    })
    const findPostBySlug = (slug: string) => repository.findPostBySlug(slug)
    const suggestion = await normalizePostMetaSuggestion(input, result.suggestion, findPostBySlug)

    return {
      suggestion,
      usage: result.usage,
    }
  }

  async function saveDraft(id: string, input: SavePostDraftRequest, userId: string): Promise<PostDetail> {
    const draft = readSaveDraft(input)
    const current = await repository.getPostById(id)
    if (!current) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const nextSlug = draft.slug ?? current.draftSlug
    const duplicate = nextSlug === current.draftSlug ? undefined : await repository.findPostBySlug(nextSlug, id)
    if (duplicate) {
      throw new AppError(BizCode.CONTENT_SLUG_CONFLICT, 'slug 已存在', 409)
    }

    const source = draft.source ?? (await getDraftSource(current))
    await ensureCoverAssetExists(draft.coverAssetId)
    await ensureCategoryExists(draft.categoryId)
    await ensureTagsExist(draft.tagIds)
    assertKnownMdxComponents(source)

    const revisionId = randomUUID()

    const post = await runContentRepositoryAction(() =>
      repository.saveDraft({
        categoryId: draft.categoryId,
        coverAssetId: draft.coverAssetId,
        excerpt: draft.excerpt,
        id,
        revisionId,
        slug: draft.slug,
        source,
        tagIds: draft.tagIds,
        title: draft.title,
        userId,
      }),
    )

    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const [draftCategory, draftTags, publishedCategory, publishedTags] = await Promise.all([
      post.draftCategoryId ? taxonomyRepository.getCategoryById(post.draftCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
      post.publishedCategoryId ? taxonomyRepository.getCategoryById(post.publishedCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPublishedPostTags(id),
    ])

    return toPostDetail(post, source, draftCategory ?? null, draftTags, publishedCategory ?? null, publishedTags)
  }

  async function publishPost(id: string, userId: string): Promise<{ post: PostDetail; warnings?: OperationWarning[] }> {
    const eventId = randomUUID()
    const result = await runContentRepositoryAction(() =>
      repository.publishPost({
        eventId,
        postId: id,
        userId,
      }),
    )

    if (result.status === 'not_found') {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (result.status === 'no_draft') {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '没有可发布的草稿', 409)
    }

    if (result.status === 'missing_draft_revision') {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文章草稿版本不存在', 500)
    }

    const [draftCategory, draftTags, publishedCategory, publishedTags] = await Promise.all([
      result.post.draftCategoryId
        ? taxonomyRepository.getCategoryById(result.post.draftCategoryId)
        : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
      result.post.publishedCategoryId
        ? taxonomyRepository.getCategoryById(result.post.publishedCategoryId)
        : Promise.resolve(null),
      taxonomyRepository.getPublishedPostTags(id),
    ])

    const warnings = eventsService?.handleContentPostPublished
      ? await eventsService.handleContentPostPublished(result.eventId, {
          postId: result.post.id,
          publishedAt: result.post.publishedAt?.toISOString() ?? null,
          publishedSlug: result.post.publishedSlug,
          summary: result.post.publishedExcerpt,
          title: result.post.publishedTitle,
        })
      : []

    return {
      post: toPostDetail(
        result.post,
        result.revision.source,
        draftCategory ?? null,
        draftTags,
        publishedCategory ?? null,
        publishedTags,
      ),
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  async function createPreviewToken(id: string, userId: string): Promise<PreviewTokenResponse> {
    const post = await repository.getPostById(id)
    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (!post.draftRevisionId) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '没有可预览的草稿', 409)
    }

    const token = randomUUID().replaceAll('-', '')
    const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS)

    await repository.createPreviewToken({
      createdBy: userId,
      expiresAt,
      id: randomUUID(),
      targetId: id,
      targetType: 'post',
      tokenHash: hashToken(token),
    })

    return toPreviewTokenResponse({
      expiresAt,
      targetId: id,
      targetType: 'post',
      token,
    })
  }

  async function archivePost(id: string, userId: string): Promise<{ post: PostDetail; warnings?: OperationWarning[] }> {
    const eventId = randomUUID()
    const post = await runContentRepositoryAction(() =>
      repository.archivePost({
        eventId,
        postId: id,
        userId,
      }),
    )
    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const [draftCategory, draftTags, publishedCategory, publishedTags, source] = await Promise.all([
      post.draftCategoryId ? taxonomyRepository.getCategoryById(post.draftCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
      post.publishedCategoryId ? taxonomyRepository.getCategoryById(post.publishedCategoryId) : Promise.resolve(null),
      taxonomyRepository.getPublishedPostTags(id),
      post.draftRevisionId
        ? getRequiredRevisionById(post.draftRevisionId, '文章草稿版本不存在')
        : Promise.resolve(null),
    ])

    const warnings = eventsService?.handleContentPostArchived
      ? await eventsService.handleContentPostArchived({
          eventId,
          postId: post.id,
          publishedSlug: post.publishedSlug,
        })
      : []

    return {
      post: toPostDetail(
        post,
        source?.source ?? '',
        draftCategory ?? null,
        draftTags,
        publishedCategory ?? null,
        publishedTags,
      ),
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  function getMdxComponents() {
    return { components: MDX_COMPONENTS }
  }

  async function getDraftSource(post: ContentPostRecord): Promise<string> {
    if (!post.draftRevisionId) {
      return ''
    }

    const revision = await getRequiredRevisionById(post.draftRevisionId, '文章草稿版本不存在')
    return revision.source
  }

  async function getRequiredRevisionById(id: string, message: string) {
    const revision = await repository.getRevisionById(id)

    if (!revision) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, message, 500)
    }

    return revision
  }

  async function ensureCoverAssetExists(coverAssetId: string | null | undefined): Promise<void> {
    if (!coverAssetId) {
      return
    }

    const asset = await assetsRepository.getAssetById(coverAssetId)

    if (!asset) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '素材不存在', 404)
    }
  }

  async function ensureCategoryExists(categoryId: string | null | undefined): Promise<void> {
    if (!categoryId) {
      return
    }

    const category = await taxonomyRepository.getCategoryById(categoryId)

    if (!category) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '分类不存在', 404)
    }
  }

  async function ensureTagsExist(tagIds: string[] | undefined): Promise<void> {
    if (!tagIds || tagIds.length === 0) {
      return
    }

    const uniqueTagIds = [...new Set(tagIds)]

    const tags = await Promise.all(uniqueTagIds.map((id) => taxonomyRepository.getTagById(id)))

    const missing = uniqueTagIds.filter((_id, index) => !tags[index])

    if (missing.length > 0) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '标签不存在', 404, { missingTagIds: missing })
    }
  }

  async function enrichPostsWithTaxonomy(posts: ContentPostRecord[]): Promise<PostSummary[]> {
    if (posts.length === 0) {
      return []
    }

    const postIds = posts.map((p) => p.id)
    const [categoryIdMap, publishedCategoryIdMap] = await Promise.all([
      repository.getCategoriesByPostIds(postIds),
      repository.getPublishedCategoriesByPostIds(postIds),
    ])
    const uniqueCategoryIds = [...new Set([...categoryIdMap.values(), ...publishedCategoryIdMap.values()])]

    const [categories, tagsMap, publishedTagsMap] = await Promise.all([
      Promise.all(uniqueCategoryIds.map((id) => taxonomyRepository.getCategoryById(id))),
      taxonomyRepository.getPostTagsByPostIds(postIds),
      taxonomyRepository.getPublishedPostTagsByPostIds(postIds),
    ])

    const categoryMap = new Map(categories.filter((c): c is NonNullable<typeof c> => !!c).map((c) => [c.id, c]))

    return posts.map((post) => {
      const categoryId = categoryIdMap.get(post.id)
      const category = categoryId ? (categoryMap.get(categoryId) ?? null) : null
      const publishedCategoryId = publishedCategoryIdMap.get(post.id)
      const publishedCategory = publishedCategoryId ? (categoryMap.get(publishedCategoryId) ?? null) : null
      const tags = tagsMap.get(post.id) ?? []
      const publishedTags = publishedTagsMap.get(post.id) ?? []

      return toPostSummary(post, category, tags, publishedCategory, publishedTags)
    })
  }

  return {
    createPost,
    createPreviewToken,
    generatePostMetaSuggestion,
    getMdxComponents,
    getPostById,
    archivePost,
    listPosts,
    publishPost,
    saveDraft,
  }
}

function assertKnownMdxComponents(source: string): void {
  const unknownComponents = findUnknownMdxComponents(source)

  if (unknownComponents.length > 0) {
    throw new AppError(BizCode.CONTENT_UNKNOWN_MDX_COMPONENT, '存在未知 MDX 组件', 422, { unknownComponents })
  }
}

async function runContentRepositoryAction<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (error instanceof ContentSlugConflictError) {
      throw new AppError(BizCode.CONTENT_SLUG_CONFLICT, 'slug 已存在', 409)
    }

    if (error instanceof ContentAssetNotFoundError) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '素材不存在', 404)
    }

    throw error
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function normalizePostSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 160)
    .replaceAll(/-$/g, '')
}

export async function normalizePostMetaSuggestion(
  input: GeneratePostMetaRequest,
  suggestion: GeneratePostMetaResponse['suggestion'],
  findPostBySlug: (slug: string) => Promise<unknown>,
): Promise<GeneratePostMetaResponse['suggestion']> {
  const normalized: GeneratePostMetaResponse['suggestion'] = {}

  if (input.targets.includes('slug') && suggestion.slug) {
    const slug = normalizePostSlug(suggestion.slug)

    if (slug) {
      const duplicate = await findPostBySlug(slug)
      normalized.slug = slug
      normalized.slugAvailable = !duplicate
    }
  }

  if (input.targets.includes('excerpt') && suggestion.excerpt) {
    normalized.excerpt = suggestion.excerpt.trim().slice(0, 500)
  }

  if (input.targets.includes('title') && suggestion.title) {
    normalized.title = suggestion.title.trim().slice(0, 160)
  }

  return normalized
}

export type ContentService = ReturnType<typeof createContentService>
