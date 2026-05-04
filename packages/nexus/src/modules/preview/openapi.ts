import { apiDetail } from '@nexus/shared'

import { PreviewMarkdownResponseSchema } from './model'

export const PreviewOpenApi = {
  renderMarkdown: apiDetail({
    summary: '生成 Markdown 预览',
    description: '用于后台编辑时预览 Markdown HTML、目录和摘要。',
    response: PreviewMarkdownResponseSchema,
    errors: [400, 401, 403],
  }),
}
