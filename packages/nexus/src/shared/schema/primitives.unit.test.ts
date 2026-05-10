import { describe, expect, it } from 'bun:test'
import { CommentStatusSchema, DateTimeSchema, IdSchema, PaginationQuerySchema } from './index'

describe('DateTimeSchema', () => {
  it('应把 Date 序列化为 ISO 字符串', () => {
    expect(DateTimeSchema.parse(new Date('2026-05-10T00:00:00.000Z'))).toBe('2026-05-10T00:00:00.000Z')
  })

  it('应接受带时区的日期时间字符串', () => {
    expect(DateTimeSchema.parse('2026-05-10T08:00:00.000+08:00')).toBe('2026-05-10T08:00:00.000+08:00')
  })

  it('应拒绝非法日期时间', () => {
    expect(() => DateTimeSchema.parse('2026-05-10')).toThrow()
  })
})

describe('PaginationQuerySchema', () => {
  it('应提供默认分页参数', () => {
    expect(PaginationQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    })
  })

  it('应把 query 字符串转为数字', () => {
    expect(
      PaginationQuerySchema.parse({
        page: '2',
        pageSize: '30',
      }),
    ).toEqual({
      page: 2,
      pageSize: 30,
    })
  })

  it('pageSize 应限制上限', () => {
    expect(() =>
      PaginationQuerySchema.parse({
        pageSize: '101',
      }),
    ).toThrow()
  })
})

describe('IdSchema', () => {
  it('应接受非空 ID', () => {
    expect(IdSchema.parse('id-1')).toBe('id-1')
  })

  it('应拒绝空 ID', () => {
    expect(() => IdSchema.parse('')).toThrow()
  })
})

describe('CommentStatusSchema', () => {
  it('应接受评论状态', () => {
    expect(CommentStatusSchema.parse('pending')).toBe('pending')
    expect(CommentStatusSchema.parse('approved')).toBe('approved')
    expect(CommentStatusSchema.parse('hidden')).toBe('hidden')
    expect(CommentStatusSchema.parse('deleted')).toBe('deleted')
  })

  it('应拒绝未知评论状态', () => {
    expect(() => CommentStatusSchema.parse('archived')).toThrow()
  })
})
