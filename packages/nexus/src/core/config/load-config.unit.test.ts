import type { ResolvedConfig } from './types'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'

import { createConfig, validateCrossFieldRules } from './load-config'

const ENV_KEYS = [
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'CONFIG_PATH',
  'COS_BUCKET',
  'COS_PUBLIC_BASE_URL',
  'COS_REGION',
  'COS_SECRET_ID',
  'COS_SECRET_KEY',
  'COS_SIGNED_URL_EXPIRES',
  'DATABASE_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'NODE_ENV',
  'PORT',
  'STORAGE_PROVIDER',
] as const
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

function clearGithubEnv() {
  delete process.env.GITHUB_CLIENT_ID
  delete process.env.GITHUB_CLIENT_SECRET
}

function clearCosEnv() {
  delete process.env.STORAGE_PROVIDER
  delete process.env.COS_SECRET_ID
  delete process.env.COS_SECRET_KEY
  delete process.env.COS_BUCKET
  delete process.env.COS_REGION
  delete process.env.COS_PUBLIC_BASE_URL
  delete process.env.COS_SIGNED_URL_EXPIRES
}

function writeConfigFile(lines?: readonly string[]) {
  const dir = join(tmpdir(), `xdd-nexus-config-test-${crypto.randomUUID()}`)
  const filePath = join(dir, 'config.yaml')

  mkdirSync(dir, { recursive: true })
  writeFileSync(
    filePath,
    (lines ?? [
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
    ]).join('\n'),
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
  it('应按 env 覆盖 yaml，并规范化 origin 与 path', () => {
    process.env.NODE_ENV = 'test'
    process.env.CONFIG_PATH = writeConfigFile([
      'app:',
      '  apiPrefix: api/v2/',
      '  publicBaseUrl: http://yaml.example.com/from-yaml',
      'http:',
      '  cors:',
      '    origins:',
      '      - http://console.example.com/home',
      '      - http://console.example.com/settings',
      'openapi:',
      '  path: docs/',
      'auth:',
      '  trustedOrigins:',
      '    - http://console.example.com/home',
      '    - http://console.example.com/settings',
      '  methods:',
      '    github:',
      '      enabled: true',
      '      allowSignUp: true',
      'logger:',
      '  pretty: false',
      'storage:',
      '  provider: local',
      '  cos:',
      '    keyPrefix: /media/uploads/',
      'database:',
      '  log:',
      '    query: false',
      '    info: false',
      '    warn: true',
      '    error: true',
    ])
    process.env.PORT = '8899'
    process.env.BETTER_AUTH_SECRET = 'b'.repeat(32)
    process.env.BETTER_AUTH_URL = 'https://api.example.com/auth/callback'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/env_xdd'
    process.env.GITHUB_CLIENT_ID = 'github-client-id'
    process.env.GITHUB_CLIENT_SECRET = 'github-client-secret'
    process.env.STORAGE_PROVIDER = 'cos'
    process.env.COS_SECRET_ID = 'cos-secret-id'
    process.env.COS_SECRET_KEY = 'cos-secret-key'
    process.env.COS_BUCKET = 'cos-bucket'
    process.env.COS_REGION = 'ap-guangzhou'
    process.env.COS_PUBLIC_BASE_URL = 'https://cdn.example.com/media/'
    process.env.COS_SIGNED_URL_EXPIRES = '3600'

    const config = createConfig()

    expect(config.env).toMatchObject({
      nodeEnv: 'test',
      isDevelopment: false,
      isTest: true,
      isProduction: false,
    })
    expect(config.app.port).toBe(8899)
    expect(config.app.apiPrefix).toBe('/api/v2')
    expect(config.app.publicBaseUrl).toBe('https://api.example.com')
    expect(config.betterAuth.url).toBe('https://api.example.com')
    expect(config.betterAuth.providers.github).toEqual({
      clientId: 'github-client-id',
      clientSecret: 'github-client-secret',
    })
    expect(config.database.url).toBe('postgresql://user:pass@localhost:5432/env_xdd')
    expect(config.http.cors.origins).toEqual(['http://console.example.com'])
    expect(config.openapi.path).toBe('/docs')
    expect(config.auth.trustedOrigins).toEqual(['http://console.example.com'])
    expect(config.storage).toMatchObject({
      provider: 'cos',
      cos: {
        secretId: 'cos-secret-id',
        secretKey: 'cos-secret-key',
        bucket: 'cos-bucket',
        region: 'ap-guangzhou',
        publicBaseUrl: 'https://cdn.example.com',
        keyPrefix: 'media/uploads',
        signedUrlExpires: 3600,
      },
    })
  })

  it('CONFIG_PATH 指向不存在文件时应抛错', () => {
    process.env.CONFIG_PATH = join(tmpdir(), `missing-xdd-config-${crypto.randomUUID()}.yaml`)

    expect(() => createConfig()).toThrow('配置文件不存在')
  })

  it('yaml 内容不是对象时应抛错', () => {
    process.env.CONFIG_PATH = writeConfigFile(['- app', '- database'])

    expect(() => createConfig()).toThrow('配置文件内容无效')
  })

  it('yaml 里 storage.provider 非法时应被 schema 拦下', () => {
    process.env.CONFIG_PATH = writeConfigFile([
      'logger:',
      '  pretty: false',
      'auth:',
      '  methods:',
      '    github:',
      '      enabled: false',
      '      allowSignUp: false',
      'storage:',
      '  provider: minio',
      'database:',
      '  log:',
      '    query: false',
      '    info: false',
      '    warn: true',
      '    error: true',
    ])

    expect(() =>
      createConfig({
        betterAuth: {
          secret: 'a'.repeat(32),
          url: 'http://localhost:7788',
          providers: {},
        },
        database: {
          url: 'postgresql://user:pass@localhost:5432/xdd',
        },
      }),
    ).toThrow()
  })

  it('应读取 openapi.enabled/path 与 requestLogger.enabled 配置', () => {
    process.env.CONFIG_PATH = writeConfigFile([
      'logger:',
      '  pretty: false',
      'auth:',
      '  methods:',
      '    github:',
      '      enabled: false',
      '      allowSignUp: false',
      'http:',
      '  requestLogger:',
      '    enabled: false',
      'openapi:',
      '  enabled: false',
      '  path: internal-docs/',
      'storage:',
      '  provider: local',
      'database:',
      '  log:',
      '    query: false',
      '    info: false',
      '    warn: true',
      '    error: true',
    ])

    const config = createConfig({
      betterAuth: {
        secret: 'a'.repeat(32),
        url: 'http://localhost:7788',
        providers: {},
      },
      database: {
        url: 'postgresql://user:pass@localhost:5432/xdd',
      },
    })

    expect(config.openapi.enabled).toBe(false)
    expect(config.openapi.path).toBe('/internal-docs')
    expect(config.http.requestLogger.enabled).toBe(false)
  })

  it('生产环境启用 pretty 日志时应直接抛错', () => {
    process.env.NODE_ENV = 'production'
    process.env.CONFIG_PATH = writeConfigFile([
      'logger:',
      '  pretty: true',
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
    ])

    expect(() =>
      createConfig({
        betterAuth: {
          secret: 'a'.repeat(32),
          url: 'https://api.example.com',
          providers: {},
        },
        database: {
          url: 'postgresql://user:pass@localhost:5432/xdd',
        },
      }),
    ).toThrow('生产环境不允许启用 pretty 日志输出')
  })

  it('启用 GitHub 登录但缺少 provider 配置时应抛错', () => {
    clearGithubEnv()
    process.env.CONFIG_PATH = writeConfigFile([
      'logger:',
      '  pretty: false',
      'auth:',
      '  methods:',
      '    github:',
      '      enabled: true',
      '      allowSignUp: true',
      'storage:',
      '  provider: local',
      'database:',
      '  log:',
      '    query: false',
      '    info: false',
      '    warn: true',
      '    error: true',
    ])

    expect(() =>
      createConfig({
        betterAuth: {
          secret: 'a'.repeat(32),
          url: 'http://localhost:7788',
          providers: {},
        },
        database: {
          url: 'postgresql://user:pass@localhost:5432/xdd',
        },
      }),
    ).toThrow('当前已启用 GitHub 登录，但缺少 GITHUB_CLIENT_ID 或 GITHUB_CLIENT_SECRET')
  })

  it('启用 COS 但缺少必要配置时应抛错', () => {
    clearCosEnv()
    process.env.CONFIG_PATH = writeConfigFile([
      'logger:',
      '  pretty: false',
      'auth:',
      '  methods:',
      '    github:',
      '      enabled: false',
      '      allowSignUp: false',
      'storage:',
      '  provider: cos',
      'database:',
      '  log:',
      '    query: false',
      '    info: false',
      '    warn: true',
      '    error: true',
    ])

    expect(() =>
      createConfig({
        betterAuth: {
          secret: 'a'.repeat(32),
          url: 'http://localhost:7788',
          providers: {},
        },
        database: {
          url: 'postgresql://user:pass@localhost:5432/xdd',
        },
      }),
    ).toThrow('当前已启用 COS 存储，但缺少 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET 或 COS_REGION')
  })

  it('provider 为 local 时不要求 COS 配置', () => {
    clearCosEnv()
    process.env.CONFIG_PATH = writeConfigFile([
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
    ])

    const config = createConfig({
      betterAuth: {
        secret: 'a'.repeat(32),
        url: 'http://localhost:7788',
        providers: {},
      },
      database: {
        url: 'postgresql://user:pass@localhost:5432/xdd',
      },
    })

    expect(config.storage.provider).toBe('local')
    expect(config.storage.cos).toMatchObject({
      keyPrefix: 'media',
      signedUrlExpires: 600,
    })
  })

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
