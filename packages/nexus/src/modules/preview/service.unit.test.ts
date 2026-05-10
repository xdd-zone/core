import { describe, expect, it } from 'bun:test'

import { PreviewService } from './service'

describe('PreviewService', () => {
  it('应给标题生成锚点并写入 HTML', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '# 标题 A\n\n正文',
    })

    expect(result.toc).toEqual([
      {
        level: 1,
        text: '标题 A',
        slug: '标题-a',
      },
    ])
    expect(result.html).toContain('<h1 id="标题-a">标题 A</h1>')
  })

  it('重复标题应生成递增 slug', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '## 安装\n\n### 安装\n\n## 安装',
    })

    expect(result.toc.map((item) => item.slug)).toEqual(['安装', '安装-2', '安装-3'])
  })

  it('摘要应优先使用传入值', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '正文第一段',
      excerpt: '手动摘要',
    })

    expect(result.excerpt).toBe('手动摘要')
  })

  it('未传摘要时应从第一段正文自动生成摘要', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '# 标题\n\n第一段正文\n换行继续\n\n第二段正文',
    })

    expect(result.excerpt).toBe('第一段正文 换行继续')
  })

  it('自动摘要应截断到 160 个字符', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '摘'.repeat(200),
    })

    expect(result.excerpt).toBe('摘'.repeat(160))
  })

  it('只有标题和空段落时自动摘要应返回 null', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '# 只有标题\n\n\n',
    })

    expect(result.excerpt).toBeNull()
  })

  it('空段落不应阻断后续正文生成摘要', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '\n\n\n第一段正文\n\n第二段正文',
    })

    expect(result.excerpt).toBe('第一段正文')
  })

  it('HTML 应被转义，不应作为原始标签输出', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '<section>危险内容</section>',
    })

    expect(result.html).toContain('&lt;section&gt;危险内容&lt;/section&gt;')
    expect(result.html).not.toContain('<section>危险内容</section>')
  })

  it('裸链接应自动 linkify', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '访问 https://example.com/docs 查看文档',
    })

    expect(result.html).toContain('<a href="https://example.com/docs">https://example.com/docs</a>')
  })

  it('段内换行应渲染为 break', () => {
    const result = PreviewService.renderMarkdown({
      markdown: '第一行\n第二行',
    })

    expect(result.html).toContain('第一行<br>')
    expect(result.html).toContain('第二行')
  })
})
