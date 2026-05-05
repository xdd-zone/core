import type { ResolvedConfig } from './types'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'

import { createConfig, validateCrossFieldRules } from './load-config'

const ENV_KEYS = ['CONFIG_PATH', 'NODE_ENV'] as const
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]])) as Record<
  (typeof ENV_KEYS)[number],
  string | undefined
>
const testConfigDirs = new Set<string>()

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key]

    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }
}

function writeConfigFile() {
  const dir = join(tmpdir(), `xdd-nexus-config-test-${crypto.randomUUID()}`)
  const filePath = join(dir, 'config.yaml')

  mkdirSync(dir, { recursive: true })
  writeFileSync(
    filePath,
    [
      'logger:',
      '  pretty: false',
      'auth:',
      '  methods:',
      '    github:',
      '      enabled: false',
      '      allowSignUp: false',
      'storage:',
      '  provider: local',
      'database:',
      '  log:',
      '    query: false',
      '    info: false',
      '    warn: true',
      '    error: true',
    ].join('\n'),
  )
  testConfigDirs.add(dir)

  return filePath
}

function createResolvedConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    ...createConfig({
      betterAuth: {
        secret: 'a'.repeat(32),
        url: 'http://localhost:7788',
        providers: {},
      },
      database: {
        url: 'postgresql://user:pass@localhost:5432/xdd',
      },
      storage: {
        provider: 'local',
      },
    }),
    ...overrides,
  }
}

afterEach(() => {
  restoreEnv()
  spyOn(console, 'warn').mockRestore()

  for (const dir of testConfigDirs) {
    rmSync(dir, { force: true, recursive: true })
  }

  testConfigDirs.clear()
})

describe('createConfig', () => {
  it('生产环境下 BETTER_AUTH_SECRET 少于 32 个字符时应直接抛错', () => {
    process.env.NODE_ENV = 'production'
    process.env.CONFIG_PATH = writeConfigFile()

    expect(() =>
      createConfig({
        betterAuth: {
          secret: 'short-secret',
          url: 'https://api.example.com',
          providers: {},
        },
        database: {
          url: 'postgresql://user:pass@localhost:5432/xdd',
        },
        storage: {
          provider: 'local',
        },
      }),
    ).toThrow('BETTER_AUTH_SECRET 长度至少需要 32 个字符')
  })
})

describe('validateCrossFieldRules', () => {
  it('开发环境下 BETTER_AUTH_SECRET 少于 32 个字符时只打印警告', () => {
    process.env.CONFIG_PATH = writeConfigFile()

    const warnSpy = spyOn(console, 'warn').mockImplementation(() => undefined)
    const config = createResolvedConfig({
      env: {
        nodeEnv: 'development',
        isDevelopment: true,
        isTest: false,
        isProduction: false,
      },
      betterAuth: {
        secret: 'short-secret',
        url: 'http://localhost:7788',
        providers: {},
      },
    })

    expect(() => validateCrossFieldRules(config)).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('BETTER_AUTH_SECRET 长度至少需要 32 个字符'))

    warnSpy.mockRestore()
  })

  it('生产环境下 BETTER_AUTH_SECRET 少于 32 个字符时直接抛错', () => {
    process.env.CONFIG_PATH = writeConfigFile()

    const config = createResolvedConfig({
      env: {
        nodeEnv: 'production',
        isDevelopment: false,
        isTest: false,
        isProduction: true,
      },
      betterAuth: {
        secret: 'short-secret',
        url: 'https://api.example.com',
        providers: {},
      },
      logger: {
        level: 'info',
        pretty: false,
        serviceName: 'xdd-server-elysia',
      },
    })

    expect(() => validateCrossFieldRules(config)).toThrow('BETTER_AUTH_SECRET 长度至少需要 32 个字符')
  })
})
