import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme'

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

export const metadata: Metadata = {
  title: {
    default: 'bobo',
    template: '%s | bobo',
  },
  description: 'bobo 个人站点。',
}

const themeInitScript = `
  (() => {
    const storageKey = '${THEME_STORAGE_KEY}';
    const fallbackTheme = '${DEFAULT_THEME}';
    const supportedThemes = new Set(['latte', 'frappe', 'macchiato', 'mocha']);
    const storedTheme = window.localStorage.getItem(storageKey);
    const theme = supportedThemes.has(storedTheme) ? storedTheme : fallbackTheme;
    document.documentElement.dataset.theme = theme;
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
      data-theme={DEFAULT_THEME}
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
