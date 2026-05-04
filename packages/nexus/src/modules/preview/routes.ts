import type { AccessPluginInstance } from '@nexus/core'

import { Elysia } from 'elysia'

import { PostPermissions } from '../post/permissions'
import { PreviewMarkdownBodySchema, PreviewMarkdownResponseSchema } from './model'
import { PreviewOpenApi } from './openapi'
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
      detail: PreviewOpenApi.renderMarkdown,
    })
}
