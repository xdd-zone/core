import { resolveRouteMeta } from '@console/app/router/types'

import { useMatches } from '@tanstack/react-router'

/**
 * 返回当前路由（最后一个 match）的静态元信息。
 */
export function useCurrentHandle() {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  return resolveRouteMeta(last?.staticData)
}
