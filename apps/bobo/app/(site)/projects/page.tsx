import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Pagination } from '@/components/site/pagination'
import { getPublicProjectListOrFallback } from '@/lib/projects'
import { makePlaceholder } from '../_lib/placeholder'

interface ProjectsPageProps {
  searchParams: Promise<{
    page?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: '项目',
  description: '喜东东的公开项目列表。',
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams
  const data = await getPublicProjectListOrFallback(readPageParam(params.page))

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative pt-40 pb-24 max-md:pt-30 max-md:pb-18">
        <div className="max-w-300 mx-auto px-6 relative z-2">
          <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">
            projects / work
          </span>
          <h1 className="max-w-[9ch] text-[clamp(4rem,12vw,9rem)] leading-[0.86] tracking-[-0.02em] italic">
            项目<span className="block text-foreground/68">作品</span>
          </h1>
          <p className="max-w-136 mt-7 text-muted-foreground text-[clamp(1rem,2vw,1.2rem)] leading-[1.75]">
            这里放已经公开的项目。能继续维护的东西，会优先出现在这里。
          </p>
        </div>
      </section>

      <section className="pt-12 pb-24">
        <div className="max-w-300 mx-auto px-6">
          {data.total > 0 ? (
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-6">
              <p className="text-muted-foreground text-[0.85rem] tabular-nums">
                第 {data.page} / {data.totalPages} 页，共 {data.total} 个项目
              </p>
            </div>
          ) : null}

          {data.projects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.projects.map((project) => (
                  <Link
                    className="group border border-border rounded-xl bg-surface/38 overflow-hidden transition-[background,border-color,transform] duration-220 hover:border-foreground/20 hover:bg-surface hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
                    href={`/projects/${project.slug}`}
                    key={project.id}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-background/60">
                      <Image
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                        src={makePlaceholder(project.coverAssetId ?? project.id)}
                        alt={project.title}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-4 text-muted-foreground text-[0.78rem]">
                        <span>{formatDate(project.publishedAt ?? project.updatedAt)}</span>
                        <span>查看 →</span>
                      </div>
                      <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.3rem)] leading-[1.08] tracking-[-0.02em] italic">
                        {project.title}
                      </h2>
                      {project.description ? (
                        <p className="mt-4 text-muted-foreground text-[0.92rem] leading-[1.75]">
                          {project.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>

              <Pagination
                currentPage={data.page}
                totalPages={data.totalPages}
                hasNextPage={data.hasNextPage}
                hasPreviousPage={data.hasPreviousPage}
                nextHref={buildPageHref(data.page + 1)}
                previousHref={buildPageHref(data.page - 1)}
              />
            </>
          ) : (
            <div className="border-t border-border py-9">
              <p className="text-muted-foreground">
                {data.total > 0 ? '这一页没有公开项目。' : '当前还没有公开项目。'}
              </p>
              {data.total > 0 ? (
                <Link
                  className="inline-flex mt-4 text-foreground underline decoration-ld-text/25 underline-offset-6"
                  href="/projects"
                >
                  返回第一页
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function buildPageHref(page: number) {
  return page > 1 ? `/projects?page=${page}` : '/projects'
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function readPageParam(value: string | string[] | undefined) {
  const page = Number(readParam(value))
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
