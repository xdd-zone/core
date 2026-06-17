import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PostRenderer } from './post-renderer'

describe('post renderer', () => {
  it('可以渲染 markdown 和受限 MDX 组件', () => {
    const html = renderToStaticMarkup(
      <PostRenderer
        source={`# 标题

正文里有 [链接](/lab) 和 \`代码\`。

<Callout tone="info">提示内容</Callout>

<Figure src="/cover.png" alt="封面" caption="图片说明" />

<LinkCard href="https://example.com" title="Example" description="外部链接" />

<ThemePreview theme="latte" />
`}
      />,
    )

    expect(html).toContain('标题')
    expect(html).toContain('提示内容')
    expect(html).toContain('图片说明')
    expect(html).toContain('Example')
    expect(html).toContain('主题预览')
  })

  it('不解析原始 HTML', () => {
    const html = renderToStaticMarkup(<PostRenderer source={'<section>正文</section>\n\n<script>alert(1)</script>'} />)

    expect(html).not.toContain('<section>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;section&gt;正文&lt;/section&gt;')
  })
})
