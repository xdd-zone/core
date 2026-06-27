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
    <div className={cn('landing-hero-content', ready && 'ready')}>
      <span className="landing-hero-eyebrow">XIDONGDONG / 2026</span>
      <h1 className="landing-hero-name">喜东东</h1>
      <p className="landing-hero-role">
        一名
        <span className="role-word" key={roleIndex}>
          {HERO_ROLES[roleIndex]}
        </span>
        ，主要写 TypeScript。
      </p>
      <p className="landing-hero-desc">
        我做 Web 产品、Agent 工具和内容系统。这里放近期文章、代表作品、碎碎念，以及一些正在打磨的技术实验。
      </p>
      <div className="landing-cta-row">
        <a className="landing-btn landing-btn-solid" href="#work">
          看作品
        </a>
        <a className="landing-btn landing-btn-outline" href="#contact">
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
    <nav className="site-navbar">
      <div className="site-nav-pill" ref={pillRef}>
        <Link className="site-logo" href="/" aria-label="回到首页">
          <span>XD</span>
        </Link>
        <span className="site-nav-divider" />
        {SITE_NAV_ITEMS.map((item) =>
          'menu' in item && item.menu === 'categories' && categories.length > 0 ? (
            <div className="site-nav-dropdown" key={item.href}>
              <Link className="site-nav-link site-nav-trigger" href={item.href}>
                {item.label}
              </Link>
              <CategoryMenu categories={categories} totalPostCount={totalPostCount} />
            </div>
          ) : (
            <Link key={item.href} className={cn('site-nav-link', item.href === '/' && 'active')} href={item.href}>
              {item.label}
            </Link>
          ),
        )}
        <span className="site-nav-divider" />
        <a className="site-say-hi" href="mailto:hi@xidongdong.dev">
          <span className="ring" />
          <span className="inner">联系 ↗</span>
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
    <div ref={ref} className={cn('landing-reveal', className)}>
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
      <section className="landing-explore" ref={exploreRef}>
        <div className="landing-explore-pin">
          <div className="inner landing-container">
            <span className="landing-hero-eyebrow">碎碎念</span>
            <h2>碎碎念与实验</h2>
            <p className="text-fg-muted" style={{ maxWidth: '26rem', margin: '0 auto' }}>
              小功能、半成品、踩坑记录和临时想法。这里保留一点没那么正式的东西。
            </p>
            <a className="landing-dribbble-btn" href="#contact">
              看更新入口 ↗
            </a>
          </div>
        </div>
        <div className="landing-parallax-cols">
          <div className="landing-pcol">
            {col0.map((card, i) => (
              <button
                key={card.key}
                className="landing-pcard"
                type="button"
                ref={(el) => {
                  cardsRef.current[i] = el
                }}
                style={{ transform: `rotate(${card.rotate}deg)` }}
                onClick={() => setLightboxSrc({ alt: card.alt, src: makePlaceholder(card.key) })}
              >
                <Image src={makePlaceholder(card.key)} alt={card.alt} width={640} height={640} />
              </button>
            ))}
          </div>
          <div className="landing-pcol">
            {col1.map((card, i) => (
              <button
                key={card.key}
                className="landing-pcard"
                type="button"
                ref={(el) => {
                  cardsRef.current[i + 3] = el
                }}
                style={{ transform: `rotate(${card.rotate}deg)` }}
                onClick={() => setLightboxSrc({ alt: card.alt, src: makePlaceholder(card.key) })}
              >
                <Image src={makePlaceholder(card.key)} alt={card.alt} width={640} height={640} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <div
        className={cn('landing-lightbox', lightboxSrc && 'open')}
        role="dialog"
        aria-modal="true"
        aria-hidden={!lightboxSrc}
        onClick={closeLightbox}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeLightbox()
        }}
      >
        {lightboxSrc ? <Image src={lightboxSrc.src} alt={lightboxSrc.alt} width={960} height={960} /> : null}
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
    <div className="landing-marquee">
      <div className="track" ref={trackRef}>
        {spans}
      </div>
    </div>
  )
}
