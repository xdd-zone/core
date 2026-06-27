import type {
  AssetDetailResponse,
  AssetListResponse,
  AssetReference,
  CreatePostRequest,
  ImageAsset,
  PostDetail,
  PostRevision,
  PostSummary,
  PreviewTokenResponse,
  SavePostDraftRequest,
  UpdateAssetRequest,
} from '@xdd-zone/contracts'
import type { MomoRuntime } from '#momo/bootstrap'
import type { ContentRepository } from '../repositories/content.repository'
import type { TaxonomyRepository } from '../repositories/taxonomy.repository'
import type { ContentAssetRecord, ContentAssetReferenceRecord, ContentPostRecord } from '../types/content.types'
import { createHash, randomUUID } from 'node:crypto'
import { BizCode } from '@xdd-zone/contracts'
import { validateMediaFile } from '#momo/infra/storage'
import { AppError } from '#momo/shared/app-error'

import { toImageAsset, toPostDetail, toPostRevision, toPostSummary, toPreviewTokenResponse } from '../content.presenter'
import { findUnknownMdxComponents, MDX_COMPONENTS } from '../mdx-components'
import { ContentAssetNotFoundError, ContentSlugConflictError } from '../repositories/content.repository'

const PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000
const ASSET_LIST_DEFAULT_PAGE_SIZE = 24
const ASSET_LIST_MAX_PAGE_SIZE = 100

export function createContentService(
  runtime: MomoRuntime,
  repository: ContentRepository,
  taxonomyRepository: TaxonomyRepository,
) {
  async function listPosts(): Promise<PostSummary[]> {
    const posts = await repository.listPosts()
    return enrichPostsWithTaxonomy(posts)
  }

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
      assets: assets.map((asset) => toImageAsset(asset)),
      page,
      pageSize,
      total,
    }
  }

  async function getPostById(id: string): Promise<PostDetail> {
    const post = await repository.getPostById(id)

    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const source = post.draftRevisionId
      ? (await getRequiredRevisionById(post.draftRevisionId, '文章草稿版本不存在')).source
      : ''

    const [category, tags] = await Promise.all([
      post.categoryId ? taxonomyRepository.getCategoryById(post.categoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
    ])

    return toPostDetail(post, source, category ?? null, tags)
  }

  async function createPost(input: CreatePostRequest, userId: string): Promise<PostDetail> {
    const duplicate = await repository.findPostBySlug(input.slug)
    if (duplicate) {
      throw new AppError(BizCode.CONTENT_SLUG_CONFLICT, 'slug 已存在', 409)
    }

    await ensureCoverAssetExists(input.coverAssetId)
    await ensureCategoryExists(input.categoryId)
    await ensureTagsExist(input.tagIds)
    assertKnownMdxComponents(input.source)

    const id = randomUUID()
    const revisionId = randomUUID()

    const post = await runContentRepositoryAction(() =>
      repository.createPost({
        categoryId: input.categoryId,
        coverAssetId: input.coverAssetId,
        excerpt: input.excerpt,
        id,
        revisionId,
        slug: input.slug,
        source: input.source,
        tagIds: input.tagIds,
        title: input.title,
        userId,
      }),
    )

    if (!post) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '保存文章失败', 500)
    }

    const tagIds = input.tagIds ?? []
    if (tagIds.length > 0) {
      await taxonomyRepository.setPostTags(id, tagIds)
    }

    const [category, tags] = await Promise.all([
      post.categoryId ? taxonomyRepository.getCategoryById(post.categoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
    ])

    return toPostDetail(post, input.source, category ?? null, tags)
  }

  async function saveDraft(id: string, input: SavePostDraftRequest, userId: string): Promise<PostDetail> {
    const current = await repository.getPostById(id)
    if (!current) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const nextSlug = input.slug ?? current.slug
    const duplicate = nextSlug === current.slug ? undefined : await repository.findPostBySlug(nextSlug, id)
    if (duplicate) {
      throw new AppError(BizCode.CONTENT_SLUG_CONFLICT, 'slug 已存在', 409)
    }

    const source = input.source ?? (await getDraftSource(current))
    await ensureCoverAssetExists(input.coverAssetId)
    await ensureCategoryExists(input.categoryId)
    await ensureTagsExist(input.tagIds)
    assertKnownMdxComponents(source)

    const revisionId = randomUUID()

    const post = await runContentRepositoryAction(() =>
      repository.saveDraft({
        categoryId: input.categoryId,
        coverAssetId: input.coverAssetId,
        excerpt: input.excerpt,
        id,
        revisionId,
        slug: input.slug,
        source,
        tagIds: input.tagIds,
        title: input.title,
        userId,
      }),
    )

    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (input.tagIds !== undefined) {
      await taxonomyRepository.setPostTags(id, input.tagIds)
    }

    const [category, tags] = await Promise.all([
      post.categoryId ? taxonomyRepository.getCategoryById(post.categoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
    ])

    return toPostDetail(post, source, category ?? null, tags)
  }

  async function publishPost(id: string, userId: string): Promise<PostDetail> {
    const result = await repository.publishPost({
      postId: id,
      userId,
    })

    if (result.status === 'not_found') {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (result.status === 'no_draft') {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '没有可发布的草稿', 409)
    }

    if (result.status === 'missing_draft_revision') {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文章草稿版本不存在', 500)
    }

    const [category, tags] = await Promise.all([
      result.post.categoryId ? taxonomyRepository.getCategoryById(result.post.categoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(id),
    ])

    return toPostDetail(result.post, result.revision.source, category ?? null, tags)
  }

  async function createPreviewToken(id: string, userId: string): Promise<PreviewTokenResponse> {
    const post = await repository.getPostById(id)
    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (!post.draftRevisionId) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '没有可预览的草稿', 409)
    }

    const revision = await getRequiredRevisionById(post.draftRevisionId, '文章草稿版本不存在')

    const token = randomUUID().replaceAll('-', '')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS)

    await repository.createPreviewToken({
      createdBy: userId,
      expiresAt,
      id: randomUUID(),
      postId: id,
      revisionId: revision.id,
      tokenHash,
    })

    return toPreviewTokenResponse({
      expiresAt,
      postId: id,
      revisionId: revision.id,
      token,
    })
  }

  async function getPreviewPost(token: string): Promise<{ post: PostDetail; revision: PostRevision }> {
    const previewToken = await repository.getPreviewToken(hashToken(token))
    if (!previewToken) {
      throw new AppError(BizCode.CONTENT_PREVIEW_TOKEN_EXPIRED, '预览 token 已失效', 401)
    }

    if (previewToken.expiresAt.getTime() < Date.now()) {
      throw new AppError(BizCode.CONTENT_PREVIEW_TOKEN_EXPIRED, '预览 token 已失效', 401)
    }

    const post = await repository.getPostById(previewToken.postId)
    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const revision = await getRequiredRevisionById(previewToken.revisionId, '文章预览版本不存在')

    await repository.markPreviewTokenUsed(previewToken.id)

    const [category, tags] = await Promise.all([
      post.categoryId ? taxonomyRepository.getCategoryById(post.categoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(previewToken.postId),
    ])

    return {
      post: toPostDetail(post, revision.source, category ?? null, tags),
      revision: toPostRevision(revision),
    }
  }

  async function getAssetById(id: string): Promise<AssetDetailResponse> {
    const asset = await repository.getAssetById(id)

    if (!asset) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '素材不存在', 404)
    }

    const references = await repository.findAssetReferences(id)
    return {
      asset: toImageAsset(asset),
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

  function getMdxComponents() {
    return { components: MDX_COMPONENTS }
  }

  async function uploadImage(file: File, userId: string): Promise<ImageAsset> {
    validateMediaFile(file)

    const saved = await runtime.storage.save(file)
    let asset: ContentAssetRecord

    try {
      asset = await repository.createAsset({
        alt: null,
        createdBy: userId,
        fileName: saved.fileName,
        id: randomUUID(),
        mimeType: file.type,
        size: file.size,
        storagePath: saved.storagePath,
        url: saved.publicUrl ?? null,
      })
    } catch (error) {
      await runtime.storage.remove(saved.storagePath).catch(() => undefined)
      throw error
    }

    return toImageAsset(asset)
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

    return toImageAsset(updated)
  }

  async function deleteAsset(id: string): Promise<{ assetId: string }> {
    const references = await repository.findAssetReferences(id)

    if (references.length > 0) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '素材正在被文章使用，先移除引用再删除', 409, {
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

    const asset = await repository.getAssetById(coverAssetId)

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
    const categoryIdMap = await repository.getCategoriesByPostIds(postIds)
    const uniqueCategoryIds = [...new Set(categoryIdMap.values())]

    const [categories, tagsMap] = await Promise.all([
      Promise.all(uniqueCategoryIds.map((id) => taxonomyRepository.getCategoryById(id))),
      taxonomyRepository.getPostTagsByPostIds(postIds),
    ])

    const categoryMap = new Map(categories.filter((c): c is NonNullable<typeof c> => !!c).map((c) => [c.id, c]))

    return posts.map((post) => {
      const categoryId = categoryIdMap.get(post.id)
      const category = categoryId ? (categoryMap.get(categoryId) ?? null) : null
      const tags = tagsMap.get(post.id) ?? []

      return toPostSummary(post, category, tags)
    })
  }

  return {
    createPost,
    createPreviewToken,
    deleteAsset,
    getAssetById,
    getMdxComponents,
    getPostById,
    getPreviewPost,
    listAssets,
    listPosts,
    openAssetFile,
    publishPost,
    saveDraft,
    updateAsset,
    uploadImage,
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

function toAssetReference(reference: ContentAssetReferenceRecord): AssetReference {
  return {
    postId: reference.postId,
    postSlug: reference.postSlug,
    postTitle: reference.postTitle,
    relation: reference.relation,
  }
}

export type ContentService = ReturnType<typeof createContentService>
