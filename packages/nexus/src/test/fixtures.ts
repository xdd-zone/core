import type { CommentStatus, ContentStatus, Prisma, PrismaClient, UserStatus } from '@nexus-prisma/generated/client'
import type { IntegrationTrackHelper, IntegrationTrackedValue } from './integration'

import { prisma as defaultPrisma } from '../infra/database'
import { createTestSuffix } from './db'

export interface FixtureOptions<TData> {
  suffix?: string
  data?: Partial<TData>
  track?: FixtureTrackTarget
}

type FixtureTrackKind = 'user' | 'category' | 'post' | 'comment' | 'media'

type FixtureTrackTarget =
  | IntegrationTrackHelper
  | {
      track: IntegrationTrackHelper
    }

interface FixtureScopeOptions {
  prisma?: PrismaClient
  track?: FixtureTrackTarget
}

function resolveFixtureTrack(track?: FixtureTrackTarget) {
  if (!track) {
    return undefined
  }

  return 'track' in track ? track.track : track
}

function trackFixture(kind: FixtureTrackKind, value: IntegrationTrackedValue, target?: FixtureTrackTarget) {
  const track = resolveFixtureTrack(target)
  if (!track) {
    return
  }

  if (kind === 'user') {
    track.user(value)
    return
  }

  if (kind === 'category') {
    track.category(value)
    return
  }

  if (kind === 'post') {
    track.post(value)
    return
  }

  if (kind === 'comment') {
    track.comment(value)
    return
  }

  track.media(value)
}

function createFixtureScope(options: FixtureScopeOptions = {}) {
  return {
    prisma: options.prisma ?? defaultPrisma,
    track: options.track,
  }
}

function createFixtureData<TData>(
  options: FixtureOptions<TData>,
  prefix: string,
  createDefaults: (suffix: string) => TData,
) {
  const suffix = options.suffix ?? createTestSuffix(prefix)

  return {
    suffix,
    data: {
      ...createDefaults(suffix),
      ...(options.data ?? {}),
    } as TData,
  }
}

function createDefaultUserData(suffix: string): Prisma.UserCreateInput {
  return {
    email: `${suffix}@example.com`,
    emailVerified: true,
    name: `Test User ${suffix}`,
    status: 'ACTIVE' satisfies UserStatus,
  }
}

function createDefaultCategoryData(suffix: string): Prisma.CategoryCreateInput {
  return {
    name: `Test Category ${suffix}`,
    slug: `test-category-${suffix}`,
    description: null,
    sortOrder: 0,
    isVisible: true,
  }
}

function createDefaultPostData(suffix: string): Prisma.PostUncheckedCreateInput {
  return {
    title: `Test Post ${suffix}`,
    slug: `test-post-${suffix}`,
    markdown: `# Test Post ${suffix}`,
    excerpt: null,
    coverImage: null,
    status: 'DRAFT' satisfies ContentStatus,
    tags: [],
  }
}

function createDefaultCommentData(suffix: string, postId: string): Prisma.CommentUncheckedCreateInput {
  return {
    postId,
    authorName: `Test Author ${suffix}`,
    authorEmail: `${suffix}@example.com`,
    content: `Test comment ${suffix}`,
    status: 'PENDING' satisfies CommentStatus,
  }
}

function createDefaultMediaData(suffix: string): Prisma.MediaCreateInput {
  return {
    fileName: `${suffix}.png`,
    originalName: `${suffix}.png`,
    mimeType: 'image/png',
    size: 1,
    storagePath: `test/${suffix}.png`,
    url: `https://example.com/test/${suffix}.png`,
    uploadedBy: null,
  }
}

export async function createUserFixture(
  options: FixtureOptions<Prisma.UserCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const { data } = createFixtureData(options, 'user', createDefaultUserData)
  const user = await prisma.user.create({ data })
  trackFixture('user', user, options.track)
  return user
}

export async function createCategoryFixture(
  options: FixtureOptions<Prisma.CategoryCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const { data } = createFixtureData(options, 'category', createDefaultCategoryData)
  const category = await prisma.category.create({ data })
  trackFixture('category', category, options.track)
  return category
}

export async function createPostFixture(
  options: FixtureOptions<Prisma.PostUncheckedCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const { data } = createFixtureData(options, 'post', createDefaultPostData)
  const post = await prisma.post.create({ data })
  trackFixture('post', post, options.track)
  return post
}

export async function createCommentFixture(
  postId: string,
  options: FixtureOptions<Prisma.CommentUncheckedCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const { data } = createFixtureData(options, 'comment', (suffix) => createDefaultCommentData(suffix, postId))
  const comment = await prisma.comment.create({ data })
  trackFixture('comment', comment, options.track)
  return comment
}

export async function createMediaFixture(
  options: FixtureOptions<Prisma.MediaCreateInput> = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const { data } = createFixtureData(options, 'media', createDefaultMediaData)
  const media = await prisma.media.create({ data })
  trackFixture('media', media, options.track)
  return media
}

export function createTrackedFixtures(options: FixtureScopeOptions = {}) {
  const scope = createFixtureScope(options)

  return {
    createUserFixture(options: FixtureOptions<Prisma.UserCreateInput> = {}) {
      return createUserFixture({ ...options, track: options.track ?? scope.track }, scope.prisma)
    },
    createCategoryFixture(options: FixtureOptions<Prisma.CategoryCreateInput> = {}) {
      return createCategoryFixture({ ...options, track: options.track ?? scope.track }, scope.prisma)
    },
    createPostFixture(options: FixtureOptions<Prisma.PostUncheckedCreateInput> = {}) {
      return createPostFixture({ ...options, track: options.track ?? scope.track }, scope.prisma)
    },
    createCommentFixture(postId: string, options: FixtureOptions<Prisma.CommentUncheckedCreateInput> = {}) {
      return createCommentFixture(postId, { ...options, track: options.track ?? scope.track }, scope.prisma)
    },
    createMediaFixture(options: FixtureOptions<Prisma.MediaCreateInput> = {}) {
      return createMediaFixture({ ...options, track: options.track ?? scope.track }, scope.prisma)
    },
  }
}
