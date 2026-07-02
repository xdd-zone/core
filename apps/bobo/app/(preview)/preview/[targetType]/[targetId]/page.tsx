import type { Metadata } from 'next'
import Link from 'next/link'

import { getGenericPreview, PREVIEW_TTL_LABEL, PreviewError } from '@/lib/content/preview'

interface GenericPreviewPageProps {
  params: Promise<{
    targetId: string
    targetType: string
  }>
  searchParams: Promise<{
    token?: string | string[]
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params, searchParams }: GenericPreviewPageProps): Promise<Metadata> {
  const { targetId, targetType } = await params
  const token = readToken((await searchParams).token)

  try {
    const preview = await readPreview(token, targetType, targetId)
    return {
      title: preview.targetType === 'project' ? preview.project.title : preview.post.revision.title,
      robots: {
        follow: false,
        index: false,
      },
    }
  } catch {
    return {
      title: '预览不可用',
      robots: {
        follow: false,
        index: false,
      },
    }
  }
}

export default async function GenericPreviewPage({ params, searchParams }: GenericPreviewPageProps) {
  const { targetId, targetType } = await params
  const token = readToken((await searchParams).token)

  let preview: Awaited<ReturnType<typeof readPreview>>
  try {
    preview = await readPreview(token, targetType, targetId)
  } catch (error) {
    return <PreviewErrorPage error={error} />
  }

  if (preview.targetType === 'project') {
    return <ProjectPreview project={preview.project} />
  }

  return <PreviewErrorPage error={new PreviewError('target-mismatch', '文章预览请使用文章预览地址打开。')} />
}

function readToken(token: string | string[] | undefined) {
  return Array.isArray(token) ? token[0] : token
}

async function readPreview(token: string | undefined, routeTargetType: string, routeTargetId: string) {
  const preview = await getGenericPreview(token)
  const expectedTargetType = routeTargetType === 'projects' ? 'project' : routeTargetType

  if (preview.targetType !== expectedTargetType || preview.targetId !== routeTargetId) {
    throw new PreviewError('target-mismatch', '预览链接和当前地址不匹配。')
  }

  return preview
}

function ProjectPreview({ project }: { project: { description: string | null; links: { href: string; label: string }[]; title: string } }) {
  return (
    <main className="min-h-screen px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl">
        <PreviewNotice />
        <header className="border-b border-border/70 py-10 md:py-14">
          <p className="text-xs font-medium tracking-[0.24em] text-fg-muted uppercase">preview</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-fg md:text-5xl">{project.title}</h1>
          {project.description ? (
            <p className="mt-5 text-base leading-7 text-fg-muted md:text-lg md:leading-8">{project.description}</p>
          ) : null}
        </header>
        {project.links.length > 0 ? (
          <section className="py-10">
            <h2 className="text-sm font-medium tracking-[0.2em] text-fg-muted uppercase">links</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {project.links.map((link) => (
                <Link
                  className="rounded-md border border-border px-4 py-2 text-sm text-fg transition-colors hover:bg-surface"
                  href={link.href}
                  key={`${link.label}-${link.href}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function PreviewNotice() {
  return (
    <div className="rounded-lg border border-primary/35 bg-primary/10 px-4 py-3 text-sm leading-6 text-fg">
      当前是预览页面，链接有效期为 {PREVIEW_TTL_LABEL}。
    </div>
  )
}

function PreviewErrorPage({ error }: { error: unknown }) {
  const message = error instanceof PreviewError ? error.message : '预览暂时打不开。请回到 Fifa 重新生成预览链接。'

  return (
    <main className="flex min-h-screen items-center px-5 py-8 md:px-8">
      <section className="mx-auto w-full max-w-xl border-t border-border/70 py-8">
        <p className="text-xs font-medium tracking-[0.24em] text-fg-muted uppercase">preview</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg">预览不可用</h1>
        <p className="mt-4 text-sm leading-6 text-fg-muted">{message}</p>
      </section>
    </main>
  )
}
