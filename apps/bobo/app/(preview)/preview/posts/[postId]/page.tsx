import type { Metadata } from 'next'

import { RichContentRenderer } from '@/components/content/rich-content-renderer'
import { getPreviewPost, PREVIEW_POST_TTL_LABEL, PreviewPostError } from '@/lib/content/preview-post'

interface PreviewPostPageProps {
  params: Promise<{
    postId: string
  }>
  searchParams: Promise<{
    token?: string | string[]
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params, searchParams }: PreviewPostPageProps): Promise<Metadata> {
  const { postId } = await params
  const token = readToken((await searchParams).token)

  try {
    const preview = await getPreviewPost(token, postId)
    return {
      title: preview.revision.title,
      robots: {
        follow: false,
        index: false,
      },
    }
  } catch {
    return {
      title: '文章预览不可用',
      robots: {
        follow: false,
        index: false,
      },
    }
  }
}

export default async function PreviewPostPage({ params, searchParams }: PreviewPostPageProps) {
  const { postId } = await params
  const token = readToken((await searchParams).token)

  let preview: Awaited<ReturnType<typeof getPreviewPost>>
  try {
    preview = await getPreviewPost(token, postId)
  } catch (error) {
    return <PreviewErrorPage error={error} />
  }

  return (
    <main className="min-h-screen px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl">
        <PreviewNotice />
        <header className="border-b border-border/70 py-10 md:py-14">
          <p className="text-xs font-medium tracking-[0.24em] text-fg-muted uppercase">preview</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-fg md:text-5xl">{preview.revision.title}</h1>
          {preview.revision.excerpt ? (
            <p className="mt-5 text-base leading-7 text-fg-muted md:text-lg md:leading-8">{preview.revision.excerpt}</p>
          ) : null}
          <dl className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-muted">
            <div className="flex gap-2">
              <dt>版本</dt>
              <dd className="font-medium text-fg">#{preview.revision.revisionNo}</dd>
            </div>
          </dl>
        </header>
        <div className="py-10 md:py-12">
          <RichContentRenderer source={preview.revision.source} />
        </div>
      </div>
    </main>
  )
}

function readToken(token: string | string[] | undefined) {
  return Array.isArray(token) ? token[0] : token
}

function PreviewNotice() {
  return (
    <div className="rounded-lg border border-primary/35 bg-primary/10 px-4 py-3 text-sm leading-6 text-fg">
      当前是文章预览，链接有效期为 {PREVIEW_POST_TTL_LABEL}。
    </div>
  )
}

function PreviewErrorPage({ error }: { error: unknown }) {
  const message =
    error instanceof PreviewPostError ? error.message : '文章预览暂时打不开。请回到 Fifa 重新生成预览链接。'

  return (
    <main className="flex min-h-screen items-center px-5 py-8 md:px-8">
      <section className="mx-auto w-full max-w-xl border-t border-border/70 py-8">
        <p className="text-xs font-medium tracking-[0.24em] text-fg-muted uppercase">preview</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg">文章预览不可用</h1>
        <p className="mt-4 text-sm leading-6 text-fg-muted">{message}</p>
      </section>
    </main>
  )
}
