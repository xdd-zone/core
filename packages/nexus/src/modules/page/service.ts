import type { ContentStatus } from '@nexus/infra/database/prisma/generated'
import type { CreatePageBody, Page, PageList, PageListItem, PageListQuery, UpdatePageBody } from './model'
import type { PageBaseData, PageListItemBaseData, PageWhereInput } from './types'
import { BadRequestError, NotFoundError } from '@nexus/core/http'
import { buildKeywordSearch } from '@nexus/infra/database'
import { PAGE_SEARCH_FIELDS } from './constants'
import { PageListItemSchema, PageListSchema, PageSchema } from './model'
import { PageRepository } from './repository'

function toDatabaseStatus(status: 'draft' | 'published'): ContentStatus {
  return status === 'published' ? 'PUBLISHED' : 'DRAFT'
}

function toHttpStatus(status: ContentStatus): 'draft' | 'published' {
  return status === 'PUBLISHED' ? 'published' : 'draft'
}

function normalizeNullableValue(value: string | null | undefined) {
  return value === undefined ? undefined : value
}

function serializePageListItem(page: PageListItemBaseData) {
  return {
    ...page,
    status: toHttpStatus(page.status),
  }
}

function serializePage(page: PageBaseData) {
  return {
    ...serializePageListItem(page),
    markdown: page.markdown,
  }
}

/**
 * 页面服务类。
 */
export class PageService {
  /**
   * 构建页面列表查询条件。
   */
  private static buildWhereConditions(query: PageListQuery): PageWhereInput {
    const where: PageWhereInput = {}

    if (query.status) {
      where.status = toDatabaseStatus(query.status)
    }

    if (query.showInNavigation !== undefined) {
      where.showInNavigation = query.showInNavigation
    }

    const keywordSearch = buildKeywordSearch(query.keyword, [...PAGE_SEARCH_FIELDS]) as PageWhereInput['OR'] | undefined
    if (keywordSearch) {
      where.OR = keywordSearch
    }

    return where
  }

  /**
   * 断言页面存在。
   */
  private static async requireById(id: string) {
    const page = await PageRepository.findById(id)
    if (!page) {
      throw new NotFoundError('页面不存在')
    }

    return page
  }

  /**
   * 断言页面可发布。
   */
  private static assertCanPublish(page: { title: string; slug: string; markdown: string }) {
    if (!page.title.trim() || !page.slug.trim() || !page.markdown.trim()) {
      throw new BadRequestError('发布前必须填写标题、slug 和 Markdown 内容')
    }
  }

  /**
   * 断言页面可显示在导航中。
   */
  private static assertCanShowInNavigation(status: ContentStatus, showInNavigation: boolean) {
    if (showInNavigation && status !== 'PUBLISHED') {
      throw new BadRequestError('只有已发布页面才能显示在导航中')
    }
  }

  /**
   * 获取页面列表。
   */
  static async list(query: PageListQuery): Promise<PageList> {
    const result = await PageRepository.paginate(this.buildWhereConditions(query), query)

    return PageListSchema.parse({
      ...result,
      items: result.items.map((item): PageListItem => PageListItemSchema.parse(serializePageListItem(item))),
    })
  }

  /**
   * 获取页面详情。
   */
  static async findById(id: string): Promise<Page> {
    return PageSchema.parse(serializePage(await this.requireById(id)))
  }

  /**
   * 创建页面。
   */
  static async create(data: CreatePageBody): Promise<Page> {
    this.assertCanShowInNavigation('DRAFT', data.showInNavigation)

    return PageSchema.parse(
      serializePage(
        await PageRepository.create({
          title: data.title,
          slug: data.slug,
          markdown: data.markdown,
          excerpt: data.excerpt ?? null,
          coverImage: data.coverImage ?? null,
          showInNavigation: data.showInNavigation,
          sortOrder: data.sortOrder,
        }),
      ),
    )
  }

  /**
   * 更新页面。
   */
  static async update(id: string, data: UpdatePageBody): Promise<Page> {
    const currentPage = await this.requireById(id)
    const nextShowInNavigation = data.showInNavigation ?? currentPage.showInNavigation

    this.assertCanShowInNavigation(currentPage.status, nextShowInNavigation)

    return PageSchema.parse(
      serializePage(
        await PageRepository.update(id, {
          title: data.title,
          slug: data.slug,
          markdown: data.markdown,
          excerpt: normalizeNullableValue(data.excerpt),
          coverImage: normalizeNullableValue(data.coverImage),
          showInNavigation: data.showInNavigation,
          sortOrder: data.sortOrder,
        }),
      ),
    )
  }

  /**
   * 删除页面。
   */
  static async remove(id: string): Promise<void> {
    await this.requireById(id)
    await PageRepository.delete(id)
  }

  /**
   * 发布页面。
   */
  static async publish(id: string): Promise<Page> {
    const page = await this.requireById(id)
    this.assertCanPublish(page)

    if (page.status === 'PUBLISHED') {
      return PageSchema.parse(serializePage(page))
    }

    return PageSchema.parse(
      serializePage(
        await PageRepository.update(id, {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        }),
      ),
    )
  }

  /**
   * 取消发布页面。
   */
  static async unpublish(id: string): Promise<Page> {
    const page = await this.requireById(id)

    if (page.status === 'DRAFT' && !page.showInNavigation) {
      return PageSchema.parse(serializePage(page))
    }

    return PageSchema.parse(
      serializePage(
        await PageRepository.update(id, {
          status: 'DRAFT',
          showInNavigation: false,
          publishedAt: null,
        }),
      ),
    )
  }
}
