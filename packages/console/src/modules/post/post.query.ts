import type { CreatePostBody, PostListQuery, UpdatePostBody } from './post.types'

import { api, unwrapEdenResponse } from '@console/shared/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

const postApiRoot = api.post
type PostDetailApi = ReturnType<typeof postApiRoot>

function postDetailApi(id: string): PostDetailApi {
  return (postApiRoot as unknown as Record<string, PostDetailApi>)[id]
}

export const POST_LIST_QUERY_KEY = ['posts'] as const
export const POST_DETAIL_QUERY_KEY = (id: string) => ['posts', id] as const

/**
 * 文章列表查询配置。
 */
export function postListQueryOptions(query: PostListQuery = {}) {
  return queryOptions({
    queryFn: async () =>
      unwrapEdenResponse(
        await postApiRoot.get({
          query: {
            category: query.category,
            keyword: query.keyword,
            page: query.page,
            pageSize: query.pageSize,
            status: query.status,
            tag: query.tag,
          },
        }),
      ),
    queryKey: [...POST_LIST_QUERY_KEY, query],
    staleTime: 30_000,
  })
}

/**
 * 文章详情查询配置。
 */
export function postDetailQueryOptions(id: string) {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await postDetailApi(id).get()),
    queryKey: POST_DETAIL_QUERY_KEY(id),
    staleTime: 30_000,
  })
}

/**
 * 文章列表查询 Hook。
 */
export function usePostListQuery(query: PostListQuery = {}) {
  return useQuery(postListQueryOptions(query))
}

/**
 * 文章详情查询 Hook。
 */
export function usePostDetailQuery(id: string, enabled: boolean = true) {
  return useQuery({
    ...postDetailQueryOptions(id),
    enabled,
  })
}

/**
 * 创建文章 mutation。
 */
export function useCreatePostMutation() {
  return useMutation({
    mutationFn: async (body: CreatePostBody) => unwrapEdenResponse(await postApiRoot.post(body)),
  })
}

/**
 * 更新文章 mutation。
 */
export function useUpdatePostMutation() {
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdatePostBody & { id: string }) =>
      unwrapEdenResponse(await postDetailApi(id).patch(body)),
  })
}

/**
 * 删除文章 mutation。
 */
export function useDeletePostMutation() {
  return useMutation({
    mutationFn: async (id: string) => unwrapEdenResponse(await postDetailApi(id).delete()),
  })
}

/**
 * 发布文章 mutation。
 */
export function usePublishPostMutation() {
  return useMutation({
    mutationFn: async (id: string) => unwrapEdenResponse(await postDetailApi(id).publish.post()),
  })
}

/**
 * 取消发布文章 mutation。
 */
export function useUnpublishPostMutation() {
  return useMutation({
    mutationFn: async (id: string) => unwrapEdenResponse(await postDetailApi(id).unpublish.post()),
  })
}
