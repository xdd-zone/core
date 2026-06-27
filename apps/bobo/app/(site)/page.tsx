import type { Metadata } from 'next'
import Image from 'next/image'

import { getPublicCategoryMenu } from '@/lib/content/public-content'

import {
  ExplorationsParallax,
  HeroContent,
  LandingNavbar,
  MarqueeTrack,
  RevealOnScroll,
} from './_components/home/landing-client'
import { makePlaceholder } from './_lib/placeholder'

export const metadata: Metadata = {
  title: '喜东东 - 独立开发者作品集',
  description: '我做 Web 产品、Agent 工具和内容系统。这里放近期文章、代表作品、碎碎念，以及一些正在打磨的技术实验。',
}

const projects = [
  {
    key: 'p1',
    title: 'Open Design 工作台',
    desc: '把本地项目、设计产物和 Agent 流程放在一个可见的工作区里。',
  },
  {
    key: 'p2',
    title: '个人网站系统',
    desc: '文章、作品、碎碎念统一发布，首页先突出最近发生的事。',
  },
  {
    key: 'p3',
    title: 'Agent 技能系统',
    desc: '把重复的工作流程写成可复用技能，减少每次重新解释的成本。',
  },
  {
    key: 'p4',
    title: '内容发布管线',
    desc: '从草稿、标签到 RSS 输出，尽量让记录本身不被工具打断。',
  },
]

const articles = [
  {
    key: 'j1',
    title: '从一个页面开始整理自己的内容系统',
    readTime: '6 分钟阅读',
    date: '2026.06',
  },
  {
    key: 'j2',
    title: 'TypeScript 全栈项目里我会先定哪些边界',
    readTime: '8 分钟阅读',
    date: '2026.05',
  },
  {
    key: 'j3',
    title: '给 Agent 写技能时，什么该写进规则',
    readTime: '7 分钟阅读',
    date: '2026.04',
  },
  {
    key: 'j4',
    title: '一些没那么正式的日常记录',
    readTime: '3 分钟阅读',
    date: '持续更新',
  },
]

const techStack = ['TypeScript', 'React', 'Node.js', 'Next.js', 'Hono', 'Drizzle', 'SQLite', 'Agent Skills']

export default async function Home() {
  const categories = await getPublicCategoryMenu().catch(() => [])

  return (
    <div className="landing-page">
      <section className="landing-hero" id="home">

        <LandingNavbar categories={categories} />
        <HeroContent />

        <div className="landing-scroll-ind">
          <span className="lbl">向下</span>
          <div className="track">
            <i />
          </div>
        </div>
      </section>

      {/* 代表作品 */}
      <section className="landing-works" id="work">
        <div className="landing-container">
          <RevealOnScroll>
            <div className="landing-sec-head">
              <div>
                <span className="line">
                  <i className="bar" />
                  <span className="eyebrow">代表作品</span>
                </span>
                <h2>
                  代表<span className="italic">作品</span>
                </h2>
                <p>偏向真实产品和长期维护的工具：能跑、能改、能继续长出来。</p>
              </div>
              <a className="landing-view-all" href="#contact">
                <span className="ring" />
                <span className="inner">聊聊合作 →</span>
              </a>
            </div>
          </RevealOnScroll>
          <RevealOnScroll>
            <div className="landing-bento">
              {projects.map((proj) => (
                <div className="landing-proj" key={proj.key}>
                  <div className="landing-proj-img">
                    <Image
                      src={makePlaceholder(proj.key)}
                      alt={proj.title}
                      fill
                      sizes="(min-width: 768px) 58vw, 100vw"
                    />
                    <div className="halftone" />
                  </div>
                  <div className="landing-proj-copy">
                    <h3>{proj.title}</h3>
                    <p>{proj.desc}</p>
                  </div>
                  <div className="hover-layer">
                    <span className="landing-proj-label">
                      项目 — <span className="italic">{proj.title}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 近期文章 */}
      <section className="landing-journal" id="journal">
        <div className="landing-container">
          <RevealOnScroll>
            <div className="landing-sec-head">
              <div>
                <span className="line">
                  <i className="bar" />
                  <span className="eyebrow">近期文章</span>
                </span>
                <h2>
                  近期<span className="italic">文章</span>
                </h2>
                <p>写开发过程里真的遇到的问题，也写一些日常观察。</p>
              </div>
              <a className="landing-view-all" href="#journal">
                <span className="ring" />
                <span className="inner">继续阅读 →</span>
              </a>
            </div>
          </RevealOnScroll>
          <RevealOnScroll>
            <div className="landing-entries">
              {articles.map((article) => (
                <div className="landing-entry" key={article.key}>
                  <Image src={makePlaceholder(article.key)} alt="文章封面" width={72} height={72} />
                  <div className="body">
                    <h3>{article.title}</h3>
                    <div className="meta">
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                  <span className="date">{article.date}</span>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <ExplorationsParallax />

      <section className="landing-stats">
        <div className="landing-container">
          <RevealOnScroll>
            <div className="landing-stats-grid">
              <div className="landing-stat">
                <div className="num">TS</div>
                <div className="lbl">主要语言：TypeScript 全栈</div>
              </div>
              <div className="landing-stat">
                <div className="num">3</div>
                <div className="lbl">首页内容：文章、作品、碎碎念</div>
              </div>
              <div className="landing-stat">
                <div className="num">∞</div>
                <div className="lbl">长期更新：工具、想法、实验</div>
              </div>
            </div>
          </RevealOnScroll>
          <RevealOnScroll>
            <div className="landing-tech-row" aria-label="技术栈">
              {techStack.map((tech) => (
                <span className="landing-tech-pill" key={tech}>
                  {tech}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="landing-contact" id="contact">
        <div className="inner landing-container">
          <MarqueeTrack />
          <div className="landing-contact-cta">
            <a className="landing-email-btn" href="mailto:hi@xidongdong.dev">
              <span className="ring" />
              <span className="inner">hi@xidongdong.dev</span>
            </a>
          </div>
          <div className="landing-footer-bar">
            <div className="landing-socials">
              <a href="#">GitHub</a>
              <a href="#">博客</a>
              <a href="#">RSS</a>
              <a href="#">即刻</a>
            </div>
            <div className="landing-avail">
              <span className="dot" />
              可以交流项目、工具和文章
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
