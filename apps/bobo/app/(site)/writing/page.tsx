import type { Metadata } from 'next'
import Link from 'next/link'

import { getPublicWritingData, PublicContentError } from '@/lib/content/public-content'

import { SiteNav } from '../_components/site/site-nav'

interface WritingPageProps {
  searchParams: Promise<{
    category?: string | string[]
    tag?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: '文稿',
  description: '喜东东的公开文章列表。',
}

export default async function WritingPage({ searchParams }: WritingPageProps) {
  const params = await searchParams
  const categorySlug = readParam(params.category)
  const tagSlug = readParam(params.tag)

  let data: Awaited<ReturnType<typeof getPublicWritingData>>
  try {
    data = await getPublicWritingData({ categorySlug, tagSlug })
  } catch (error) {
    return <WritingErrorPage error={error} />
  }

  const activeCategory = categorySlug ? data.categories.find((category) => category.slug === categorySlug) : null
  const activeTag = tagSlug ? data.tags.find((tag) => tag.slug === tagSlug) : null

  return (
    <main className="site-page writing-page">
      <SiteNav activeHref="/writing" />
      <section className="writing-hero">
        <div className="site-hero-fallback" aria-hidden="true" />
        <div className="overlay" />
        <div className="bottom-fade" />
        <div className="site-container writing-hero-inner">
          <span className="site-eyebrow">writing / content</span>
          <h1>
            文稿<span>记录</span>
          </h1>
          <p>这里放已经发布的文章。偏技术、产品和一些做工具时留下来的笔记。</p>
        </div>
      </section>

      <section className="writing-body">
        <div className="site-container writing-layout">
          <aside className="writing-sidebar" aria-label="文稿筛选">
            <div className="writing-filter-group">
              <p>分类</p>
              <div className="writing-chip-list">
                <FilterLink href={buildFilterHref({ tagSlug })} active={!categorySlug}>
                  全部
                </FilterLink>
                {data.categories.map((category) => (
                  <FilterLink
                    key={category.id}
                    href={buildFilterHref({ categorySlug: category.slug, tagSlug })}
                    active={category.slug === categorySlug}
                  >
                    {category.name}
                  </FilterLink>
                ))}
              </div>
            </div>

            <div className="writing-filter-group">
              <p>标签</p>
              <div className="writing-chip-list">
                <FilterLink href={buildFilterHref({ categorySlug })} active={!tagSlug}>
                  全部
                </FilterLink>
                {data.tags.map((tag) => (
                  <FilterLink
                    key={tag.id}
                    href={buildFilterHref({ categorySlug, tagSlug: tag.slug })}
                    active={tag.slug === tagSlug}
                  >
                    {tag.name}
                  </FilterLink>
                ))}
              </div>
            </div>
          </aside>

          <div className="writing-main">
            <div className="writing-section-head">
              <div>
                <span className="line">
                  <i className="bar" />
                  <span className="eyebrow">published posts</span>
                </span>
                <h2>
                  已发布<span className="italic">文稿</span>
                </h2>
                <p>
                  {activeCategory || activeTag
                    ? [activeCategory?.name, activeTag?.name].filter(Boolean).join(' / ')
                    : '按发布时间排列，先看最新的一批。'}
                </p>
              </div>
            </div>

            {data.posts.length > 0 ? (
              <div className="writing-list">
                {data.posts.map((post) => (
                  <Link className="writing-entry" href={`/writing/${post.slug}`} key={post.id}>
                    <div className="writing-entry-date">
                      <span>{formatMonth(post.publishedAt ?? post.updatedAt)}</span>
                      <strong>{formatDay(post.publishedAt ?? post.updatedAt)}</strong>
                    </div>
                    <div className="writing-entry-body">
                      <div className="writing-entry-meta">
                        {post.category ? <span>{post.category.name}</span> : null}
                        <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
                      </div>
                      <h3>{post.title}</h3>
                      {post.excerpt ? <p>{post.excerpt}</p> : null}
                      {post.tags.length > 0 ? (
                        <div className="writing-entry-tags">
                          {post.tags.map((tag) => (
                            <span key={tag.id}>{tag.name}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <span className="writing-entry-arrow">阅读 →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="writing-empty">
                <p>当前筛选下还没有公开文章。</p>
                <Link href="/writing">查看全部文稿</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function WritingErrorPage({ error }: { error: unknown }) {
  const message = error instanceof PublicContentError ? error.message : '文稿暂时打不开。'

  return (
    <main className="site-page writing-page">
      <SiteNav activeHref="/writing" />
      <section className="writing-error">
        <div className="site-container">
          <span className="site-eyebrow">writing / content</span>
          <h1>文稿暂时打不开</h1>
          <p>{message}</p>
        </div>
      </section>
    </main>
  )
}

function FilterLink({ active, children, href }: { active: boolean; children: React.ReactNode; href: string }) {
  return (
    <Link className={active ? 'active' : undefined} href={href}>
      {children}
    </Link>
  )
}

function buildFilterHref({ categorySlug, tagSlug }: { categorySlug?: string; tagSlug?: string }) {
  const params = new URLSearchParams()
  if (categorySlug) params.set('category', categorySlug)
  if (tagSlug) params.set('tag', tagSlug)
  const query = params.toString()
  return query ? `/writing?${query}` : '/writing'
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
  }).format(new Date(value))
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
  }).format(new Date(value))
}
