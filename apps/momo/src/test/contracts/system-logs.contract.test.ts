import { SystemLogListQuerySchema } from '@xdd-zone/contracts'
import { describe, expect, it } from 'vitest'

describe('system log contracts', () => {
  it('使用默认日志查询参数', () => {
    expect(SystemLogListQuerySchema.parse({})).toEqual({
      limit: 100,
      minLevel: 'warn',
      rangeMinutes: 60,
    })
  })

  it('拒绝超过最大返回数量的查询', () => {
    expect(() => SystemLogListQuerySchema.parse({ limit: 201 })).toThrow()
  })
})
