import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import {
  PublicSiteCategoryListQuerySchema,
  PublicSiteCategoryListSchema,
  PublicSiteCategorySlugParamsSchema,
  PublicSiteConfigSchema,
  PublicSitePostListQuerySchema,
  PublicSitePostListSchema,
  PublicSitePostSchema,
  PublicSitePostSlugParamsSchema,
} from './model'
import { PublicSiteRepository } from './repository'
import { PublicSiteService } from './service'

export function createPublicSiteModule() {
  return new Elysia({
    name: 'public-site-module',
    prefix: '/public-site',
    tags: ['PublicSite'],
  })
    .get('/config', async () => await PublicSiteService.getConfig(), {
      response: PublicSiteConfigSchema,
      detail: apiDetail({
        summary: '获取个人站点配置',
        description: '匿名读取个人站点展示用的标题、描述、图标和社交链接。',
        response: PublicSiteConfigSchema,
      }),
    })
    .get('/categories', async ({ query }) => await PublicSiteService.listCategories(query), {
      query: PublicSiteCategoryListQuerySchema,
      response: PublicSiteCategoryListSchema,
      detail: apiDetail({
        summary: '获取个人站点分类列表',
        description: '匿名读取前台可见分类，文章数只统计已发布文章。',
        response: PublicSiteCategoryListSchema,
        errors: [400],
      }),
    })
    .get(
      '/categories/:slug/posts',
      async ({ params, query }) => await PublicSiteService.listPostsByCategorySlug(params.slug, query),
      {
        params: PublicSiteCategorySlugParamsSchema,
        query: PublicSitePostListQuerySchema,
        response: PublicSitePostListSchema,
        detail: apiDetail({
          summary: '获取指定分类下的个人站点文章列表',
          description: '按分类 slug 匿名读取已发布文章。分类隐藏或不存在时返回 404。',
          response: PublicSitePostListSchema,
          errors: [400, 404],
        }),
      },
    )
    .get('/posts', async ({ query }) => await PublicSiteService.listPosts(query), {
      query: PublicSitePostListQuerySchema,
      response: PublicSitePostListSchema,
      detail: apiDetail({
        summary: '获取个人站点文章列表',
        description: '匿名读取已发布文章，列表不返回 Markdown 正文。',
        response: PublicSitePostListSchema,
        errors: [400],
      }),
    })
    .get('/posts/:slug', async ({ params }) => await PublicSiteService.findPostBySlug(params.slug), {
      params: PublicSitePostSlugParamsSchema,
      response: PublicSitePostSchema,
      detail: apiDetail({
        summary: '获取个人站点文章详情',
        description: '按 slug 匿名读取已发布文章详情。',
        response: PublicSitePostSchema,
        errors: [400, 404],
      }),
    })
}

export * from './constants'
export * from './model'
export { PublicSiteRepository }
export { PublicSiteService }
export * from './types'
