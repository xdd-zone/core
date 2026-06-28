import { ThemeToggle } from '@/components/site/theme-toggle'

const footerLinkGroups = [
  {
    title: '关于',
    links: [
      { href: '#', label: '关于本站', internal: false },
      { href: '/writing', label: '博客', internal: true },
    ],
  },
  {
    title: '联系',
    links: [
      { href: '#', label: 'GitHub', internal: false },
      { href: '#', label: '即刻', internal: false },
    ],
  },
  {
    title: '更多',
    links: [
      { href: '#', label: 'RSS', internal: false },
      { href: '#', label: '站点地图', internal: false },
    ],
  },
] as const

const bottomLinks = [
  { href: '#', label: '订阅' },
] as const

const currentYear = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden pb-8 pt-20 transition-colors duration-300">
      {/* 底部雾气光晕背景：使用 mask-image 避免透明过渡产生灰线（死区） */}
      <div className="pointer-events-none absolute inset-0 bg-[color-mix(in_oklab,var(--theme-lavender)_18%,var(--theme-base))] [mask-image:linear-gradient(to_bottom,transparent,black)] dark:bg-[color-mix(in_oklab,var(--theme-lavender)_3%,var(--theme-crust,#11111b))]" />

      <div className="relative z-10 mx-auto max-w-7xl px-[clamp(24px,6vw,80px)]">
        {/* 顶部主要内容：左侧品牌，右侧多列链接 */}
        <div className="mb-20 flex flex-col justify-between gap-12 md:flex-row lg:gap-24">
          {/* 左侧品牌与描述 */}
          <div className="flex max-w-xs flex-col items-start space-y-8">
            <div>
              <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">Bobo</h2>
              <p className="text-[0.9rem] italic text-muted-foreground">Stay hungry. Stay foolish.</p>
            </div>

            <div className="space-y-1 text-[0.85rem] text-muted-foreground">
              <p>
                © 2024-{currentYear} Powered by Bobo &{' '}
                <span className="cursor-not-allowed opacity-50 transition-colors duration-300 hover:text-foreground">
                  XDD Zone
                </span>
                .
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-[0.85rem] text-muted-foreground">
              <span className="animate-landing-pulse-dot h-2 w-2 rounded-full bg-[#4ade80]" />
              可以交流项目、工具和文章
            </div>
          </div>

          {/* 右侧链接矩阵 */}
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3 lg:gap-20">
            {footerLinkGroups.map((group) => (
              <div key={group.title} className="flex flex-col space-y-5">
                <h3 className="text-[0.9rem] font-medium text-foreground">{group.title}</h3>
                <ul className="flex flex-col space-y-3.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <span className="cursor-not-allowed text-[0.85rem] text-muted-foreground opacity-50 transition-colors duration-300 hover:text-foreground">
                        {link.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 底部附加功能栏：工具、主题切换、备案等 */}
        <div className="flex flex-col items-start justify-between gap-4 pt-8 text-[0.85rem] text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex flex-wrap items-center gap-x-3">
              {bottomLinks.map((link, index) => (
                <div key={link.label} className="flex items-center gap-3">
                  <span className="cursor-not-allowed opacity-50 transition-colors duration-300 hover:text-foreground">
                    {link.label}
                  </span>
                  {index < bottomLinks.length - 1 && <span className="opacity-30">·</span>}
                </div>
              ))}
            </div>

            <span className="hidden opacity-30 sm:inline">|</span>
            <ThemeToggle />
            <span className="hidden opacity-30 sm:inline">|</span>

            <button
              type="button"
              className="flex cursor-not-allowed items-center gap-1.5 opacity-50 transition-colors duration-300 hover:text-foreground"
              aria-label="切换语言"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 8 6 6" />
                <path d="m4 14 6-6 2-3" />
                <path d="M2 5h12" />
                <path d="M7 2h1" />
                <path d="m22 22-5-10-5 10" />
                <path d="M14 18h6" />
              </svg>
              简体中文
            </button>
          </div>

          <div className="flex items-center">
            <span className="select-none transition-colors duration-300 hover:text-foreground">( •̀ ω •́ )✧</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
