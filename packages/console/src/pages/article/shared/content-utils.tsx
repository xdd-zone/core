import type { SystemPermissionKey } from '@xdd-zone/nexus/permissions'

import type { TFunction } from 'i18next'
import { hasConsoleAccess } from '@console/app/access/access-control'
import { Permissions } from '@xdd-zone/nexus/permissions'
import { Badge, Tag } from 'antd'

import dayjs from 'dayjs'

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export function canUsePermission(permissionKeys: Iterable<string>, permission: SystemPermissionKey) {
  return hasConsoleAccess(permissionKeys, {
    all: [permission],
  })
}

export function renderPostStatus(status: string, t: TFunction) {
  const isPublished = status === 'published'
  return <Tag color={isPublished ? 'success' : 'default'}>{t(`content.post.status.${status}`)}</Tag>
}

export function renderCommentStatus(status: string, t: TFunction) {
  const statusMap: Record<string, 'default' | 'error' | 'processing' | 'success' | 'warning'> = {
    approved: 'success',
    deleted: 'default',
    hidden: 'error',
    pending: 'warning',
  }

  return <Badge status={statusMap[status] ?? 'default'} text={t(`content.comment.status.${status}`)} />
}

export const POST_STATUS_OPTIONS = [
  { label: 'common.all', value: '' },
  { label: 'content.post.status.draft', value: 'draft' },
  { label: 'content.post.status.published', value: 'published' },
] as const

export const COMMENT_STATUS_OPTIONS = [
  { label: 'common.all', value: '' },
  { label: 'content.comment.status.pending', value: 'pending' },
  { label: 'content.comment.status.approved', value: 'approved' },
  { label: 'content.comment.status.hidden', value: 'hidden' },
  { label: 'content.comment.status.deleted', value: 'deleted' },
] as const

export const COMMENT_REVIEW_OPTIONS = COMMENT_STATUS_OPTIONS.filter(
  (option) => option.value && option.value !== 'deleted',
)

export function buildPreviewSummaryItems(
  t: TFunction,
  values: {
    excerpt?: string | null
    headings?: number
    markdown: string
  },
) {
  return [
    { label: t('content.preview.summary.words'), value: String(values.markdown.trim().length) },
    { label: t('content.preview.summary.toc'), value: String(values.headings ?? 0) },
    { label: t('content.preview.summary.excerpt'), value: values.excerpt ? t('common.enabled') : t('common.disabled') },
  ]
}

export function splitTagInput(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinTags(tags: string[]) {
  return tags.join(', ')
}

export const POST_PUBLISH_PERMISSION = Permissions.POST.PUBLISH_ALL
