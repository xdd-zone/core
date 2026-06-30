import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { themePreviewDefinition } from './definition'

describe('theme preview mdx component', () => {
  it('props 缺失时使用默认主题', () => {
    const props = themePreviewDefinition.parseProps({})
    const html = renderToStaticMarkup(themePreviewDefinition.render({ props, text: '' }))

    expect(html).toContain('data-theme="latte"')
    expect(html).toContain('latte')
  })

  it('可以渲染源码里传入的主题名', () => {
    const props = themePreviewDefinition.parseProps({ theme: 'macchiato' })
    const html = renderToStaticMarkup(themePreviewDefinition.render({ props, text: '' }))

    expect(html).toContain('data-theme="macchiato"')
    expect(html).toContain('macchiato')
  })
})
