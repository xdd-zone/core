import type { DeepPartial, NodeEnv, ResolvedConfig } from './types'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { load as yamlLoad } from 'js-yaml'
import { DEFAULT_CONFIG } from './defaults'
import { deepFreeze } from './freeze'
import { RawConfigSchema, ResolvedConfigSchema } from './schema'

const RECOMMENDED_SECRET_LENGTH = 32
const CONFIG_FILE_CANDIDATES = ['config.yaml', 'packages/nexus/config.yaml']

function normalizeNodeEnv(value: unknown): NodeEnv {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : 'development'

  if (normalized === 'production' || normalized === 'test') {
    return normalized
  }

  return 'development'
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge<T>(base: T, override?: DeepPartial<T>): T {
  if (override === undefined) {
    return base
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return (override ?? base) as T
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T
  }

  const merged: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue
    }

    const current = merged[key]
    merged[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value
  }

  return merged as T
}

function normalizePath(value: string): string {
  const trimmed = value.trim()
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  if (withLeadingSlash === '/') {
    return withLeadingSlash
  }

  return withLeadingSlash.replace(/\/+$/, '')
}

function normalizeOrigin(value: string): string {
  return new URL(value).origin
}

function normalizeOrigins(value: true | string[]): true | string[] {
  if (value === true) {
    return value
  }

  return Array.from(new Set(value.map((origin) => normalizeOrigin(origin))))
}

function resolveConfigPath(): string {
  const configuredPath = process.env.CONFIG_PATH
  if (configuredPath) {
    const absolutePath = path.isAbsolute(configuredPath) ? configuredPath : path.resolve(process.cwd(), configuredPath)

    if (!existsSync(absolutePath)) {
      throw new Error(`配置文件不存在: ${absolutePath}`)
    }

    return absolutePath
  }

  for (const candidate of CONFIG_FILE_CANDIDATES) {
    const absolutePath = path.resolve(process.cwd(), candidate)
    if (existsSync(absolutePath)) {
      return absolutePath
    }
  }

  throw new Error(`未找到配置文件，请设置 CONFIG_PATH，或在当前工作目录提供 ${CONFIG_FILE_CANDIDATES.join(' / ')}`)
}

function readYamlConfig(): DeepPartial<ResolvedConfig> {
  const filePath = resolveConfigPath()
  const text = readFileSync(filePath, 'utf8')
  const parsed = yamlLoad(text)

  if (!isPlainObject(parsed)) {
    throw new Error(`配置文件内容无效: ${filePath}`)
  }

  return RawConfigSchema.parse(parsed) as DeepPartial<ResolvedConfig>
}

function createEnvConfig(): DeepPartial<ResolvedConfig> {
  const betterAuthUrl = process.env.BETTER_AUTH_URL
  const githubClientId = process.env.GITHUB_CLIENT_ID
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

  return {
    app: {
      port: process.env.PORT ? Number(process.env.PORT) : undefined,
      publicBaseUrl: betterAuthUrl,
    },
    betterAuth: {
      secret: process.env.BETTER_AUTH_SECRET,
      url: betterAuthUrl,
      providers: {
        github:
          githubClientId && githubClientSecret
            ? {
                clientId: githubClientId,
                clientSecret: githubClientSecret,
              }
            : undefined,
      },
    },
    database: {
      url: process.env.DATABASE_URL,
    },
  }
}

function createBaseConfig(nodeEnv: NodeEnv): DeepPartial<ResolvedConfig> {
  return {
    env: {
      nodeEnv,
      isDevelopment: nodeEnv === 'development',
      isTest: nodeEnv === 'test',
      isProduction: nodeEnv === 'production',
    },
  }
}

function normalizeConfig(config: ResolvedConfig): ResolvedConfig {
  return {
    ...config,
    app: {
      ...config.app,
      apiPrefix: normalizePath(config.app.apiPrefix),
      publicBaseUrl: normalizeOrigin(config.app.publicBaseUrl),
    },
    http: {
      ...config.http,
      cors: {
        ...config.http.cors,
        origins: normalizeOrigins(config.http.cors.origins),
      },
    },
    openapi: {
      ...config.openapi,
      path: normalizePath(config.openapi.path),
    },
    auth: {
      ...config.auth,
      trustedOrigins: normalizeOrigins(config.auth.trustedOrigins) as string[],
    },
    betterAuth: {
      ...config.betterAuth,
      url: normalizeOrigin(config.betterAuth.url),
    },
    logger: {
      ...config.logger,
      filePath: config.logger.filePath?.trim() || undefined,
    },
  }
}

function validateCrossFieldRules(config: ResolvedConfig) {
  if (config.logger.pretty && config.env.isProduction) {
    throw new Error('生产环境不允许启用 pretty 日志输出，请在配置中关闭 logger.pretty')
  }

  if (config.auth.methods.github.enabled && !config.betterAuth.providers.github) {
    throw new Error('当前已启用 GitHub 登录，但缺少 GITHUB_CLIENT_ID 或 GITHUB_CLIENT_SECRET')
  }

  if (config.betterAuth.secret.length < RECOMMENDED_SECRET_LENGTH && config.env.isDevelopment) {
    console.warn(
      `[better-auth] BETTER_AUTH_SECRET 长度建议至少 ${RECOMMENDED_SECRET_LENGTH} 个字符，当前为 ${config.betterAuth.secret.length}。`,
    )
  }
}

export function createConfig(overrides?: DeepPartial<ResolvedConfig>): ResolvedConfig {
  const nodeEnv = normalizeNodeEnv(process.env.NODE_ENV)
  const merged = deepMerge(
    deepMerge(
      deepMerge(
        deepMerge(createBaseConfig(nodeEnv) as ResolvedConfig, DEFAULT_CONFIG as DeepPartial<ResolvedConfig>),
        readYamlConfig(),
      ),
      createEnvConfig(),
    ),
    overrides,
  )

  const parsed = ResolvedConfigSchema.parse(merged)
  const normalized = normalizeConfig(parsed)

  validateCrossFieldRules(normalized)

  return deepFreeze(normalized)
}
