import type { PostStatus, PostSummary } from '@xdd-zone/contracts'

export interface PostListFilter {
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

    return matchesKeyword && matchesStatus
  })
}
