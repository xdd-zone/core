import type { PreviewPostResponse } from '@xdd-zone/contracts'
import { PreviewPostResponseSchema } from '@xdd-zone/contracts'
import { getPreviewPost as requestPreviewPost } from '@/lib/api/post.api'

export const PREVIEW_POST_TTL_LABEL = '30 分钟'

export type PreviewPostErrorReason = 'missing-token' | 'request-failed' | 'invalid-response' | 'post-mismatch'

export class PreviewPostError extends Error {
  readonly reason: PreviewPostErrorReason

  constructor(reason: PreviewPostErrorReason, message: string) {
    super(message)
    this.name = 'PreviewPostError'
    this.reason = reason
  }
}

export async function getPreviewPost(token: string | undefined, postId: string): Promise<PreviewPostResponse> {
  if (!token) {
    throw new PreviewPostError('missing-token', '预览链接缺少 token。')
  }

  const body = await requestPreviewPost(token)

  if (!body.ok) {
    throw new PreviewPostError('request-failed', body.error.message || '预览链接已失效，或文章不存在。')
  }

  const parsed = PreviewPostResponseSchema.safeParse(body.data)

  if (!parsed.success) {
    throw new PreviewPostError('invalid-response', 'Momo 返回的文章预览数据格式不正确。')
  }

  if (parsed.data.post.id !== postId) {
    throw new PreviewPostError('post-mismatch', '预览链接和文章地址不匹配。')
  }

  return parsed.data
}
