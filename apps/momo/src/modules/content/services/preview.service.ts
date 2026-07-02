import type { PreviewTokenResponse } from '@xdd-zone/contracts'
import type { ContentRepository } from '../repositories/content.repository'
import type { TaxonomyRepository } from '../repositories/taxonomy.repository'
import { createHash, randomUUID } from 'node:crypto'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

import { toPostDetail, toPostRevision, toPreviewTokenResponse } from '../content.presenter'

const PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000

export function createPreviewService(repository: ContentRepository, taxonomyRepository: TaxonomyRepository) {
  async function createPostPreviewToken(id: string, userId: string): Promise<PreviewTokenResponse> {
    const post = await repository.getPostById(id)
    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    if (!post.draftRevisionId) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '没有可预览的草稿', 409)
    }

    const revision = await getRequiredRevisionById(post.draftRevisionId, '文章草稿版本不存在')
    const token = randomUUID().replaceAll('-', '')
    const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS)

    await repository.createPreviewToken({
      createdBy: userId,
      expiresAt,
      id: randomUUID(),
      postId: id,
      revisionId: revision.id,
      targetId: id,
      targetType: 'post',
      tokenHash: hashToken(token),
    })

    return toPreviewTokenResponse({
      expiresAt,
      postId: id,
      revisionId: revision.id,
      targetId: id,
      targetType: 'post',
      token,
    })
  }

  async function getPreviewPost(token: string) {
    const previewToken = await repository.getPreviewToken(hashToken(token))
    if (!previewToken || previewToken.expiresAt.getTime() < Date.now()) {
      throw new AppError(BizCode.CONTENT_PREVIEW_TOKEN_EXPIRED, '预览 token 已失效', 401)
    }

    if (previewToken.targetType !== 'post') {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '预览目标不存在', 404)
    }

    const postId = previewToken.targetId ?? previewToken.postId
    if (!postId || !previewToken.revisionId) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '预览目标不存在', 404)
    }

    const post = await repository.getPostById(postId)
    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const revision = await getRequiredRevisionById(previewToken.revisionId, '文章预览版本不存在')
    await repository.markPreviewTokenUsed(previewToken.id)

    const [category, tags] = await Promise.all([
      post.categoryId ? taxonomyRepository.getCategoryById(post.categoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(postId),
    ])

    return {
      post: toPostDetail(post, revision.source, category ?? null, tags),
      revision: toPostRevision(revision),
    }
  }

  async function getRequiredRevisionById(id: string, message: string) {
    const revision = await repository.getRevisionById(id)

    if (!revision) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, message, 500)
    }

    return revision
  }

  return {
    createPostPreviewToken,
    getPreviewPost,
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export type PreviewService = ReturnType<typeof createPreviewService>
