import type { MomoRuntime } from '#momo/bootstrap'
import type {
  CreatePostRequest,
  ImageAsset,
  PostDetail,
  PostRevision,
  PostSummary,
  PreviewTokenResponse,
  SavePostDraftRequest,
} from '@xdd-zone/contracts'
import type { ContentRepository } from './content.repository'
import type { ContentAssetRecord, ContentPostRecord } from './content.types'
import { createHash, randomUUID } from 'node:crypto'
import { validateMediaFile } from '#momo/infra/storage'
import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'

import { toImageAsset, toPostDetail, toPostRevision, toPostSummary, toPreviewTokenResponse } from './content.presenter'
import { ContentAssetNotFoundError, ContentSlugConflictError } from './content.repository'
import { findUnknownMdxComponents, MDX_COMPONENTS } from './mdx-components'

const PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000

export function createContentService(runtime: MomoRuntime, repository: ContentRepository) {
  async function listPosts(): Promise<PostSummary[]> {
    const posts = await repository.listPosts()
    return posts.map((post) => toPostSummary(post))
  }

  async function listPublicPosts(): Promise<PostSummary[]> {
    const posts = await repository.listPublicPosts()
    return posts.map((post) => toPostSummary(post))
  }

  async function getPostById(id: string): Promise<PostDetail> {
    const post = await repository.getPostById(id)

    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const source = post.draftRevisionId
      ? (await getRequiredRevisionById(post.draftRevisionId, '文章草稿版本不存在')).source
      : ''

    return toPostDetail(post, source)
  }

  async function createPost(input: CreatePostRequest, userId: string): Promise<PostDetail> {
    const duplicate = await repository.findPostBySlug(input.slug)
    if (duplicate) {
      throw new AppError(BizCode.CONTENT_SLUG_CONFLICT, 'slug 已存在', 409)
    }

    await ensureCoverAssetExists(input.coverAssetId)
    assertKnownMdxComponents(input.format, input.source)

    const id = randomUUID()
    const revisionId = randomUUID()

    const post = await runContentRepositoryAction(() =>
      repository.createPost({
        coverAssetId: input.coverAssetId,
        excerpt: input.excerpt,
        format: input.format,
        id,
        revisionId,
        slug: input.slug,
        source: input.source,
        title: input.title,
        userId,
      }),
    )

    if (!post) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '保存文章失败', 500)
    }

    return toPostDetail(post, input.source)
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
    const format = input.format ?? current.format

    await ensureCoverAssetExists(input.coverAssetId)
    assertKnownMdxComponents(format, source)

    const revisionId = randomUUID()

    const post = await runContentRepositoryAction(() =>
      repository.saveDraft({
        coverAssetId: input.coverAssetId,
        excerpt: input.excerpt,
        format: input.format,
        id,
        revisionId,
        slug: input.slug,
        source,
        title: input.title,
        userId,
      }),
    )

    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    return toPostDetail(post, source)
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

    return toPostDetail(result.post, result.revision.source)
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

    return {
      post: toPostDetail(post, revision.source),
      revision: toPostRevision(revision),
    }
  }

  async function getPublicPostBySlug(slug: string): Promise<PostDetail> {
    const post = await repository.getPostBySlug(slug)
    if (!post || post.status !== 'published') {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (!post.publishedRevisionId) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文章发布版本不存在', 500)
    }

    const revision = await getRequiredRevisionById(post.publishedRevisionId, '文章发布版本不存在')

    return toPostDetail(post, revision.source)
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

  return {
    createPost,
    createPreviewToken,
    getMdxComponents,
    getPostById,
    getPreviewPost,
    getPublicPostBySlug,
    listPosts,
    listPublicPosts,
    publishPost,
    saveDraft,
    uploadImage,
  }
}

function assertKnownMdxComponents(format: CreatePostRequest['format'], source: string): void {
  if (format !== 'mdx') {
    return
  }

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

export type ContentService = ReturnType<typeof createContentService>
