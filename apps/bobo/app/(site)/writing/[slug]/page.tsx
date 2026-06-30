import type { Metadata } from 'next'
import { BizCode } from '@xdd-zone/contracts'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichContentRenderer } from '@/components/content/rich-content-renderer'
import { getPublicPost, PublicContentError } from '@/lib/content/public-content'

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
      <main className="flex flex-1 flex-col">
        <section className="flex-1 grid items-center border-t border-border py-9">
          <div className="max-w-300 mx-auto px-6">
            <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
              writing / post
            </span>
            <h1 className="mt-4.5 text-[clamp(2.5rem,8vw,5rem)] leading-none italic">文稿暂时打不开</h1>
            <p className="text-muted-foreground mt-7 max-w-136 text-[clamp(1rem,2vw,1.2rem)] leading-[1.75]">
              {message}
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col">
      <article>
        <header className="relative pt-40 pb-12 max-md:pt-27.5 max-md:pb-12">
          <div className="max-w-205 mx-auto px-6 relative z-2">
            <Link
              className="inline-flex mb-8 text-foreground underline decoration-ld-text/25 underline-offset-6"
              href="/writing"
            >
              ← 返回文稿
            </Link>
            <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
              writing / post
            </span>
            <h1 className="max-w-[12ch] mt-7 text-[clamp(3rem,8vw,6.5rem)] leading-[0.86] tracking-[-0.02em] italic">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-2 text-muted-foreground text-[0.78rem] mt-6.5">
              <span className="border border-border rounded-full px-2 py-1">
                {formatDate(post.publishedAt ?? post.updatedAt)}
              </span>
              {post.tags.map((tag) => (
                <span className="border border-border rounded-full px-2 py-1" key={tag.id}>
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-205 mx-auto px-6 pt-16 pb-24">
          {post.excerpt ? (
            <div className="mb-16 md:mb-20">
              <div className="flex items-center gap-4 mb-4 md:mb-5">
                <div className="h-[1px] w-8 md:w-12 bg-muted-foreground/30" />
                <div className="text-[0.65rem] font-mono text-muted-foreground/70 uppercase tracking-[0.3em]">
                  A.I. Synthesis
                </div>
              </div>
              <p className="text-foreground/80 leading-[1.9] text-[0.95rem] md:text-[1.05rem] pl-12 md:pl-16 max-w-[80ch]">
                {post.excerpt}
              </p>
            </div>
          ) : null}

          <RichContentRenderer source={post.source} />
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
