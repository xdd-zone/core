import type { Prisma } from '@nexus/infra/database/prisma/generated/client'

/**
 * 媒体响应字段选择器。
 */
export const MEDIA_BASE_SELECT = {
  id: true,
  fileName: true,
  originalName: true,
  mimeType: true,
  size: true,
  storagePath: true,
  url: true,
  uploadedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MediaSelect
