import { describe, expect, it } from 'vitest'
import { normalizePostMetaSuggestion, normalizePostSlug } from '#momo/modules/content/services/content.service'

describe('content meta suggestion service', () => {
  it('会把模型返回的 slug 转成文章 slug 格式', () => {
    expect(normalizePostSlug('  Hello, TypeScript 世界!! 2026  ')).toBe('hello-typescript-2026')
  })

  it('会清洗模型返回值并返回 slug 是否可用', async () => {
    const suggestion = await normalizePostMetaSuggestion(
      {
        locale: 'zh-CN',
        mode: 'edit',
        targets: ['slug', 'excerpt', 'title'],
      },
      {
        excerpt: ` ${'摘要'.repeat(300)} `,
        slug: 'Hello, TypeScript 世界!! 2026',
        title: ` ${'标题'.repeat(100)} `,
      },
      async (slug) => (slug === 'hello-typescript-2026' ? { id: 'post-1' } : undefined),
    )

    expect(suggestion.slug).toBe('hello-typescript-2026')
    expect(suggestion.slugAvailable).toBe(false)
    expect(suggestion.excerpt).toHaveLength(500)
    expect(suggestion.title).toHaveLength(160)
  })
})
