import type { Metadata } from 'next'
import { BizCode } from '@xdd-zone/contracts'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostRenderer } from '@/components/content/post-renderer'
import { getPublicCategoryMenu, getPublicPost, PublicContentError } from '@/lib/content/public-content'

import { SiteNav } from '../../_components/site/site-nav'

interface WritingDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: WritingDetailPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const post = await getPublicPost(slug)
    return {
      title: post.title,
      description: post.excerpt ?? undefined,
    }
  } catch {
    return {
      title: '文稿不存在',
    }
  }
}

export default async function WritingDetailPage({ params }: WritingDetailPageProps) {
  const { slug } = await params
  const categoriesPromise = getPublicCategoryMenu().catch(() => [])

  let post: Awaited<ReturnType<typeof getPublicPost>>
  try {
    post = await getPublicPost(slug)
  } catch (error) {
    if (error instanceof PublicContentError && error.code === BizCode.COMMON_NOT_FOUND) {
      notFound()
    }

    const message =
      error instanceof PublicContentError && error.reason === 'request-failed' ? error.message : '文章数据格式不正确。'

    return (
      <main className="min-h-screen">
        <SiteNav activeHref="/writing" />
        <section className="min-h-screen grid items-center border-t border-ld-stroke py-9">
          <div className="max-w-[1200px] mx-auto px-6">
            <span className="block mb-8 text-[0.72rem] text-ld-muted uppercase tracking-[0.3em]">writing / post</span>
            <h1 className="mt-[18px] text-[clamp(2.5rem,8vw,5rem)] leading-none italic">文稿暂时打不开</h1>
            <p className="text-ld-muted mt-7 max-w-[34rem] text-[clamp(1rem,2vw,1.2rem)] leading-[1.75]">{message}</p>
          </div>
        </section>
      </main>
    )
  }

  const categories = await categoriesPromise

  return (
    <main className="min-h-screen">
      <SiteNav activeHref="/writing" categories={categories} />
      <article>
        <header className="relative pt-[160px] pb-12 max-md:pt-[110px] max-md:pb-12">
          <div className="max-w-[1200px] mx-auto px-6 relative z-2 max-w-[960px]">
            <Link className="inline-flex mb-8 text-ld-text underline decoration-ld-text/25 underline-offset-6" href="/writing">
              ← 返回文稿
            </Link>
            <span className="block mb-8 text-[0.72rem] text-ld-muted uppercase tracking-[0.3em]">writing / post</span>
            <h1 className="max-w-[12ch] mt-7 text-[clamp(3rem,8vw,6.5rem)] leading-[0.86] tracking-[-0.02em] italic">{post.title}</h1>
            {post.excerpt ? <p className="max-w-[34rem] mt-7 text-ld-muted text-[clamp(1rem,2vw,1.2rem)] leading-[1.75]">{post.excerpt}</p> : null}
            <div className="flex flex-wrap gap-2 text-ld-muted text-[0.78rem] mt-[26px]">
              <span className="border border-ld-stroke rounded-full px-2 py-1">{formatDate(post.publishedAt ?? post.updatedAt)}</span>
              {post.tags.map((tag) => (
                <span className="border border-ld-stroke rounded-full px-2 py-1" key={tag.id}>{tag.name}</span>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto px-6 max-w-[820px] pt-16 pb-24">
          <PostRenderer source={post.source} />
        </div>
      </article>
    </main>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
