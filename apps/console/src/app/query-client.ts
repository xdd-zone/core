import { QueryClient } from '@tanstack/react-query'

/**
 * Console 全局 QueryClient。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
