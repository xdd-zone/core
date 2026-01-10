/**
 * BetterAuth配置
 * - createBetterAuthConfig 通过运行环境、YAML 配置与环境变量生成最终 BetterAuthConfig
 */
import { z } from 'zod'

export interface BetterAuthConfig {
  secret: string
  url: string
}

/** 生成 BetterAuth 配置 */
export function createBetterAuthConfig(): BetterAuthConfig {
  const secretSchema = z.string().min(1)
  const urlSchema = z.string().url()

  return {
    secret: secretSchema.parse(process.env.BETTER_AUTH_SECRET),
    url: urlSchema.parse(process.env.BETTER_AUTH_URL),
  }
}
