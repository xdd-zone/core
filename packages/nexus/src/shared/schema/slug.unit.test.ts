import { describe, expect, it } from 'bun:test'
import { createSlug, isSlug } from './slug'

describe('createSlug', () => {
  it('应保留已经合法的 slug', () => {
    expect(createSlug('engineering-notes', 'category')).toBe('engineering-notes')
  })

  it('应把英文、数字和符号整理为合法 slug', () => {
    expect(createSlug(' Engineering Notes 2026! ', 'category')).toBe('engineering-notes-2026')
  })

  it('中文输入不应生成空字符串或单独短横线', () => {
    const slug = createSlug('测试', 'category')

    expect(slug).toBe('category-ll7-rmd')
    expect(isSlug(slug)).toBe(true)
  })

  it('纯符号输入应回退为 fallback slug', () => {
    const slug = createSlug('---', 'category')

    expect(slug).toBe('category-19-19-19')
    expect(isSlug(slug)).toBe(true)
  })

  it('空字符串应回退为 untitled', () => {
    expect(createSlug('', 'category')).toBe('category-untitled')
  })
})
