import { api, unwrapEdenResponse } from '@console/shared/api'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

export interface PreviewHeading {
  level: number
  slug: string
  text: string
}

export interface PreviewMarkdownBody {
  coverImage?: string | null
  excerpt?: string
  markdown: string
  title?: string
  type?: 'post'
}

export interface PreviewMarkdownResponse {
  excerpt: string | null
  html: string
  toc: PreviewHeading[]
}

const previewApiRoot = api.preview

export const PREVIEW_MARKDOWN_QUERY_KEY = (payload: PreviewMarkdownBody) => ['preview', 'markdown', payload] as const

/**
 * Markdown 预览查询配置。
 */
export function previewMarkdownQueryOptions(payload: PreviewMarkdownBody) {
  return queryOptions({
    queryFn: async () => unwrapEdenResponse(await previewApiRoot.markdown.post(payload)),
    queryKey: PREVIEW_MARKDOWN_QUERY_KEY(payload),
    staleTime: 10_000,
  })
}

/**
 * Markdown 预览查询 Hook。
 */
export function usePreviewMarkdownQuery(payload: PreviewMarkdownBody, enabled: boolean = true) {
  return useQuery({
    ...previewMarkdownQueryOptions(payload),
    enabled,
  })
}

/**
 * Markdown 预览 mutation。
 */
export function usePreviewMarkdownMutation() {
  return useMutation({
    mutationFn: async (payload: PreviewMarkdownBody) => unwrapEdenResponse(await previewApiRoot.markdown.post(payload)),
  })
}
