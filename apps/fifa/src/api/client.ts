import type { AppType } from '@xdd-zone/momo/rpc'
import { getFifaEnv } from '@fifa/env'
import { hc } from 'hono/client'

const fifaEnv = getFifaEnv()
const momoBaseUrl = fifaEnv.VITE_MOMO_BASE_URL

export const momoClient = hc<AppType>(momoBaseUrl)

export { fifaEnv, momoBaseUrl }
