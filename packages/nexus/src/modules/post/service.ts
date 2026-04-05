import type { ContentStatus } from '@nexus/infra/database/prisma/generated'
import type { CreatePostBody, Post, PostList, PostListQuery, UpdatePostBody } from './model'
import type { PostBaseData, PostWhereInput } from './types'
import { BadRequestError, NotFoundError } from '@nexus/core/http'
import { buildKeywordSearch } from '@nexus/infra/database'
import { POST_SEARCH_FIELDS } from './constants'
import { PostListSchema, PostSchema } from './model'
import { PostRepository } from './repository'

function toDatabaseStatus(status: 'draft' | 'published'): ContentStatus {
  return status === 'published' ? 'PUBLISHED' : 'DRAFT'
}

function toHttpStatus(status: ContentStatus): 'draft' | 'published' {
  return status === 'PUBLISHED' ? 'published' : 'draft'
}

function normalizeNullableValue(value: string | null | undefined) {
  return value === undefined ? undefined : value
}

function serializePost(post: PostBaseData) {
  return {
    ...post,
    status: toHttpStatus(post.status),
  }
}

/**
 * 文章服务类。
 */
export class PostService {
  /**
   * 构建文章列表查询条件。
   */
  private static buildWhereConditions(query: PostListQuery): PostWhereInput {
    const where: PostWhereInput = {}

    if (query.status) {
      where.status = toDatabaseStatus(query.status)
    }

    if (query.category) {
      where.category = query.category
    }

    if (query.tag) {
      where.tags = {
        has: query.tag,
      }
    }

    const keywordSearch = buildKeywordSearch(query.keyword, [...POST_SEARCH_FIELDS]) as PostWhereInput['OR'] | undefined
    if (keywordSearch) {
      where.OR = keywordSearch
    }

    return where
  }

  /**
   * 断言文章存在。
   */
  private static async requireById(id: string) {
    const post = await PostRepository.findById(id)
    if (!post) {
      throw new NotFoundError('文章不存在')
    }

    return post
  }

  /**
   * 断言文章可发布。
   */
  private static assertCanPublish(post: { title: string; slug: string; markdown: string }) {
    if (!post.title.trim() || !post.slug.trim() || !post.markdown.trim()) {
      throw new BadRequestError('发布前必须填写标题、slug 和 Markdown 内容')
    }
  }

  /**
   * 获取文章列表。
   */
  static async list(query: PostListQuery): Promise<PostList> {
    const result = await PostRepository.paginate(this.buildWhereConditions(query), query)

    return PostListSchema.parse({
      ...result,
      items: result.items.map(serializePost),
    })
  }

  /**
   * 获取文章详情。
   */
  static async findById(id: string): Promise<Post> {
    return PostSchema.parse(serializePost(await this.requireById(id)))
  }

  /**
   * 创建文章。
   */
  static async create(data: CreatePostBody): Promise<Post> {
    return PostSchema.parse(
      serializePost(
        await PostRepository.create({
          title: data.title,
          slug: data.slug,
          markdown: data.markdown,
          excerpt: data.excerpt ?? null,
          coverImage: data.coverImage ?? null,
          category: data.category ?? null,
          tags: data.tags,
        }),
      ),
    )
  }

  /**
   * 更新文章。
   */
  static async update(id: string, data: UpdatePostBody): Promise<Post> {
    await this.requireById(id)

    return PostSchema.parse(
      serializePost(
        await PostRepository.update(id, {
          title: data.title,
          slug: data.slug,
          markdown: data.markdown,
          excerpt: normalizeNullableValue(data.excerpt),
          coverImage: normalizeNullableValue(data.coverImage),
          category: normalizeNullableValue(data.category),
          tags: data.tags,
        }),
      ),
    )
  }

  /**
   * 删除文章。
   */
  static async remove(id: string): Promise<void> {
    await this.requireById(id)
    await PostRepository.delete(id)
  }

  /**
   * 发布文章。
   */
  static async publish(id: string): Promise<Post> {
    const post = await this.requireById(id)
    this.assertCanPublish(post)

    if (post.status === 'PUBLISHED') {
      return PostSchema.parse(serializePost(post))
    }

    return PostSchema.parse(
      serializePost(
        await PostRepository.update(id, {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        }),
      ),
    )
  }

  /**
   * 取消发布文章。
   */
  static async unpublish(id: string): Promise<Post> {
    await this.requireById(id)

    return PostSchema.parse(
      serializePost(
        await PostRepository.update(id, {
          status: 'DRAFT',
          publishedAt: null,
        }),
      ),
    )
  }
}
