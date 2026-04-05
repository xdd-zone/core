import type { PreviewType } from './model'
import { ForbiddenError } from '@nexus/core/http'
import { accessPlugin, assertAuthenticated, Permissions, PermissionService } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { PreviewMarkdownBodySchema, PreviewMarkdownResponseSchema } from './model'
import { PreviewService } from './service'

async function ensurePreviewPermission(userId: string, type?: PreviewType) {
  if (type === 'post') {
    if (!(await PermissionService.hasPermission(userId, Permissions.POST.WRITE_ALL))) {
      throw new ForbiddenError('权限不足')
    }

    return
  }

  if (type === 'page') {
    if (!(await PermissionService.hasPermission(userId, Permissions.PAGE.WRITE_ALL))) {
      throw new ForbiddenError('权限不足')
    }

    return
  }

  const [hasPostWritePermission, hasPageWritePermission] = await Promise.all([
    PermissionService.hasPermission(userId, Permissions.POST.WRITE_ALL),
    PermissionService.hasPermission(userId, Permissions.PAGE.WRITE_ALL),
  ])

  if (!hasPostWritePermission && !hasPageWritePermission) {
    throw new ForbiddenError('权限不足')
  }
}

/**
 * 预览模块。
 */
export const previewModule = new Elysia({
  name: 'preview-module',
  prefix: '/preview',
  tags: ['Preview'],
})
  .use(accessPlugin)
  .post('/markdown', async ({ auth, body }) => {
    assertAuthenticated(auth)
    await ensurePreviewPermission(auth.user.id, body.type)

    return PreviewService.renderMarkdown(body)
  }, {
    auth: 'required',
    body: PreviewMarkdownBodySchema,
    response: PreviewMarkdownResponseSchema,
    detail: apiDetail({
      summary: '生成 Markdown 预览',
      description: '用于后台编辑时预览 Markdown HTML、目录和摘要。',
      response: PreviewMarkdownResponseSchema,
      errors: [400, 401, 403],
    }),
  })

export * from './model'
export { PreviewService }
