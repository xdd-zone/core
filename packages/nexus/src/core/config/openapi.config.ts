import type { RuntimeEnv, YamlConfig } from './utils'
import { z } from 'zod'
import { parseEnv } from './utils'

export interface OpenapiConfig {
  enabled: boolean
  path: string
  title: string
  description: string
  version: string
}

export function createOpenapiConfig(env: RuntimeEnv, yaml: YamlConfig): OpenapiConfig {
  const defaultEnabled = env.isDevelopment

  const enabled = parseEnv(z.coerce.boolean(), yaml.openapi?.enabled, defaultEnabled)
  const path = parseEnv(z.string(), yaml.openapi?.path, '/openapi')
  const title = parseEnv(z.string(), yaml.openapi?.title, 'XDD SPACE API')
  const description = parseEnv(z.string(), yaml.openapi?.description, 'XDD SPACE API documentation')
  const version = parseEnv(z.string(), yaml.openapi?.version, '1.0.0')

  return {
    enabled,
    path,
    title,
    description,
    version,
  }
}
