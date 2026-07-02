import type { Metadata } from 'next'
import Link from 'next/link'

import { searchPublicSite } from '@/lib/search'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: '搜索',
  description: '搜索喜东东公开站点里的文章和项目。',
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = readParam((await searchParams).q)?.trim() ?? ''

  if (!query) {
    return (
      <main className="flex flex-1 flex-col">
        <SearchHero query="" />
        <section className="pt-12 pb-24">
          <div className="max-w-300 mx-auto px-6 border-t border-border py-9">
            <p className="text-muted-foreground">输入关键词后可以搜索公开文章、项目和站点页面。</p>
          </div>
        </section>
      </main>
    )
  }

  const data = await getSearchData(query)

  if (!data.ok) {
    return (
      <main className="flex flex-1 flex-col">
        <SearchHero query={query} />
        <section className="pt-12 pb-24">
          <div className="max-w-300 mx-auto px-6 border-t border-border py-9">
            <p className="text-muted-foreground">{data.message}</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col">
      <SearchHero query={data.query} />
      <section className="pt-12 pb-24">
        <div className="max-w-300 mx-auto px-6">
          {data.results.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {data.results.map((result) => (
                <Link
                  className="border border-border rounded-xl bg-surface/38 p-5 transition-[background,border-color,transform] duration-220 hover:border-foreground/20 hover:bg-surface md:hover:translate-x-1"
                  href={result.url}
                  key={result.id}
                >
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-[0.78rem]">
                    <span className="border border-border rounded-full px-2 py-1">{formatType(result.type)}</span>
                    {result.publishedAt ? <span>{formatDate(result.publishedAt)}</span> : null}
                  </div>
                  <h2 className="mt-3 text-[clamp(1.3rem,3vw,2rem)] leading-[1.12] tracking-[-0.02em] italic">
                    {result.title}
                  </h2>
                  {result.summary ? (
                    <p className="max-w-2xl mt-3 text-muted-foreground text-[0.92rem] leading-[1.75]">
                      {result.summary}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="border-t border-border py-9">
              <p className="text-muted-foreground">没有找到和“{query}”相关的公开内容。</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

async function getSearchData(query: string) {
  try {
    return {
      ...(await searchPublicSite(query)),
      ok: true as const,
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : '搜索暂时不可用。',
      ok: false as const,
    }
  }
}

function SearchHero({ query }: { query: string }) {
  return (
    <section className="relative pt-40 pb-24 max-md:pt-30 max-md:pb-18">
      <div className="max-w-300 mx-auto px-6 relative z-2">
        <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
          search / site
        </span>
        <h1 className="max-w-[9ch] text-[clamp(4rem,12vw,9rem)] leading-[0.86] tracking-[-0.02em] italic">
          搜索<span className="block text-foreground/68">站点</span>
        </h1>
        <form action="/search" className="mt-9 flex max-w-160 flex-col gap-3 sm:flex-row">
          <input
            className="min-h-12 flex-1 rounded-md border border-border bg-surface/60 px-4 text-[0.95rem] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
            defaultValue={query}
            name="q"
            placeholder="输入关键词"
            type="search"
          />
          <button
            className="min-h-12 rounded-md border border-border bg-ld-text px-5 text-[0.9rem] text-ld-bg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
            type="submit"
          >
            搜索
          </button>
        </form>
      </div>
    </section>
  )
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatType(type: string) {
  if (type === 'post') return '文章'
  if (type === 'project') return '项目'
  return '页面'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
