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
import { PublicSiteOpenApi } from './openapi'
import { PublicSiteService } from './service'

export type PublicSiteModuleOptions = Record<string, never>

export function createPublicSiteModule(_options: PublicSiteModuleOptions = {}) {
  return new Elysia({
    name: 'public-site-module',
    prefix: '/public-site',
    tags: ['PublicSite'],
  })
    .get('/config', async () => await PublicSiteService.getConfig(), {
      response: PublicSiteConfigSchema,
      detail: PublicSiteOpenApi.getConfig,
    })
    .get('/categories', async ({ query }) => await PublicSiteService.listCategories(query), {
      query: PublicSiteCategoryListQuerySchema,
      response: PublicSiteCategoryListSchema,
      detail: PublicSiteOpenApi.listCategories,
    })
    .get(
      '/categories/:slug/posts',
      async ({ params, query }) => await PublicSiteService.listPostsByCategorySlug(params.slug, query),
      {
        params: PublicSiteCategorySlugParamsSchema,
        query: PublicSitePostListQuerySchema,
        response: PublicSitePostListSchema,
        detail: PublicSiteOpenApi.listPostsByCategorySlug,
      },
    )
    .get('/posts', async ({ query }) => await PublicSiteService.listPosts(query), {
      query: PublicSitePostListQuerySchema,
      response: PublicSitePostListSchema,
      detail: PublicSiteOpenApi.listPosts,
    })
    .get('/posts/:slug', async ({ params }) => await PublicSiteService.findPostBySlug(params.slug), {
      params: PublicSitePostSlugParamsSchema,
      response: PublicSitePostSchema,
      detail: PublicSiteOpenApi.findPostBySlug,
    })
}
