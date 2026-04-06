import type { CommentListQuery, UpdateCommentStatusBody } from './comment.types'

import { api, unwrapEdenResponse } from '@console/shared/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

const commentApiRoot = api.comment

export const COMMENT_LIST_QUERY_KEY = ['comments'] as const
export const COMMENT_DETAIL_QUERY_KEY = (id: string) => ['comments', id] as const

/**
 * 评论列表查询配置。
 */
export function commentListQueryOptions(query: CommentListQuery = {}) {
  return queryOptions({
    queryFn: async () =>
      unwrapEdenResponse(
        await commentApiRoot.get({
          query: {
            createdFrom: query.createdFrom,
            createdTo: query.createdTo,
            keyword: query.keyword,
            page: query.page,
            pageSize: query.pageSize,
            postId: query.postId,
            status: query.status,
          },
        }),
      ),
    queryKey: [...COMMENT_LIST_QUERY_KEY, query],
    staleTime: 30_000,
  })
}

/**
 * 评论详情查询配置。
 */
export function commentDetailQueryOptions(id: string) {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await commentApiRoot({ id }).get()),
    queryKey: COMMENT_DETAIL_QUERY_KEY(id),
    staleTime: 30_000,
  })
}

/**
 * 评论列表查询 Hook。
 */
export function useCommentListQuery(query: CommentListQuery = {}) {
  return useQuery(commentListQueryOptions(query))
}

/**
 * 评论详情查询 Hook。
 */
export function useCommentDetailQuery(id: string, enabled: boolean = true) {
  return useQuery({
    ...commentDetailQueryOptions(id),
    enabled,
  })
}

/**
 * 更新评论状态 mutation。
 */
export function useUpdateCommentStatusMutation() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UpdateCommentStatusBody['status'] }) =>
      unwrapEdenResponse(await commentApiRoot({ id }).status.patch({ status })),
  })
}

/**
 * 删除评论 mutation。
 */
export function useDeleteCommentMutation() {
  return useMutation({
    mutationFn: async (id: string) => unwrapEdenResponse(await commentApiRoot({ id }).delete()),
  })
}
