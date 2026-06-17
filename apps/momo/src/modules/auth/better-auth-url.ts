export const AUTH_BASE_PATH = '/api/auth'

export function resolveBetterAuthBaseUrl(publicBaseUrl: string): string {
  const url = new URL(publicBaseUrl)
  const path = url.pathname.replace(/\/$/, '')

  if (path === '' || path.endsWith(AUTH_BASE_PATH)) {
    return publicBaseUrl
  }

  url.pathname = `${path}${AUTH_BASE_PATH}`

  return url.toString()
}

export function rewriteBetterAuthRequestUrl(request: Request, publicBaseUrl: string): Request {
  const baseUrl = new URL(publicBaseUrl)
  const basePath = baseUrl.pathname.replace(/\/$/, '')

  if (basePath === '') {
    return request
  }

  const requestUrl = new URL(request.url)

  if (requestUrl.pathname === basePath || requestUrl.pathname.startsWith(`${basePath}/`)) {
    return request
  }

  const nextPath =
    requestUrl.pathname === AUTH_BASE_PATH
      ? ''
      : requestUrl.pathname.startsWith(`${AUTH_BASE_PATH}/`)
        ? requestUrl.pathname.slice(AUTH_BASE_PATH.length)
        : requestUrl.pathname
  const nextUrl = new URL(baseUrl)
  nextUrl.pathname = `${basePath}${nextPath}`
  nextUrl.search = requestUrl.search

  return new Request(nextUrl, request)
}
