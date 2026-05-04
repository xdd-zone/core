import type { AccessPluginInstance } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { PostPermissions } from '../post/permissions'
import { PreviewMarkdownBodySchema, PreviewMarkdownResponseSchema } from './model'
import { PreviewService } from './service'

/**
 * 预览模块。
 */
export interface PreviewModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createPreviewModule({ accessPlugin }: PreviewModuleOptions) {
  return new Elysia({
    name: 'preview-module',
    prefix: '/preview',
    tags: ['Preview'],
  })
    .use(accessPlugin)
    .post('/markdown', async ({ body }) => PreviewService.renderMarkdown(body), {
      permission: PostPermissions.WRITE_ALL,
      body: PreviewMarkdownBodySchema,
      response: PreviewMarkdownResponseSchema,
      detail: apiDetail({
        summary: '生成 Markdown 预览',
        description: '用于后台编辑时预览 Markdown HTML、目录和摘要。',
        response: PreviewMarkdownResponseSchema,
        errors: [400, 401, 403],
      }),
    })
}

export * from './model'
export { PreviewService }
