import type { RouteHandle } from '@/router/types'

import { useMatches } from 'react-router'

/**
 * 返回当前路由（最后一个 match）的 handle
 */
export function useCurrentHandle() {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  return (last?.handle as RouteHandle | undefined) ?? {}
}
