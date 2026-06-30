import { describe, expect, it } from 'vitest'

import { parseContentSegments } from './parser'

describe('rich content parser', () => {
  it('paired 组件能读取正文文本', () => {
    const segments = parseContentSegments('<Callout tone="warning">提示内容</Callout>')

    expect(segments).toEqual([
      {
        component: 'Callout',
        kind: 'mdx',
        props: {
          tone: 'warning',
        },
        text: '提示内容',
      },
    ])
  })

  it('selfClosing 组件能读取字符串 props', () => {
    const segments = parseContentSegments('<Figure src="/cover.png" alt="封面" caption="图片说明" />')

    expect(segments).toEqual([
      {
        component: 'Figure',
        kind: 'mdx',
        props: {
          alt: '封面',
          caption: '图片说明',
          src: '/cover.png',
        },
        text: '',
      },
    ])
  })

  it('registry 里的 selfClosing 组件不用改 parser 正则也能识别', () => {
    const segments = parseContentSegments('<ThemePreview theme="latte" />')

    expect(segments).toEqual([
      {
        component: 'ThemePreview',
        kind: 'mdx',
        props: {
          theme: 'latte',
        },
        text: '',
      },
    ])
  })
})
