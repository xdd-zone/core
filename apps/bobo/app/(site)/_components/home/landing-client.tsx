'use client'

import type { PublicCategoryMenuItem } from '@/lib/content/public-content'
import Image from 'next/image'
import Link from 'next/link'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

import { makePlaceholder } from '../../_lib/placeholder'
import { CategoryMenu } from '../site/category-menu'
import { SITE_NAV_ITEMS } from '../site/site-nav-items'

const HERO_ROLES = ['独立开发者', 'TS 全栈开发者', '工具作者', '内容记录者']
const EXPLORATION_CARDS = [
  { key: 'e1', alt: '碎碎念卡片', rotate: -3, col: 0 },
  { key: 'e2', alt: '技术实验卡片', rotate: 2, col: 0 },
  { key: 'e3', alt: '日常记录卡片', rotate: -1, col: 0 },
  { key: 'e4', alt: '代码片段卡片', rotate: 2, col: 1 },
  { key: 'e5', alt: '产品想法卡片', rotate: -2, col: 1 },
  { key: 'e6', alt: '阅读摘记卡片', rotate: 3, col: 1 },
]

export function HeroContent() {
  const [ready, setReady] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const readyTimer = setTimeout(setReady, motionAllowed ? 120 : 0, true)

    let roleTimer: ReturnType<typeof setInterval> | undefined
    if (motionAllowed) {
      roleTimer = setInterval(() => {
        if (document.hidden) return
        setRoleIndex((prev) => (prev + 1) % HERO_ROLES.length)
      }, 2000)
    }

    return () => {
      clearTimeout(readyTimer)
      if (roleTimer) clearInterval(roleTimer)
    }
  }, [])

  return (
    <div className="relative z-10 text-center px-6">
      <span
        className={cn(
          'block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em] opacity-0 translate-y-[18px]',
          ready && 'animate-landing-rise',
        )}
        style={ready ? { animationDelay: '0.04s' } : {}}
      >
        XIDONGDONG / 2026
      </span>
      <h1
        className={cn(
          'text-[clamp(3.5rem,12vw,9rem)] max-md:text-[clamp(4.4rem,20vw,6rem)] leading-[0.9] tracking-[-0.02em] mb-6 italic opacity-0 translate-y-[18px]',
          ready && 'animate-landing-rise',
        )}
        style={ready ? { animationDelay: '0.13s' } : {}}
      >
        喜东东
      </h1>
      <p
        className={cn(
          'text-[clamp(1.1rem,2.5vw,1.5rem)] mb-2 opacity-0 translate-y-[18px]',
          ready && 'animate-landing-rise',
        )}
        style={ready ? { animationDelay: '0.27s' } : {}}
      >
        一名
        <span className="inline-block italic animate-landing-role-fade" key={roleIndex}>
          {HERO_ROLES[roleIndex]}
        </span>
        ，主要写 TypeScript。
      </p>
      <p
        className={cn(
          'text-[0.95rem] max-w-[28rem] mx-auto mt-4 mb-12 leading-[1.6] text-muted-foreground opacity-0 translate-y-[18px]',
          ready && 'animate-landing-rise',
        )}
        style={ready ? { animationDelay: '0.35s' } : {}}
      >
        我做 Web 产品、Agent 工具和内容系统。这里放近期文章、代表作品、碎碎念，以及一些正在打磨的技术实验。
      </p>
      <div
        className={cn(
          'inline-flex gap-4 flex-wrap justify-center opacity-0 translate-y-[18px]',
          ready && 'animate-landing-rise',
        )}
        style={ready ? { animationDelay: '0.43s' } : {}}
      >
        <a
          className="relative rounded-full text-[0.9rem] px-7 py-3.5 inline-block text-center transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 bg-ld-text text-ld-bg hover:shadow-[0_12px_34px_rgba(137,170,204,0.18)]"
          href="#work"
        >
          看作品
        </a>
        <a
          className="relative rounded-full text-[0.9rem] px-7 py-3.5 inline-block text-center transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 border-2 border-border bg-background text-foreground"
          href="#contact"
        >
          联系我
        </a>
      </div>
    </div>
  )
}

export function LandingNavbar({ categories = [] }: { categories?: PublicCategoryMenuItem[] }) {
  const pillRef = useRef<HTMLDivElement>(null)
  const totalPostCount = categories.reduce((total, category) => total + category.postCount, 0)

  useEffect(() => {
    let ticking = false
    function update() {
      if (pillRef.current) {
        if (window.scrollY > 100) pillRef.current.classList.add('scrolled')
        else pillRef.current.classList.remove('scrolled')
      }
      ticking = false
    }
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-4">
      <div
        className="relative inline-flex items-center gap-[2px] rounded-full backdrop-blur-[12px] border border-white/10 bg-surface p-2 transition-[box-shadow,transform] duration-[360ms] ease-[cubic-bezier(0.23,1,0.32,1)] [&.scrolled]:shadow-[0_8px_24px_rgba(0,0,0,0.4)] [&.scrolled]:-translate-y-0.5"
        ref={pillRef}
      >
        <Link
          className="relative w-9 h-9 rounded-full grid place-items-center transition-transform duration-300 hover:scale-[1.06] group/logo"
          href="/"
          aria-label="回到首页"
        >
          <div className="absolute inset-0 rounded-full p-[2px] bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] transition-transform duration-500 group-hover/logo:rotate-180" />
          <span className="relative z-1 w-[30px] h-[30px] rounded-full bg-background grid place-items-center text-[13px] italic">
            XD
          </span>
        </Link>
        <span className="w-[1px] h-5 bg-border mx-1" />
        {SITE_NAV_ITEMS.map((item) =>
          'menu' in item && item.menu === 'categories' && categories.length > 0 ? (
            <div
              className="relative group/nav after:absolute after:top-full after:left-1/2 max-md:after:left-0 after:w-[min(720px,calc(100vw-32px))] max-md:after:w-[min(340px,calc(100vw-24px))] after:h-8 after:-translate-x-1/2 max-md:after:-translate-x-[76px]"
              key={item.href}
            >
              <Link
                className="text-[0.85rem] max-md:text-[0.78rem] max-md:px-2.5 max-md:py-2 rounded-full px-4 py-2 transition-[color,background-color,transform] duration-200 inline-flex items-center border-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 text-muted-foreground hover:text-foreground hover:bg-border/50 hover:-translate-y-[1px]"
                href={item.href}
              >
                {item.label}
              </Link>
              <CategoryMenu categories={categories} totalPostCount={totalPostCount} />
            </div>
          ) : (
            <Link
              key={item.href}
              className={cn(
                'text-[0.85rem] max-md:text-[0.78rem] max-md:px-2.5 max-md:py-2 rounded-full px-4 py-2 transition-[color,background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1',
                item.href === '/'
                  ? 'text-foreground bg-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-border/50 hover:-translate-y-[1px]',
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          ),
        )}
        <span className="w-[1px] h-5 bg-border mx-1" />
        <a
          className="relative inline-flex items-center gap-1 max-md:text-[0.78rem] text-[0.85rem] rounded-full group/hi focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
          href="mailto:hi@xidongdong.dev"
        >
          <span className="absolute inset-[-2px] rounded-full opacity-0 bg-[linear-gradient(90deg,var(--color-ld-accent-1),var(--color-ld-accent-2))] transition-opacity duration-300 ease-out group-hover/hi:opacity-100" />
          <span className="relative z-1 inline-flex items-center gap-1 bg-surface backdrop-blur-[12px] rounded-full px-4 py-2 max-md:px-2.5 max-md:py-2">
            联系 ↗
          </span>
        </a>
      </div>
    </nav>
  )
}

export function RevealOnScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '-80px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'opacity-0 translate-y-[22px] transition-all duration-[720ms] ease-[cubic-bezier(0.23,1,0.32,1)] [&.in]:opacity-100 [&.in]:translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ExplorationsParallax() {
  const exploreRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const [lightboxSrc, setLightboxSrc] = useState<{ alt: string; src: string } | null>(null)

  useEffect(() => {
    const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!motionAllowed) return

    let ticking = false
    function updateParallax() {
      ticking = false
      const explore = exploreRef.current
      if (!explore) return
      const rect = explore.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const prog = Math.min(Math.max(-rect.top / total, 0), 1)
      cardsRef.current.forEach((c, idx) => {
        if (!c) return
        const isSecondCol = idx >= 3
        const dir = isSecondCol ? 1 : -1
        const speed = 120 + (idx % 3) * 60
        const baseRot = EXPLORATION_CARDS[idx]?.rotate ?? 0
        c.style.transform = `translateY(${prog * speed * dir}px) rotate(${baseRot}deg)`
      })
    }
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(updateParallax)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  const col0 = EXPLORATION_CARDS.filter((c) => c.col === 0)
  const col1 = EXPLORATION_CARDS.filter((c) => c.col === 1)

  return (
    <>
      <section className="relative min-h-[300vh]" ref={exploreRef}>
        <div className="sticky top-0 h-screen grid place-items-center text-center z-10 pointer-events-none">
          <div className="pointer-events-auto max-w-[1280px] mx-auto px-[clamp(24px,6vw,80px)]">
            <span className="block mb-8 text-[0.72rem] text-muted-foreground uppercase tracking-[0.3em]">碎碎念</span>
            <h2 className="text-[clamp(2.2rem,6vw,4rem)] leading-[1.05] my-4 italic">碎碎念与实验</h2>
            <p className="text-muted-foreground" style={{ maxWidth: '26rem', margin: '0 auto' }}>
              小功能、半成品、踩坑记录和临时想法。这里保留一点没那么正式的东西。
            </p>
            <a
              className="inline-flex items-center gap-2 border border-border rounded-full px-5 py-3 text-[0.9rem] mt-4 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 bg-surface"
              href="#contact"
            >
              看更新入口 ↗
            </a>
          </div>
        </div>
        <div className="absolute inset-0 z-20 grid grid-cols-2 gap-5 md:gap-12 max-w-[1400px] mx-auto px-4 md:px-8 pointer-events-none">
          <div className="flex flex-col gap-20 pt-[30vh]">
            {col0.map((card, i) => (
              <button
                key={card.key}
                className="aspect-square max-w-[320px] w-full rounded-[20px] overflow-hidden border border-border pointer-events-auto cursor-pointer appearance-none bg-transparent p-0 transition-all duration-150 hover:border-foreground/30 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1"
                type="button"
                ref={(el) => {
                  cardsRef.current[i] = el
                }}
                style={{ transform: `rotate(${card.rotate}deg)` }}
                onClick={() => setLightboxSrc({ alt: card.alt, src: makePlaceholder(card.key) })}
              >
                <Image
                  className="w-full h-full object-cover"
                  src={makePlaceholder(card.key)}
                  alt={card.alt}
                  width={640}
                  height={640}
                />
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-20 pt-[55vh]">
            {col1.map((card, i) => (
              <button
                key={card.key}
                className="aspect-square max-w-[320px] w-full rounded-[20px] overflow-hidden border border-border pointer-events-auto cursor-pointer appearance-none bg-transparent p-0 transition-all duration-150 hover:border-foreground/30 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ld-accent-1 ml-auto"
                type="button"
                ref={(el) => {
                  cardsRef.current[i + 3] = el
                }}
                style={{ transform: `rotate(${card.rotate}deg)` }}
                onClick={() => setLightboxSrc({ alt: card.alt, src: makePlaceholder(card.key) })}
              >
                <Image
                  className="w-full h-full object-cover"
                  src={makePlaceholder(card.key)}
                  alt={card.alt}
                  width={640}
                  height={640}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <div
        className={cn(
          'fixed inset-0 z-[9000] bg-black/90 grid place-items-center p-10 opacity-0 pointer-events-none transition-opacity duration-200',
          lightboxSrc && 'opacity-100 pointer-events-auto',
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!lightboxSrc}
        onClick={closeLightbox}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeLightbox()
        }}
      >
        {lightboxSrc ? (
          <Image
            className={cn(
              'max-w-[90vw] max-h-[90vh] rounded-2xl scale-[0.98] transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
              lightboxSrc && 'scale-100',
            )}
            src={lightboxSrc.src}
            alt={lightboxSrc.alt}
            width={960}
            height={960}
          />
        ) : null}
      </div>
    </>
  )
}

export function MarqueeTrack() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!motionAllowed) return

    let x = 0
    let half = 0
    let raf = 0

    function measure() {
      if (track) half = track.scrollWidth / 2
    }
    measure()
    window.addEventListener('resize', measure)

    function tick() {
      raf = 0
      if (document.hidden) return
      x -= 0.6
      if (half && -x >= half) x += half
      if (track) track.style.transform = `translateX(${x}px)`
      raf = requestAnimationFrame(tick)
    }
    function start() {
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick)
    }
    document.addEventListener('visibilitychange', start)
    start()

    return () => {
      window.removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', start)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const unit = '写代码，做产品，记录日常 * '
  const spans = Array.from({ length: 20 }, (_, i) => <span key={i}>{unit}</span>)

  return (
    <div className="overflow-hidden whitespace-nowrap my-8 md:my-12">
      <div className="inline-block" ref={trackRef}>
        {spans.map((span, i) => (
          <span className="text-[clamp(2rem,6vw,4rem)] text-foreground/85" key={i}>
            {span.props.children}
          </span>
        ))}
      </div>
    </div>
  )
}
