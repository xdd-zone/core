import type { PostFormat, PostStatus, PostSummary } from '@xdd-zone/contracts'

export interface PostListFilter {
  format: PostFormat | 'all'
  keyword: string
  status: PostStatus | 'all'
}

export function filterContentPosts(posts: PostSummary[], filter: PostListFilter) {
  const normalizedKeyword = filter.keyword.trim().toLowerCase()

  return posts.filter((post) => {
    const matchesKeyword =
      normalizedKeyword.length === 0 ||
      post.title.toLowerCase().includes(normalizedKeyword) ||
      post.slug.toLowerCase().includes(normalizedKeyword)
    const matchesStatus = filter.status === 'all' || post.status === filter.status
    const matchesFormat = filter.format === 'all' || post.format === filter.format

    return matchesKeyword && matchesStatus && matchesFormat
  })
}
