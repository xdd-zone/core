import { momoBaseUrl } from '@fifa/api/client'

export function resolveMomoHttpUrl(path: string): URL {
  const baseUrl = new URL(momoBaseUrl)

  if (typeof window !== 'undefined' && baseUrl.origin === window.location.origin && baseUrl.pathname === '/') {
    return new URL(path, window.location.origin)
  }

  const normalizedBaseUrl = new URL(baseUrl)
  normalizedBaseUrl.pathname = `${normalizedBaseUrl.pathname.replace(/\/$/, '')}/`

  return new URL(path.replace(/^\//, ''), normalizedBaseUrl)
}
