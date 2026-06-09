import { z } from 'zod'

export const fifaEnvSchema = z.object({
  VITE_APP_ENV: z.enum(['development', 'test', 'production']),
  VITE_MOMO_BASE_URL: z.string().url(),
})

export type FifaEnv = z.infer<typeof fifaEnvSchema>

export function parseFifaEnv(source: Record<string, unknown>): FifaEnv {
  const result = fifaEnvSchema.safeParse({
    VITE_APP_ENV: source.VITE_APP_ENV,
    VITE_MOMO_BASE_URL: source.VITE_MOMO_BASE_URL,
  })

  if (result.success) {
    return result.data
  }

  throw new Error(`Fifa 环境变量配置错误:\n${formatFifaEnvIssues(source)}`)
}

function formatFifaEnvIssues(source: Record<string, unknown>): string {
  const lines: string[] = []

  if (source.VITE_APP_ENV === undefined || source.VITE_APP_ENV === '') {
    lines.push('- VITE_APP_ENV 没有配置')
  } else if (!['development', 'test', 'production'].includes(String(source.VITE_APP_ENV))) {
    lines.push('- VITE_APP_ENV 必须是 development、test 或 production')
  }

  if (source.VITE_MOMO_BASE_URL === undefined || source.VITE_MOMO_BASE_URL === '') {
    lines.push('- VITE_MOMO_BASE_URL 没有配置')
  } else if (!z.string().url().safeParse(source.VITE_MOMO_BASE_URL).success) {
    lines.push('- VITE_MOMO_BASE_URL 必须是完整 URL，例如 http://localhost:7788')
  }

  return lines.join('\n')
}
