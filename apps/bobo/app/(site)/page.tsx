import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { getHomePageData, getSiteShellData } from '@/lib/site'
import { cn } from '@/lib/utils'
import { ExplorationsParallax, HeroContent, MarqueeTrack, RevealOnScroll } from './_components/home/landing-client'
import { makePlaceholder } from './_lib/placeholder'

const techStack = ['TypeScript', 'React', 'Node.js', 'Next.js', 'Hono', 'Drizzle', 'SQLite', 'Agent Skills']

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteShellData()

  return {
    title: site.seo.title,
    description: site.seo.description ?? undefined,
  }
}

export default async function Home() {
  const data = await getHomePageData()
  const contactHref = data.profile.contactEmail ? `mailto:${data.profile.contactEmail}` : '#contact'
  const visibleHomeSections = new Set(
    data.site.homeSections
      .filter((section) => section.visible)
      .sort((a, b) => a.order - b.order)
      .map((section) => section.type),
  )
  const showProjects = visibleHomeSections.has('projects')
  const showWriting = visibleHomeSections.has('writing')
  const showProfile = visibleHomeSections.has('profile')

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative min-h-screen grid place-items-center overflow-hidden" id="home">
        <HeroContent profile={data.profile} />

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-center">
          <span className="text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase block mb-3">向下</span>
          <div className="w-px h-10 bg-border mx-auto overflow-hidden relative">
            <i className="block w-px h-full bg-foreground animate-landing-scroll-down" />
          </div>
        </div>
      </section>

      {showProjects ? (
        <section className="py-12 md:py-16" id="work">
          <div className="max-w-7xl mx-auto px-[clamp(24px,6vw,80px)]">
            <RevealOnScroll>
              <div className="flex justify-between items-end gap-6 mb-12 flex-wrap">
                <div>
                  <span className="inline-flex items-center gap-3 mb-5">
                    <i className="w-8 h-px bg-border" />
                    <span className="text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">代表作品</span>
                  </span>
                  <h2 className="text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] tracking-[-0.02em]">
                    代表<span className="italic">作品</span>
                  </h2>
                  <p className="text-muted-foreground text-[0.95rem] max-w-120 mt-4">
                    偏向真实产品和长期维护的工具：能跑、能改、能继续长出来。
                  </p>
                </div>
                <Link
                  className="relative inline-flex items-center gap-1.5 rounded-full py-2.5 px-4.5 text-[0.85rem] border border-border transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 group"
                  href="/projects"
                >
                  <span className="absolute -inset-px rounded-full opacity-0 bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] transition-opacity duration-300 group-hover:opacity-100 z-0" />
                  <span className="relative z-10 inline-flex items-center gap-1.5 bg-background rounded-full px-0.5">
                    查看项目 →
                  </span>
                </Link>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {data.projects.slice(0, 4).map((project, i) => (
                  <Link
                    className={cn(
                      'relative rounded-[24px] overflow-hidden border border-border/70 dark:border-border bg-white dark:bg-surface shadow-sm dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25 group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1',
                      i === 0 || i === 3 ? 'md:col-span-7 aspect-4/3' : 'md:col-span-5 md:aspect-3/4 max-md:aspect-4/3',
                    )}
                    href={`/projects/${project.slug}`}
                    key={project.id}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                        src={makePlaceholder(project.coverAssetId ?? project.id)}
                        alt={project.title}
                        fill
                        sizes="(min-width: 768px) 58vw, 100vw"
                      />
                      <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[4px_4px]" />
                    </div>
                    <div className="absolute left-5 right-5 bottom-5 z-2 flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4 md:gap-4.5 pointer-events-none">
                      <h3 className="text-[clamp(1.35rem,2.2vw,2rem)] leading-none font-medium tracking-[-0.02em] italic [text-shadow:0_12px_30px_rgba(0,0,0,0.55)]">
                        {project.title}
                      </h3>
                      <p className="max-w-full md:max-w-[18rem] text-foreground/75 text-[0.82rem] leading-[1.55] text-left md:text-right [text-shadow:0_12px_30px_rgba(0,0,0,0.55)]">
                        {project.description ?? '这个项目还没有补说明。'}
                      </p>
                    </div>
                    <div className="absolute inset-0 grid place-items-center opacity-0 bg-background/75 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                      <span className="relative inline-flex items-center gap-1.5 bg-white text-[#111] rounded-full px-5 py-2.5 text-[0.9rem] before:absolute before:-inset-0.5 before:rounded-full before:-z-10 before:bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2),var(--color-ld-accent-1))] before:bg-size-[200%_100%] before:animate-landing-gradient-shift">
                        项目 — <span className="italic">{project.title}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>
      ) : null}

      {showWriting ? (
        <section className="py-16" id="journal">
          <div className="max-w-7xl mx-auto px-[clamp(24px,6vw,80px)]">
            <RevealOnScroll>
              <div className="flex justify-between items-end gap-6 mb-12 flex-wrap">
                <div>
                  <span className="inline-flex items-center gap-3 mb-5">
                    <i className="w-8 h-px bg-border" />
                    <span className="text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">近期文章</span>
                  </span>
                  <h2 className="text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] tracking-[-0.02em]">
                    近期<span className="italic">文章</span>
                  </h2>
                  <p className="text-muted-foreground text-[0.95rem] max-w-120 mt-4">
                    写开发过程里真的遇到的问题，也写一些日常观察。
                  </p>
                </div>
                <Link
                  className="relative inline-flex items-center gap-1.5 rounded-full py-2.5 px-4.5 text-[0.85rem] border border-border transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 group"
                  href="/writing"
                >
                  <span className="absolute -inset-px rounded-full opacity-0 bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] transition-opacity duration-300 group-hover:opacity-100 z-0" />
                  <span className="relative z-10 inline-flex items-center gap-1.5 bg-background rounded-full px-0.5">
                    继续阅读 →
                  </span>
                </Link>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="flex flex-col gap-4">
                {data.posts.slice(0, 4).map((post) => (
                  <Link
                    className="flex items-center gap-6 p-4 bg-white/60 dark:bg-surface/30 border border-border/70 dark:border-border rounded-[28px] md:rounded-[40px] shadow-sm dark:shadow-none transition-all duration-200 hover:bg-white dark:hover:bg-surface hover:shadow-md dark:hover:shadow-none hover:translate-x-1 hover:border-foreground/20"
                    href={`/writing/${post.slug}`}
                    key={post.id}
                  >
                    <Image
                      className="w-18 h-18 rounded-3xl object-cover flex-none"
                      src={makePlaceholder(post.coverAssetId ?? post.id)}
                      alt="文章封面"
                      width={72}
                      height={72}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[1.15rem] font-medium tracking-[-0.01em]">{post.title}</h3>
                      <div className="flex gap-4 text-muted-foreground text-[0.8rem] mt-1.5">
                        <span>{post.category?.name ?? '文稿'}</span>
                      </div>
                    </div>
                    <span className="hidden md:block text-muted-foreground text-[0.8rem] whitespace-nowrap">
                      {formatMonthLabel(post.publishedAt ?? post.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>
      ) : null}

      {showProfile ? <ExplorationsParallax /> : null}

      {showProfile ? (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-[clamp(24px,6vw,80px)]">
            <RevealOnScroll>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center md:text-left">
                <div className="landing-stat">
                  <div className="text-[clamp(2.5rem,6vw,4rem)] leading-none italic">TS</div>
                  <div className="text-muted-foreground text-[0.85rem] mt-3">主要语言：TypeScript 全栈</div>
                </div>
                <div className="landing-stat">
                  <div className="text-[clamp(2.5rem,6vw,4rem)] leading-none italic">3</div>
                  <div className="text-muted-foreground text-[0.85rem] mt-3">首页内容：文章、作品、碎碎念</div>
                </div>
                <div className="landing-stat">
                  <div className="text-[clamp(2.5rem,6vw,4rem)] leading-none italic">∞</div>
                  <div className="text-muted-foreground text-[0.85rem] mt-3">长期更新：工具、想法、实验</div>
                </div>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="flex flex-wrap gap-2.5 mt-4.5 justify-center" aria-label="技术栈">
                {techStack.map((tech) => (
                  <span
                    className="border border-border/70 dark:border-border rounded-full px-4 py-2 text-foreground/80 bg-white/80 dark:bg-surface/45 shadow-sm dark:shadow-none text-[0.8rem] transition-colors hover:bg-white dark:hover:bg-surface"
                    key={tech}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>
      ) : null}

      {showProfile ? (
        <section className="relative pt-16 pb-12 overflow-hidden" id="contact">
          <div className="relative z-2 max-w-7xl mx-auto px-[clamp(24px,6vw,80px)]">
            <MarqueeTrack />
            <div className="text-center">
              <a
                className="relative inline-flex items-center gap-2 rounded-full px-8 py-4 text-[1rem] transition-transform duration-200 hover:-translate-y-0.5 group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
                href={contactHref}
              >
                <span className="absolute -inset-0.5 rounded-full opacity-0 bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 inline-flex items-center gap-2 bg-surface rounded-full px-1">
                  {data.profile.contactEmail ?? '联系我'}
                </span>
              </a>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
