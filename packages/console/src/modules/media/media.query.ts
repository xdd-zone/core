import type { MediaListQuery } from './media.types'

import { api, unwrapEdenResponse } from '@console/shared/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

const mediaApiRoot = api.media

export const MEDIA_LIST_QUERY_KEY = ['media'] as const
export const MEDIA_DETAIL_QUERY_KEY = (id: string) => ['media', id] as const

/**
 * 媒体列表查询配置。
 */
export function mediaListQueryOptions(query: MediaListQuery = {}) {
  return queryOptions({
    queryFn: async () =>
      unwrapEdenResponse(
        await mediaApiRoot.get({
          query: {
            page: query.page,
            pageSize: query.pageSize,
          },
        }),
      ),
    queryKey: [...MEDIA_LIST_QUERY_KEY, query],
    staleTime: 30_000,
  })
}

/**
 * 媒体详情查询配置。
 */
export function mediaDetailQueryOptions(id: string) {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await mediaApiRoot({ id }).get()),
    queryKey: MEDIA_DETAIL_QUERY_KEY(id),
    staleTime: 30_000,
  })
}

/**
 * 媒体列表查询 Hook。
 */
export function useMediaListQuery(query: MediaListQuery = {}, enabled: boolean = true) {
  return useQuery({
    ...mediaListQueryOptions(query),
    enabled,
  })
}

/**
 * 媒体详情查询 Hook。
 */
export function useMediaDetailQuery(id: string, enabled: boolean = true) {
  return useQuery({
    ...mediaDetailQueryOptions(id),
    enabled,
  })
}

/**
 * 上传媒体 mutation。
 */
export function useUploadMediaMutation() {
  return useMutation({
    mutationFn: async (file: File) => unwrapEdenResponse(await mediaApiRoot.upload.post({ file })),
  })
}

/**
 * 删除媒体 mutation。
 */
export function useDeleteMediaMutation() {
  return useMutation({
    mutationFn: async (id: string) => unwrapEdenResponse(await mediaApiRoot({ id }).delete()),
  })
}
