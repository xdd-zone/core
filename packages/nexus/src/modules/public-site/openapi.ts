import { apiDetail } from '@nexus/shared'

import {
  PublicSiteCategoryListSchema,
  PublicSiteConfigSchema,
  PublicSitePostListSchema,
  PublicSitePostSchema,
} from './model'

export const PublicSiteOpenApi = {
  getConfig: apiDetail({
    summary: '获取个人站点配置',
    description: '匿名读取个人站点展示用的标题、描述、图标和社交链接。',
    response: PublicSiteConfigSchema,
  }),
  listCategories: apiDetail({
    summary: '获取个人站点分类列表',
    description: '匿名读取前台可见分类，文章数只统计已发布文章。',
    response: PublicSiteCategoryListSchema,
    errors: [400],
  }),
  listPostsByCategorySlug: apiDetail({
    summary: '获取指定分类下的个人站点文章列表',
    description: '按分类 slug 匿名读取已发布文章。分类隐藏或不存在时返回 404。',
    response: PublicSitePostListSchema,
    errors: [400, 404],
  }),
  listPosts: apiDetail({
    summary: '获取个人站点文章列表',
    description: '匿名读取已发布文章，列表不返回 Markdown 正文。',
    response: PublicSitePostListSchema,
    errors: [400],
  }),
  findPostBySlug: apiDetail({
    summary: '获取个人站点文章详情',
    description: '按 slug 匿名读取已发布文章详情。',
    response: PublicSitePostSchema,
    errors: [400, 404],
  }),
}
