import type {
  CategoryListQuery,
  CreateCategoryBody,
  PublicCategoryListQuery,
  UpdateCategoryBody,
} from './category.types'

import { api, unwrapEdenResponse } from '@console/shared/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

const categoryApiRoot = api.category
type CategoryDetailApi = ReturnType<typeof categoryApiRoot>

function categoryDetailApi(id: string): CategoryDetailApi {
  return (categoryApiRoot as unknown as Record<string, CategoryDetailApi>)[id]
}

export const CATEGORY_LIST_QUERY_KEY = ['categories'] as const
export const CATEGORY_DETAIL_QUERY_KEY = (id: string) => ['categories', id] as const
export const PUBLIC_CATEGORY_LIST_QUERY_KEY = ['categories', 'public'] as const

export function categoryListQueryOptions(query: CategoryListQuery = {}) {
  return queryOptions({
    queryFn: async () =>
      unwrapEdenResponse(
        await categoryApiRoot.get({
          query: {
            isVisible: query.isVisible,
            keyword: query.keyword,
            page: query.page,
            pageSize: query.pageSize,
          },
        }),
      ),
    queryKey: [...CATEGORY_LIST_QUERY_KEY, query],
    staleTime: 30_000,
  })
}

export function publicCategoryListQueryOptions(query: PublicCategoryListQuery = {}) {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await categoryApiRoot.public.get({ query })),
    queryKey: [...PUBLIC_CATEGORY_LIST_QUERY_KEY, query],
    staleTime: 60_000,
  })
}

export function useCategoryListQuery(query: CategoryListQuery = {}) {
  return useQuery(categoryListQueryOptions(query))
}

export function usePublicCategoryListQuery(query: PublicCategoryListQuery = {}) {
  return useQuery(publicCategoryListQueryOptions(query))
}

export function useCreateCategoryMutation() {
  return useMutation({
    mutationFn: async (body: CreateCategoryBody) => unwrapEdenResponse(await categoryApiRoot.post(body)),
  })
}

export function useUpdateCategoryMutation() {
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateCategoryBody & { id: string }) =>
      unwrapEdenResponse(await categoryDetailApi(id).patch(body)),
  })
}

export function useDeleteCategoryMutation() {
  return useMutation({
    mutationFn: async (id: string) => unwrapEdenResponse(await categoryDetailApi(id).delete()),
  })
}
