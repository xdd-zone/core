import { z } from 'zod'

export const SearchDocumentTypeSchema = z.enum(['post', 'project', 'site-page'])

export const PublicSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
})

export const PublicSearchResultSchema = z.object({
  id: z.string(),
  publishedAt: z.string().nullable(),
  summary: z.string().nullable(),
  title: z.string(),
  type: SearchDocumentTypeSchema,
  url: z.string(),
})

export const PublicSearchResponseSchema = z.object({
  results: z.array(PublicSearchResultSchema),
})

export type PublicSearchQuery = z.infer<typeof PublicSearchQuerySchema>
export type PublicSearchResponse = z.infer<typeof PublicSearchResponseSchema>
export type PublicSearchResult = z.infer<typeof PublicSearchResultSchema>
export type SearchDocumentType = z.infer<typeof SearchDocumentTypeSchema>
