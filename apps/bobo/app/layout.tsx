import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { getSiteShellData } from '@/lib/site'
import { FALLBACK_DARK, THEME_STORAGE_KEY } from '@/lib/theme'

import './globals.css'

const mapleMono = localFont({
  variable: '--font-maple-mono',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Microsoft YaHei', 'monospace'],
  src: [
    {
      path: './fonts/MapleMonoNormalNL-Regular.ttf.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/MapleMonoNormalNL-Italic.ttf.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/MapleMonoNormalNL-Medium.ttf.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/MapleMonoNormalNL-MediumItalic.ttf.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './fonts/MapleMonoNormalNL-SemiBold.ttf.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/MapleMonoNormalNL-SemiBoldItalic.ttf.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './fonts/MapleMonoNormalNL-Bold.ttf.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/MapleMonoNormalNL-BoldItalic.ttf.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
})

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteShellData()

  return {
    title: {
      default: site.seo.title,
      template: `%s | ${site.seo.title}`,
    },
    description: site.seo.description ?? 'bobo 个人站点。',
  }
}

const themeInitScript = `
  (() => {
    const storageKey = '${THEME_STORAGE_KEY}';
    const defaultSetting = 'system';
    const fallbackLight = 'latte';
    const fallbackDark = 'macchiato';
    const supportedSettings = new Set(['latte', 'macchiato', 'system']);
    
    let storedSetting = window.localStorage.getItem(storageKey);
    let setting = supportedSettings.has(storedSetting) ? storedSetting : defaultSetting;
    
    let activeTheme = setting;
    if (setting === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? fallbackDark : fallbackLight;
    }
    
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.dataset.themeSetting = setting;
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      data-theme={FALLBACK_DARK}
      suppressHydrationWarning
      className={`${mapleMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  )
}
