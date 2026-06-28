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

  const activeTag = tagSlug ? data.tags.find((tag) => tag.slug === tagSlug) : null

  return (
    <main className="flex flex-1 flex-col">
      <SiteNav activeHref="/writing" categories={data.categories} />
      <section className="relative pt-40 pb-24 max-md:pt-30 max-md:pb-18">
        <div className="max-w-300 mx-auto px-6 relative z-2">
          <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
            writing / content
          </span>
          <h1 className="max-w-[9ch] text-[clamp(4rem,12vw,9rem)] leading-[0.86] tracking-[-0.02em] italic">
            文稿<span className="block text-foreground/68">记录</span>
          </h1>
          <p className="max-w-136 mt-7 text-muted-foreground text-[clamp(1rem,2vw,1.2rem)] leading-[1.75]">
            这里放已经发布的文章。偏技术、产品和一些做工具时留下来的笔记。
          </p>
        </div>
      </section>

      <section className="pt-12 pb-24">
        <div className="max-w-300 mx-auto px-6 grid grid-cols-1 md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] gap-[clamp(32px,6vw,72px)] items-start">
          <aside
            className="sticky top-28 max-md:static flex flex-col gap-8 max-md:gap-5 border-t border-border pt-6"
            aria-label="文稿筛选"
          >
            <div>
              <p className="mb-3 text-muted-foreground text-[0.72rem] tracking-[0.26em] uppercase">标签</p>
              <div className="flex flex-wrap gap-2">
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

          <div>
            <div className="flex justify-between items-end gap-6 mb-7 flex-wrap">
              <div>
                <span className="inline-flex items-center gap-3 mb-5">
                  <i className="w-8 h-px bg-border" />
                  <span className="text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
                    published posts
                  </span>
                </span>
                <h2 className="text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] tracking-[-0.02em]">
                  已发布<span className="italic">文稿</span>
                </h2>
                <p className="text-muted-foreground text-[0.95rem] max-w-120 mt-4">
                  {activeTag ? activeTag.name : '按发布时间排列，先看最新的一批。'}
                </p>
              </div>
            </div>

            {data.posts.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {data.posts.map((post) => (
                  <Link
                    className="grid grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)_auto] gap-3.5 md:gap-6 items-center border border-border rounded-[22px] md:rounded-[24px] bg-surface/38 p-5 transition-[background,border-color,transform] duration-220 hover:border-foreground/20 hover:bg-surface md:hover:translate-x-1 group/entry"
                    href={`/writing/${post.slug}`}
                    key={post.id}
                  >
                    <div className="aspect-square border border-border rounded-[18px] grid place-items-center content-center bg-background/60 w-18 md:w-auto">
                      <span className="text-muted-foreground text-[0.7rem] uppercase">
                        {formatMonth(post.publishedAt ?? post.updatedAt)}
                      </span>
                      <strong className="text-[1.6rem] leading-none italic">
                        {formatDay(post.publishedAt ?? post.updatedAt)}
                      </strong>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 text-muted-foreground text-[0.78rem]">
                        <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
                      </div>
                      <h3 className="mt-2 text-[clamp(1.25rem,2.5vw,1.8rem)] leading-[1.16] font-medium tracking-[-0.02em]">
                        {post.title}
                      </h3>
                      {post.excerpt ? (
                        <p className="max-w-2xl mt-2.5 text-muted-foreground text-[0.9rem] leading-[1.7]">
                          {post.excerpt}
                        </p>
                      ) : null}
                      {post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 text-muted-foreground text-[0.78rem] mt-3.5">
                          {post.tags.map((tag) => (
                            <span className="border border-border rounded-full px-2 py-1" key={tag.id}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground text-[0.82rem] whitespace-nowrap max-md:justify-self-start">
                      阅读 →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-t border-border py-9">
                <p className="text-muted-foreground">当前筛选下还没有公开文章。</p>
                <Link
                  className="inline-flex mt-4 text-foreground underline decoration-ld-text/25 underline-offset-6"
                  href="/writing"
                >
                  查看全部文稿
                </Link>
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
    <main className="flex flex-1 flex-col">
      <SiteNav activeHref="/writing" />
      <section className="flex-1 grid items-center border-t border-border py-9">
        <div className="max-w-300 mx-auto px-6">
          <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
            writing / content
          </span>
          <h1 className="mt-4.5 text-[clamp(2.5rem,8vw,5rem)] leading-none italic">文稿暂时打不开</h1>
          <p className="text-muted-foreground mt-7 max-w-136 text-[clamp(1rem,2vw,1.2rem)] leading-[1.75]">{message}</p>
        </div>
      </section>
    </main>
  )
}

function FilterLink({ active, children, href }: { active: boolean; children: React.ReactNode; href: string }) {
  return (
    <Link
      className={`border border-border rounded-full px-2.75 py-1.75 text-[0.8rem] transition-[background,border-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${active ? 'border-foreground/24 bg-surface text-foreground -translate-y-px' : 'text-muted-foreground hover:border-foreground/24 hover:bg-surface hover:text-foreground hover:-translate-y-px'}`}
      href={href}
    >
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
