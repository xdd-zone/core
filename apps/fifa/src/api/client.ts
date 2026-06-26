import type { AppType } from '@xdd-zone/momo/rpc'
import { getFifaEnv } from '@fifa/env'
import { hc } from 'hono/client'

const fifaEnv = getFifaEnv()
const momoBaseUrl = fifaEnv.VITE_MOMO_BASE_URL

export const momoClient = hc<AppType>(momoBaseUrl, {
  fetch: (input: RequestInfo | URL, requestInit?: RequestInit | undefined) => {
    return fetch(input, {
      ...requestInit,
      credentials: 'include',
    })
  },
})

export { fifaEnv, momoBaseUrl }
