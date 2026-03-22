import type { FC, JSX } from 'react'

import { clsx } from 'clsx'
import { Check, Copy, FileCode } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SiGnubash, SiGo, SiJavascript, SiJson, SiPython, SiRust, SiTypescript } from 'react-icons/si'

import { useSettingStore } from '@/stores'

import {
  codeToHtml,
  createClientHighlighter,
  ensureLanguageLoaded,
  getLanguageFromClassName,
  normalizeCode,
} from '../core'
import { useMarkdownTheme } from '../theme/useTheme'

type PreProps = JSX.IntrinsicElements['pre']

function useHighlighter () {
  return useMemo(() => createClientHighlighter(), [])
}

const LangIcon: FC<{ lang: string }> = ({ lang }) => {
  const l = lang.toLowerCase()
  if (['ts', 'tsx', 'typescript'].includes(l)) return <SiTypescript size={12} />
  if (['js', 'jsx', 'javascript'].includes(l)) return <SiJavascript size={12} />
  if (['py', 'python'].includes(l)) return <SiPython size={12} />
  if (['go', 'golang'].includes(l)) return <SiGo size={12} />
  if (['rs', 'rust'].includes(l)) return <SiRust size={12} />
  if (['bash', 'sh', 'shell'].includes(l)) return <SiGnubash size={12} />
  if (['json'].includes(l)) return <SiJson size={12} />
  return <FileCode size={12} />
}

export const CodeBlock: FC<PreProps> = ({ children, className }) => {
  const highlighter = useHighlighter()
  const [html, setHtml] = useState<string>('')
  const { catppuccinTheme } = useSettingStore()
  const theme = useMarkdownTheme()
  const [copied, setCopied] = useState<boolean>(false)

  const { code, language } = useMemo(() => {
    const child = children
    if (!child || typeof child !== 'object') return { code: '', language: 'text' }
    if ('props' in child) {
      const c = child.props as { children?: unknown; className?: string }
      const raw = typeof c.children === 'string' ? c.children : Array.isArray(c.children) ? c.children.join('') : ''
      return { code: normalizeCode(raw), language: getLanguageFromClassName(c.className ?? '') }
    }
    return { code: '', language: 'text' }
  }, [children])

  useEffect(() => {
    let disposed = false
    const run = async () => {
      if (!highlighter) return
      const lang = language || 'text'
      try {
        await ensureLanguageLoaded(highlighter, lang)
      } catch (error) {
        console.warn('语言加载失败:', lang, error)
      }
      const htmlText = codeToHtml(highlighter, { code, lang, themeId: catppuccinTheme })
      if (!disposed) setHtml(htmlText)
    }
    run()
    return () => {
      disposed = true
    }
  }, [code, highlighter, language, catppuccinTheme])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <div className={clsx(theme.code.container, 'markdown-code-with-lines', className)}>
      {html ? (
        <div className="p-3 pb-8 backdrop-blur-sm">
          <div className="w-full overflow-x-auto pb-4" dangerouslySetInnerHTML={{ __html: html }} />

          <button
            type="button"
            aria-label={copied ? 'Copied' : 'Copy'}
            onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true))}
            className={clsx(theme.code.copyButton)}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      ) : (
        <pre className={clsx(theme.code.pre)}>
          <code>{code}</code>

          <button
            type="button"
            aria-label={copied ? 'Copied' : 'Copy'}
            onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true))}
            className={clsx(theme.code.copyButton)}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </pre>
      )}

      <div
        className={clsx(
          'code-lang-badge absolute right-2 bottom-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs',
          'text-fg',
        )}
      >
        <LangIcon lang={language} />
      </div>
    </div>
  )
}
