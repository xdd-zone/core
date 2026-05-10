import type { PermissionDefinition } from './permissions.types'
import { describe, expect, it } from 'bun:test'
import { PermissionRegistry } from './registry'

const definitions = [
  {
    key: 'post:read:all',
    displayName: '查看文章',
    description: '允许查看全部文章',
  },
  {
    key: 'post:update:all',
    displayName: '更新文章',
    description: '允许更新全部文章',
  },
] as const satisfies readonly PermissionDefinition[]

describe('PermissionRegistry', () => {
  it('可以注册并按注册顺序读取权限定义和 key', () => {
    const registry = new PermissionRegistry()

    registry.register(definitions)

    expect(registry.getAllDefinitions()).toEqual([...definitions])
    expect(registry.getAllKeys()).toEqual(['post:read:all', 'post:update:all'])
    expect(registry.getDefinition('post:read:all')).toEqual(definitions[0])
  })

  it('重复注册同一 key 时更新定义但保留首次排序', () => {
    const registry = new PermissionRegistry()

    registry.register(definitions)
    registry.register([
      {
        key: 'post:read:all',
        displayName: '查看文章列表',
        description: '允许查看后台文章列表',
      },
    ])

    expect(registry.getAllDefinitions()).toEqual([
      {
        key: 'post:read:all',
        displayName: '查看文章列表',
        description: '允许查看后台文章列表',
      },
      definitions[1],
    ])
    expect(registry.getAllKeys()).toEqual(['post:read:all', 'post:update:all'])
  })

  it('未知 key 使用字母顺序比较', () => {
    const registry = new PermissionRegistry()

    expect(registry.compare('post:update:all', 'post:read:all')).toBeGreaterThan(0)
  })
})
