import type { ContentRepository } from '#momo/modules/content/repositories/content.repository'
import type { TaxonomyRepository } from '#momo/modules/content/repositories/taxonomy.repository'
import type { ProjectsRepository } from '#momo/modules/projects/projects.repository'
import { createHash } from 'node:crypto'
import { BizCode, ProjectSummarySchema } from '@xdd-zone/contracts'
import { toPostDetail, toPostRevision } from '#momo/modules/content/content.presenter'
import { AppError } from '#momo/shared/app-error'

type PreviewTokenRecord = NonNullable<Awaited<ReturnType<ContentRepository['getPreviewToken']>>>

export function createPreviewService(
  contentRepository: ContentRepository,
  taxonomyRepository: TaxonomyRepository,
  projectsRepository: ProjectsRepository,
) {
  async function getPreview(token: string) {
    const previewToken = await contentRepository.getPreviewToken(hashToken(token))
    if (!previewToken || previewToken.expiresAt.getTime() < Date.now()) {
      throw new AppError(BizCode.CONTENT_PREVIEW_TOKEN_EXPIRED, '预览 token 已失效', 401)
    }

    if (previewToken.targetType === 'post') {
      return getPostPreview(previewToken)
    }

    if (previewToken.targetType === 'project') {
      return getProjectPreview(previewToken)
    }

    throw new AppError(BizCode.COMMON_NOT_FOUND, '预览目标不存在', 404)
  }

  async function getPostPreview(previewToken: PreviewTokenRecord) {
    const postId = previewToken.targetId ?? previewToken.postId
    if (!postId || !previewToken.revisionId) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '预览目标不存在', 404)
    }

    const post = await contentRepository.getPostById(postId)
    if (!post) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '文章不存在', 404)
    }

    const revision = await contentRepository.getRevisionById(previewToken.revisionId)
    if (!revision) {
      throw new AppError(BizCode.SYSTEM_INTERNAL_ERROR, '文章预览版本不存在', 500)
    }

    await contentRepository.markPreviewTokenUsed(previewToken.id)

    const [category, tags] = await Promise.all([
      post.categoryId ? taxonomyRepository.getCategoryById(post.categoryId) : Promise.resolve(null),
      taxonomyRepository.getPostTags(postId),
    ])

    return {
      post: toPostDetail(post, revision.source, category ?? null, tags),
      revision: toPostRevision(revision),
      targetId: postId,
      targetType: 'post' as const,
    }
  }

  async function getProjectPreview(previewToken: PreviewTokenRecord) {
    if (!previewToken.targetId) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '预览目标不存在', 404)
    }

    const project = await projectsRepository.getProjectById(previewToken.targetId)
    if (!project) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '项目不存在', 404)
    }

    await contentRepository.markPreviewTokenUsed(previewToken.id)

    return {
      project: ProjectSummarySchema.parse({
        coverAssetId: project.draftCoverAssetId,
        description: project.draftDescription,
        id: project.id,
        links: project.draftLinks,
        order: project.order,
        publishedAt: project.publishedAt?.toISOString() ?? null,
        slug: project.draftSlug,
        status: project.status,
        title: project.draftTitle,
        updatedAt: project.updatedAt.toISOString(),
      }),
      targetId: previewToken.targetId,
      targetType: 'project' as const,
    }
  }

  return {
    getPreview,
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export type PreviewService = ReturnType<typeof createPreviewService>
