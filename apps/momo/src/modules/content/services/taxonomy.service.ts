import type {
  Category,
  CreateCategoryRequest,
  CreateTagRequest,
  Tag,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '@xdd-zone/contracts'
import type { TaxonomyRepository } from '../repositories/taxonomy.repository'
import type { CategoryWithCount, TagWithCount } from '../types/taxonomy.types'
import { randomUUID } from 'node:crypto'
import { BizCode } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

import { TaxonomySlugConflictError } from '../repositories/taxonomy.repository'

export function createTaxonomyService(repository: TaxonomyRepository) {
  async function listCategories(): Promise<Category[]> {
    const categories = await repository.listCategoriesWithCount()
    return categories.map((item) => toCategory(item))
  }

  async function getCategoryById(id: string): Promise<Category> {
    const category = await repository.getCategoryById(id)

    if (!category) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '分类不存在', 404)
    }

    const postCount = await repository.countPostsByCategory(id)

    return toCategory({ category, postCount })
  }

  async function createCategory(input: CreateCategoryRequest, userId: string): Promise<Category> {
    const duplicate = await repository.findCategoryBySlug(input.slug)

    if (duplicate) {
      throw new AppError(BizCode.CONTENT_TAXONOMY_SLUG_CONFLICT, '分类 slug 已存在', 409)
    }

    const category = await runTaxonomyRepositoryAction(() =>
      repository.createCategory({
        createdBy: userId,
        description: input.description,
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
      }),
    )

    return toCategory({ category, postCount: 0 })
  }

  async function updateCategory(id: string, input: UpdateCategoryRequest): Promise<Category> {
    const current = await repository.getCategoryById(id)

    if (!current) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '分类不存在', 404)
    }

    if (input.slug) {
      const duplicate = await repository.findCategoryBySlug(input.slug, id)

      if (duplicate) {
        throw new AppError(BizCode.CONTENT_TAXONOMY_SLUG_CONFLICT, '分类 slug 已存在', 409)
      }
    }

    const updated = await runTaxonomyRepositoryAction(() =>
      repository.updateCategory({
        description: input.description,
        id,
        name: input.name,
        slug: input.slug,
        updatedAt: new Date(),
      }),
    )

    if (!updated) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '分类不存在', 404)
    }

    const postCount = await repository.countPostsByCategory(id)

    return toCategory({ category: updated, postCount })
  }

  async function deleteCategory(id: string): Promise<{ categoryId: string }> {
    const postCount = await repository.countPostsByCategory(id)

    if (postCount > 0) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '分类正在被文章使用，先移除引用再删除', 409, { postCount })
    }

    const category = await repository.deleteCategory(id)

    if (!category) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '分类不存在', 404)
    }

    return { categoryId: id }
  }

  async function listTags(): Promise<Tag[]> {
    const tags = await repository.listTagsWithCount()
    return tags.map((item) => toTag(item))
  }

  async function getTagById(id: string): Promise<Tag> {
    const tag = await repository.getTagById(id)

    if (!tag) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '标签不存在', 404)
    }

    const postCount = await repository.countPostsByTag(id)

    return toTag({ postCount, tag })
  }

  async function createTag(input: CreateTagRequest, userId: string): Promise<Tag> {
    const duplicate = await repository.findTagBySlug(input.slug)

    if (duplicate) {
      throw new AppError(BizCode.CONTENT_TAXONOMY_SLUG_CONFLICT, '标签 slug 已存在', 409)
    }

    const tag = await runTaxonomyRepositoryAction(() =>
      repository.createTag({
        createdBy: userId,
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
      }),
    )

    return toTag({ postCount: 0, tag })
  }

  async function updateTag(id: string, input: UpdateTagRequest): Promise<Tag> {
    const current = await repository.getTagById(id)

    if (!current) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '标签不存在', 404)
    }

    if (input.slug) {
      const duplicate = await repository.findTagBySlug(input.slug, id)

      if (duplicate) {
        throw new AppError(BizCode.CONTENT_TAXONOMY_SLUG_CONFLICT, '标签 slug 已存在', 409)
      }
    }

    const updated = await runTaxonomyRepositoryAction(() =>
      repository.updateTag({
        id,
        name: input.name,
        slug: input.slug,
        updatedAt: new Date(),
      }),
    )

    if (!updated) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '标签不存在', 404)
    }

    const postCount = await repository.countPostsByTag(id)

    return toTag({ postCount, tag: updated })
  }

  async function deleteTag(id: string): Promise<{ tagId: string }> {
    const postCount = await repository.countPostsByTag(id)

    if (postCount > 0) {
      throw new AppError(BizCode.BIZ_RULE_VIOLATION, '标签正在被文章使用，先移除引用再删除', 409, { postCount })
    }

    const tag = await repository.deleteTag(id)

    if (!tag) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '标签不存在', 404)
    }

    return { tagId: id }
  }

  return {
    createCategory,
    createTag,
    deleteCategory,
    deleteTag,
    getCategoryById,
    getTagById,
    listCategories,
    listTags,
    updateCategory,
    updateTag,
  }
}

async function runTaxonomyRepositoryAction<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (error instanceof TaxonomySlugConflictError) {
      throw new AppError(
        BizCode.CONTENT_TAXONOMY_SLUG_CONFLICT,
        `${error.type === 'category' ? '分类' : '标签'} slug 已存在`,
        409,
      )
    }

    throw error
  }
}

function toCategory(item: CategoryWithCount): Category {
  return {
    createdAt: item.category.createdAt.toISOString(),
    description: item.category.description,
    id: item.category.id,
    name: item.category.name,
    postCount: item.postCount,
    slug: item.category.slug,
    updatedAt: item.category.updatedAt.toISOString(),
  }
}

function toTag(item: TagWithCount): Tag {
  return {
    createdAt: item.tag.createdAt.toISOString(),
    id: item.tag.id,
    name: item.tag.name,
    postCount: item.postCount,
    slug: item.tag.slug,
    updatedAt: item.tag.updatedAt.toISOString(),
  }
}

export type TaxonomyService = ReturnType<typeof createTaxonomyService>
