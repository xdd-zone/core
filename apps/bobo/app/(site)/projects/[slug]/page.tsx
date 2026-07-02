import type { Metadata } from 'next'
import { BizCode } from '@xdd-zone/contracts'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPublicProject, getPublicProjects } from '@/lib/projects'
import { PublicCmsError } from '@/lib/public-cms-error'
import { makePlaceholder } from '../../_lib/placeholder'

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const project = await getPublicProject(slug)
    return {
      title: project.title,
      description: project.description ?? undefined,
    }
  } catch {
    return {
      title: '项目不存在',
    }
  }
}

export async function generateStaticParams() {
  try {
    const projects = await getPublicProjects()
    return projects.map((project) => ({ slug: project.slug }))
  } catch {
    return []
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params

  let project: Awaited<ReturnType<typeof getPublicProject>>
  try {
    project = await getPublicProject(slug)
  } catch (error) {
    if (error instanceof PublicCmsError && error.code === BizCode.COMMON_NOT_FOUND) {
      notFound()
    }

    const message =
      error instanceof PublicCmsError && error.reason === 'request-failed' ? error.message : '项目数据格式不正确。'

    return (
      <main className="flex flex-1 flex-col">
        <section className="flex-1 grid items-center border-t border-border py-9">
          <div className="max-w-300 mx-auto px-6">
            <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
              projects / work
            </span>
            <h1 className="mt-4.5 text-[clamp(2.5rem,8vw,5rem)] leading-none italic">项目暂时打不开</h1>
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
          <div className="max-w-250 mx-auto px-6 relative z-2">
            <Link
              className="inline-flex mb-8 text-foreground underline decoration-ld-text/25 underline-offset-6"
              href="/projects"
            >
              ← 返回项目
            </Link>
            <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
              projects / work
            </span>
            <h1 className="max-w-[12ch] mt-7 text-[clamp(3rem,8vw,6.5rem)] leading-[0.86] tracking-[-0.02em] italic">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-2 text-muted-foreground text-[0.78rem] mt-6.5">
              <span className="border border-border rounded-full px-2 py-1">
                {formatDate(project.publishedAt ?? project.updatedAt)}
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-250 mx-auto px-6 pt-10 pb-24">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-surface/38">
            <Image
              className="object-cover"
              src={makePlaceholder(project.coverAssetId ?? project.id)}
              alt={project.title}
              fill
              sizes="100vw"
              priority
            />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              {project.description ? (
                <p className="max-w-[72ch] text-[1rem] leading-[1.9] text-foreground/82">{project.description}</p>
              ) : (
                <p className="text-muted-foreground">这个项目还没有补说明。</p>
              )}
            </div>

            <aside className="border-t border-border pt-5">
              <h2 className="text-[0.82rem] text-muted-foreground uppercase tracking-[0.26em]">links</h2>
              {project.links.length > 0 ? (
                <div className="mt-4 flex flex-col gap-3">
                  {project.links.map((link) => (
                    <a
                      className="text-foreground underline decoration-ld-text/25 underline-offset-6"
                      href={link.href}
                      key={link.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-muted-foreground text-[0.9rem]">暂无公开链接。</p>
              )}
            </aside>
          </div>
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
