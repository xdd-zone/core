import type { RuntimeEnv, YamlConfig } from './utils'
import { z } from 'zod'
import { parseEnv } from './utils'

export interface AppConfig {
  env: 'development' | 'test' | 'production'
  port: number
  prefix: string
  enableCors: boolean
}

export function createAppConfig(env: RuntimeEnv, yaml: YamlConfig): AppConfig {
  const portSchema = z.coerce.number().int().positive()
  const prefixSchema = z.string()

  const port = parseEnv(portSchema, process.env.PORT, yaml.port ?? 7788)
  const prefix = parseEnv(prefixSchema, yaml.prefix, 'api')

  return {
    env: env.nodeEnv,
    port,
    prefix,
    enableCors: env.isDevelopment,
  }
}
