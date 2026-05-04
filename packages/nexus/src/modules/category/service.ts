import type { Category, CategoryList, CategoryListQuery, CreateCategoryBody, UpdateCategoryBody } from './model'
import type { CategoryWhereInput } from './types'
import { NotFoundError } from '@nexus/core/http'
import { buildKeywordSearch } from '@nexus/infra/database'
import { createSlug, isSlug } from '@nexus/shared/schema'
import { CATEGORY_SEARCH_FIELDS } from './constants'
import { serializeCategory, withPublishedPostCount } from './mapper'
import { CategoryRepository } from './repository'

function normalizeNullableValue(value: string | null | undefined) {
  return value === undefined ? undefined : value
}

function normalizeSlug(slug: string | undefined, name: string) {
  return slug && isSlug(slug) ? slug : createSlug(slug || name, 'category')
}

export class CategoryService {
  private static buildWhereConditions(query: CategoryListQuery): CategoryWhereInput {
    const where: CategoryWhereInput = {}

    if ('isVisible' in query && query.isVisible !== undefined) {
      where.isVisible = query.isVisible
    }

    const keywordSearch = buildKeywordSearch(query.keyword, [...CATEGORY_SEARCH_FIELDS]) as
      | CategoryWhereInput['OR']
      | undefined
    if (keywordSearch) {
      where.OR = keywordSearch
    }

    return where
  }

  private static async requireById(id: string) {
    const category = await CategoryRepository.findById(id)
    if (!category) {
      throw new NotFoundError('分类不存在')
    }

    return category
  }

  static async list(query: CategoryListQuery): Promise<CategoryList> {
    const result = await CategoryRepository.paginate(this.buildWhereConditions(query), query)
    const items = await withPublishedPostCount(result.items)

    return {
      ...result,
      items: items.map(serializeCategory),
    }
  }

  static async findById(id: string): Promise<Category> {
    const [category] = await withPublishedPostCount([await this.requireById(id)])

    return serializeCategory(category)
  }

  static async create(data: CreateCategoryBody): Promise<Category> {
    const [category] = await withPublishedPostCount([
      await CategoryRepository.create({
        name: data.name,
        slug: normalizeSlug(data.slug, data.name),
        description: data.description ?? null,
        sortOrder: data.sortOrder ?? 0,
        isVisible: data.isVisible ?? true,
      }),
    ])

    return serializeCategory(category)
  }

  static async update(id: string, data: UpdateCategoryBody): Promise<Category> {
    const currentCategory = await this.requireById(id)
    const [category] = await withPublishedPostCount([
      await CategoryRepository.update(id, {
        name: data.name,
        slug: data.slug === undefined ? undefined : normalizeSlug(data.slug, data.name ?? currentCategory.name),
        description: normalizeNullableValue(data.description),
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
      }),
    ])

    return serializeCategory(category)
  }

  static async remove(id: string): Promise<void> {
    await this.requireById(id)
    await CategoryRepository.delete(id)
  }
}
