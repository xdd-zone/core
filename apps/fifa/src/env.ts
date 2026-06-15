import type { FifaEnv } from './env.schema'
import { parseFifaEnv } from './env.schema'

export type { FifaEnv } from './env.schema'

export function getFifaEnv(): FifaEnv {
  return parseFifaEnv({
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_DEV_BASE_PATH: import.meta.env.VITE_DEV_BASE_PATH,
    VITE_MOMO_BASE_URL: import.meta.env.VITE_MOMO_BASE_URL,
  })
}
