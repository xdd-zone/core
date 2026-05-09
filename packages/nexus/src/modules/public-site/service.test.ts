import type { PublicSiteArchivePostDateData, PublicSitePostSummaryData } from './types'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { PublicSiteRepository } from './repository'
import { PublicSiteService } from './service'

function createArchivePostDate(overrides: Partial<PublicSiteArchivePostDateData> = {}): PublicSiteArchivePostDateData {
  return {
    id: 'post-1',
    publishedAt: new Date('2026-05-10T00:00:00.000Z'),
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    ...overrides,
  }
}

function createPublicPostSummary(overrides: Partial<PublicSitePostSummaryData> = {}): PublicSitePostSummaryData {
  return {
    id: 'post-1',
    title: 'Post',
    slug: 'post',
    excerpt: null,
    coverImage: null,
    category: null,
    tags: [],
    publishedAt: new Date('2026-05-10T00:00:00.000Z'),
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-10T00:00:00.000Z'),
    ...overrides,
  }
}

describe('PublicSiteService archives', () => {
  afterEach(() => {
    spyOn(PublicSiteRepository, 'findArchivePostDates').mockRestore()
    spyOn(PublicSiteRepository, 'paginateArchivePosts').mockRestore()
  })

  it('归档应按 UTC 年月统计公开文章', async () => {
    const findArchivePostDatesSpy = spyOn(PublicSiteRepository, 'findArchivePostDates').mockResolvedValue([
      createArchivePostDate({
        id: 'post-1',
        publishedAt: new Date('2026-05-10T00:00:00.000Z'),
      }),
      createArchivePostDate({
        id: 'post-2',
        publishedAt: new Date('2026-05-31T23:59:59.000Z'),
      }),
      createArchivePostDate({
        id: 'post-3',
        publishedAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
      createArchivePostDate({
        id: 'post-4',
        publishedAt: new Date('2025-12-31T23:59:59.000Z'),
      }),
    ])

    const result = await PublicSiteService.listArchives()

    expect(findArchivePostDatesSpy).toHaveBeenCalledWith({
      status: 'PUBLISHED',
      OR: [
        {
          categoryId: null,
        },
        {
          category: {
            isVisible: true,
          },
        },
      ],
    })
    expect(result).toEqual({
      items: [
        {
          year: 2026,
          count: 3,
          months: [
            {
              year: 2026,
              month: 5,
              count: 2,
            },
            {
              year: 2026,
              month: 4,
              count: 1,
            },
          ],
        },
        {
          year: 2025,
          count: 1,
          months: [
            {
              year: 2025,
              month: 12,
              count: 1,
            },
          ],
        },
      ],
    })
  })

  it('归档应在 publishedAt 为空时按 createdAt 统计', async () => {
    spyOn(PublicSiteRepository, 'findArchivePostDates').mockResolvedValue([
      createArchivePostDate({
        publishedAt: null,
        createdAt: new Date('2026-03-15T00:00:00.000Z'),
      }),
    ])

    const result = await PublicSiteService.listArchives()

    expect(result.items[0]).toEqual({
      year: 2026,
      count: 1,
      months: [
        {
          year: 2026,
          month: 3,
          count: 1,
        },
      ],
    })
  })

  it('归档文章列表应按年份和月份生成时间范围查询', async () => {
    const paginateArchivePostsSpy = spyOn(PublicSiteRepository, 'paginateArchivePosts').mockResolvedValue({
      items: [createPublicPostSummary()],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })

    const result = await PublicSiteService.listArchivePosts({
      year: 2026,
      month: 5,
      page: 1,
      pageSize: 20,
    })

    expect(paginateArchivePostsSpy).toHaveBeenCalledWith(
      {
        status: 'PUBLISHED',
        OR: [
          {
            categoryId: null,
          },
          {
            category: {
              isVisible: true,
            },
          },
        ],
        AND: [
          {
            OR: [
              {
                publishedAt: {
                  gte: new Date('2026-05-01T00:00:00.000Z'),
                  lt: new Date('2026-06-01T00:00:00.000Z'),
                },
              },
              {
                publishedAt: null,
                createdAt: {
                  gte: new Date('2026-05-01T00:00:00.000Z'),
                  lt: new Date('2026-06-01T00:00:00.000Z'),
                },
              },
            ],
          },
        ],
      },
      {
        year: 2026,
        month: 5,
        page: 1,
        pageSize: 20,
      },
    )
    expect(result.items[0]?.publishedAt).toBe('2026-05-10T00:00:00.000Z')
  })

  it('归档文章列表未传月份时应查询整年', async () => {
    const paginateArchivePostsSpy = spyOn(PublicSiteRepository, 'paginateArchivePosts').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    })

    await PublicSiteService.listArchivePosts({
      year: 2026,
      page: 1,
      pageSize: 20,
    })

    expect(paginateArchivePostsSpy.mock.calls[0]?.[0]).toMatchObject({
      AND: [
        {
          OR: [
            {
              publishedAt: {
                gte: new Date('2026-01-01T00:00:00.000Z'),
                lt: new Date('2027-01-01T00:00:00.000Z'),
              },
            },
            {
              publishedAt: null,
              createdAt: {
                gte: new Date('2026-01-01T00:00:00.000Z'),
                lt: new Date('2027-01-01T00:00:00.000Z'),
              },
            },
          ],
        },
      ],
    })
  })
})
