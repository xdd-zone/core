import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostRenderer } from '@/components/content/post-renderer'
import { getPublicPost, PublicContentError } from '@/lib/content/public-content'

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

  let post: Awaited<ReturnType<typeof getPublicPost>>
  try {
    post = await getPublicPost(slug)
  } catch (error) {
    if (error instanceof PublicContentError && error.reason === 'request-failed') {
      notFound()
    }

    return (
      <main className="site-page">
        <SiteNav activeHref="/writing" />
        <section className="writing-error">
          <div className="site-container">
            <span className="site-eyebrow">writing / post</span>
            <h1>文稿暂时打不开</h1>
            <p>文章数据格式不正确。</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="site-page">
      <SiteNav activeHref="/writing" />
      <article className="writing-detail">
        <header className="writing-detail-hero">
          <div className="site-hero-fallback" aria-hidden="true" />
          <div className="overlay" />
          <div className="bottom-fade" />
          <div className="site-container writing-detail-head">
            <Link className="writing-back-link" href="/writing">
              ← 返回文稿
            </Link>
            <span className="site-eyebrow">writing / post</span>
            <h1>{post.title}</h1>
            {post.excerpt ? <p>{post.excerpt}</p> : null}
            <div className="writing-detail-meta">
              {post.category ? <span>{post.category.name}</span> : null}
              <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
              {post.tags.map((tag) => (
                <span key={tag.id}>{tag.name}</span>
              ))}
            </div>
          </div>
        </header>

        <div className="site-container writing-detail-body">
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
