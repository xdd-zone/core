import type { CommentStatus, ContentStatus, Prisma, PrismaClient, UserStatus } from '@nexus-prisma/generated/client'

import { prisma as defaultPrisma } from '../infra/database'
import { createTestSuffix } from './db'

export interface FixtureOptions<TData> {
  suffix?: string
  data?: Partial<TData>
}

export async function createUserFixture(
  options: FixtureOptions<Prisma.UserCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const suffix = options.suffix ?? createTestSuffix('user')
  const data: Prisma.UserCreateInput = {
    email: `${suffix}@example.com`,
    emailVerified: true,
    name: `Test User ${suffix}`,
    status: 'ACTIVE' satisfies UserStatus,
    ...(options.data ?? {}),
  }

  return await prisma.user.create({ data })
}

export async function createCategoryFixture(
  options: FixtureOptions<Prisma.CategoryCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const suffix = options.suffix ?? createTestSuffix('category')
  const data: Prisma.CategoryCreateInput = {
    name: `Test Category ${suffix}`,
    slug: `test-category-${suffix}`,
    description: null,
    sortOrder: 0,
    isVisible: true,
    ...(options.data ?? {}),
  }

  return await prisma.category.create({ data })
}

export async function createPostFixture(
  options: FixtureOptions<Prisma.PostUncheckedCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const suffix = options.suffix ?? createTestSuffix('post')
  const data: Prisma.PostUncheckedCreateInput = {
    title: `Test Post ${suffix}`,
    slug: `test-post-${suffix}`,
    markdown: `# Test Post ${suffix}`,
    excerpt: null,
    coverImage: null,
    status: 'DRAFT' satisfies ContentStatus,
    tags: [],
    ...(options.data ?? {}),
  }

  return await prisma.post.create({ data })
}

export async function createCommentFixture(
  postId: string,
  options: FixtureOptions<Prisma.CommentUncheckedCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const suffix = options.suffix ?? createTestSuffix('comment')
  const data: Prisma.CommentUncheckedCreateInput = {
    postId,
    authorName: `Test Author ${suffix}`,
    authorEmail: `${suffix}@example.com`,
    content: `Test comment ${suffix}`,
    status: 'PENDING' satisfies CommentStatus,
    ...(options.data ?? {}),
  }

  return await prisma.comment.create({ data })
}

export async function createMediaFixture(
  options: FixtureOptions<Prisma.MediaCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const suffix = options.suffix ?? createTestSuffix('media')
  const data: Prisma.MediaCreateInput = {
    fileName: `${suffix}.png`,
    originalName: `${suffix}.png`,
    mimeType: 'image/png',
    size: 1,
    storagePath: `test/${suffix}.png`,
    url: `https://example.com/test/${suffix}.png`,
    uploadedBy: null,
    ...(options.data ?? {}),
  }

  return await prisma.media.create({ data })
}
