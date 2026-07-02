import type { PreviewPostResponse, ProjectSummary } from '@xdd-zone/contracts'
import { PreviewPostResponseSchema, ProjectResponseSchema } from '@xdd-zone/contracts'
import { getPreview as requestPreview } from '@/lib/api/preview.api'

export const PREVIEW_TTL_LABEL = '30 分钟'

export type GenericPreview =
  | {
      post: PreviewPostResponse
      targetId: string
      targetType: 'post'
    }
  | {
      project: ProjectSummary
      targetId: string
      targetType: 'project'
    }

export type PreviewErrorReason = 'missing-token' | 'request-failed' | 'invalid-response' | 'target-mismatch'

export class PreviewError extends Error {
  readonly reason: PreviewErrorReason

  constructor(reason: PreviewErrorReason, message: string) {
    super(message)
    this.name = 'PreviewError'
    this.reason = reason
  }
}

export async function getGenericPreview(token: string | undefined): Promise<GenericPreview> {
  if (!token) {
    throw new PreviewError('missing-token', '预览链接缺少 token。')
  }

  const body = await requestPreview(token)
  if (!body.ok) {
    throw new PreviewError('request-failed', body.error.message || '预览链接已失效，或预览目标不存在。')
  }

  const data = body.data
  if (!data || typeof data !== 'object') {
    throw new PreviewError('invalid-response', 'Momo 返回的预览数据格式不正确。')
  }

  const targetType = 'targetType' in data ? data.targetType : undefined
  const targetId = 'targetId' in data ? data.targetId : undefined
  if (typeof targetId !== 'string') {
    throw new PreviewError('invalid-response', 'Momo 返回的预览目标格式不正确。')
  }

  if (targetType === 'post') {
    const parsed = PreviewPostResponseSchema.safeParse(data)
    if (!parsed.success) {
      throw new PreviewError('invalid-response', 'Momo 返回的文章预览数据格式不正确。')
    }

    return {
      post: parsed.data,
      targetId,
      targetType,
    }
  }

  if (targetType === 'project') {
    const parsed = ProjectResponseSchema.safeParse(data)
    if (!parsed.success) {
      throw new PreviewError('invalid-response', 'Momo 返回的项目预览数据格式不正确。')
    }

    return {
      project: parsed.data.project,
      targetId,
      targetType,
    }
  }

  throw new PreviewError('invalid-response', '暂不支持这个预览目标。')
}
