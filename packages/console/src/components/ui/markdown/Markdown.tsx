import type { ReactNode } from 'react'

import type { CatppuccinThemeId } from './theme/catppuccin'
import type { MarkdownTheme } from './theme/types'

import { clsx } from 'clsx'

import { compiler } from 'markdown-to-jsx'

import { useRef } from 'react'
import { SelectionPopup, useSelectionPopup } from './core'
import { MarkdownErrorBoundary } from './MarkdownErrorBoundary'
import {
  Anchor,
  Blockquote,
  CodeBlock,
  CodeInline,
  Del,
  Em,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Hr,
  Image,
  Li,
  Ol,
  Paragraph,
  Strong,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Ul,
} from './renderers'
import { MarkdownThemeProvider } from './theme'
import { useMarkdownTheme } from './theme/useTheme'
import { Toc } from './toc'
import { hexToRgb } from './utils/color'

export interface MarkdownProps {
  accentColor?: string
  catppuccinTheme?: CatppuccinThemeId
  children?: string
  className?: string
  showToc?: boolean
  theme?: MarkdownTheme
  value?: string
}

/**
 * MarkdownInner：负责将 Markdown 文本编译为 React 节点并渲染到容器
 * - 使用 `markdown-to-jsx` 的 `compiler` 提供轻量编译能力
 * - 通过 `overrides` 将各 HTML 标签映射到自定义渲染组件
 * - 集成文本选择弹窗（复制）与右侧目录（TOC）
 */
function MarkdownInner({
  accentColor,
  className,
  md,
  showToc = true,
}: {
  accentColor?: string
  className?: string
  md: string
  showToc?: boolean
}) {
  const theme = useMarkdownTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { copy, onMouseUp, position, visible } = useSelectionPopup(containerRef)
  let style: React.CSSProperties | undefined
  if (accentColor) {
    const rgb = hexToRgb(accentColor)
    if (rgb) {
      const vars: Record<string, string> = {
        '--primary-color': accentColor,
        '--primary-color-rgb': `${rgb.r}, ${rgb.g}, ${rgb.b}`,
      }
      style = vars as unknown as React.CSSProperties
    }
  }
  return (
    <div className={clsx(showToc ? 'relative lg:grid lg:grid-cols-[1fr_280px] lg:gap-8' : 'relative', className)}>
      <div ref={containerRef} onMouseUp={onMouseUp} className={clsx(theme.container)} style={style}>
        {compiler(md, {
          disableParsingRawHTML: true,
          overrides: {
            a: Anchor,
            blockquote: Blockquote,
            code: CodeInline,
            del: Del,
            em: Em,
            h1: H1,
            h2: H2,
            h3: H3,
            h4: H4,
            h5: H5,
            h6: H6,
            hr: Hr,
            img: Image,
            li: Li,
            ol: Ol,
            p: Paragraph,
            pre: CodeBlock,
            strong: Strong,
            table: Table,
            tbody: Tbody,
            td: Td,
            th: Th,
            thead: Thead,
            tr: Tr,
            ul: Ul,
          },
        })}
        <SelectionPopup visible={visible} position={position} onCopy={copy} />
      </div>
      {showToc ? (
        <div className="hidden lg:block">
          <Toc containerRef={containerRef} />
        </div>
      ) : null}
    </div>
  )
}

/**
 * 外层 Markdown 组件：提供主题上下文并包裹编译渲染
 * - `value` 优先；若未传入则回退到 `children`
 * - 支持传入自定义主题 `MarkdownTheme`，否则使用默认主题
 * - 使用 ErrorBoundary 捕获渲染错误，防止异常 Markdown 导致崩溃
 */
export function Markdown({
  accentColor,
  catppuccinTheme,
  children,
  className,
  showToc = true,
  theme,
  value,
}: MarkdownProps): ReactNode {
  const md = value ?? children ?? ''
  return (
    <MarkdownThemeProvider catppuccinTheme={catppuccinTheme} theme={theme}>
      <MarkdownErrorBoundary>
        <MarkdownInner accentColor={accentColor} className={className} md={md} showToc={showToc} />
      </MarkdownErrorBoundary>
    </MarkdownThemeProvider>
  )
}
