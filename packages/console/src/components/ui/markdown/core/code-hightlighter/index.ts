import type { CodeToHastOptions, HighlighterCore, LanguageInput } from 'shiki/core'
import type { BundledLanguage } from 'shiki/langs'
import type { BundledTheme } from 'shiki/themes'

import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers'
import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import catppuccinFrappe from 'shiki/themes/catppuccin-frappe.mjs'
import catppuccinLatte from 'shiki/themes/catppuccin-latte.mjs'
import catppuccinMacchiato from 'shiki/themes/catppuccin-macchiato.mjs'
import catppuccinMocha from 'shiki/themes/catppuccin-mocha.mjs'

export * from './helpers'

/**
 * Catppuccin 主题到 Shiki 主题的映射
 */
export const CATPUCCIN_TO_SHIKI_THEME: Record<string, string> = {
  frappe: 'catppuccin-frappe',
  latte: 'catppuccin-latte',
  macchiato: 'catppuccin-macchiato',
  mocha: 'catppuccin-mocha',
}

/**
 * Markdown 代码块支持的基础语言别名
 */
const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  bash: 'shellscript',
  cjs: 'javascript',
  js: 'javascript',
  json5: 'json',
  jsonc: 'json',
  md: 'markdown',
  mts: 'typescript',
  shell: 'shellscript',
  sh: 'shellscript',
  text: 'text',
  ts: 'typescript',
  txt: 'text',
  xml: 'html',
  yml: 'yaml',
  zsh: 'shellscript',
}

type SupportedLanguage
  = | 'css'
    | 'html'
    | 'javascript'
    | 'json'
    | 'jsx'
    | 'markdown'
    | 'shellscript'
    | 'text'
    | 'tsx'
    | 'typescript'
    | 'yaml'

interface ShikiLanguageModule {
  default: LanguageInput
}

/**
 * 控制浏览器端实际打包的高亮语言范围，避免生成大量冷门语言 chunk
 */
const LANGUAGE_LOADERS: Record<Exclude<SupportedLanguage, 'text'>, () => Promise<ShikiLanguageModule>> = {
  css: () => import('@shikijs/langs/css'),
  html: () => import('@shikijs/langs/html'),
  javascript: () => import('@shikijs/langs/javascript'),
  json: () => import('@shikijs/langs/json'),
  jsx: () => import('@shikijs/langs/jsx'),
  markdown: () => import('@shikijs/langs/markdown'),
  shellscript: () => import('@shikijs/langs/shellscript'),
  tsx: () => import('@shikijs/langs/tsx'),
  typescript: () => import('@shikijs/langs/typescript'),
  yaml: () => import('@shikijs/langs/yaml'),
}

/**
 * 将语言标识收敛到白名单范围：
 * - 常见别名归一化到统一语言名
 * - 不支持的语言回退为 text
 */
function normalizeLanguage (lang: string): SupportedLanguage {
  const normalizedLang = lang.trim().toLowerCase()

  if (!normalizedLang) return 'text'

  if (normalizedLang in LANGUAGE_LOADERS || normalizedLang === 'text') {
    return normalizedLang as SupportedLanguage
  }

  return LANGUAGE_ALIASES[normalizedLang] ?? 'text'
}

/**
 * 在浏览器端创建 Shiki 高亮器核心：
 * - SSR 环境（无 window）返回 null
 * - 使用 JavaScript 正则引擎
 * - 预加载所有 4 个 Catppuccin 主题
 */
let singleton: HighlighterCore | null = null

export function createClientHighlighter (): HighlighterCore | null {
  if (typeof window === 'undefined') return null
  const key = '__shiki_highlighter_singleton__'
  const store = globalThis as unknown as Record<string, unknown>
  const cached = store[key] as unknown as HighlighterCore | undefined
  if (cached) return cached
  if (singleton) return singleton
  const engine = createJavaScriptRegexEngine()
  singleton = createHighlighterCoreSync({
    engine,
    langs: [],
    themes: [catppuccinMocha, catppuccinLatte, catppuccinFrappe, catppuccinMacchiato],
  })
  store[key] = singleton
  return singleton
}

/**
 * 确保指定语言已加载到高亮器：
 * - 仅加载白名单中的基础语言
 * - 未支持的语言回退为 text，不额外加载语言包
 */
export async function ensureLanguageLoaded (highlighter: HighlighterCore, lang: string) {
  const normalizedLang = normalizeLanguage(lang)

  if (normalizedLang === 'text') return

  const loader = LANGUAGE_LOADERS[normalizedLang]
  if (!loader) return

  const loaded = highlighter.getLoadedLanguages().includes(normalizedLang)
  if (!loaded) {
    const mod = await loader()
    await highlighter.loadLanguage(mod.default)
  }
}

/**
 * 将代码转换为带有主题与标注的 HTML 字符串：
 * - 支持根据 Catppuccin 主题 ID 选择对应的高亮主题
 * - 支持 diff、高亮、单词高亮、行高亮等标注
 */
export function codeToHtml (highlighter: HighlighterCore, { attrs, code, lang, themeId }: { attrs?: string; code: string; lang: string; themeId?: string }) {
  const shikiTheme = themeId ? (CATPUCCIN_TO_SHIKI_THEME[themeId] ?? 'catppuccin-latte') : 'catppuccin-latte'
  const normalizedLang = normalizeLanguage(lang)

  const common = {
    lang: normalizedLang,
    meta: { __raw: attrs ?? '' },
    transformers: [
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationWordHighlight(),
      transformerMetaHighlight(),
    ],
  } satisfies Pick<CodeToHastOptions<BundledLanguage, BundledTheme>, 'lang' | 'meta' | 'transformers'>

  const options: CodeToHastOptions<BundledLanguage, BundledTheme> = {
    ...common,
    theme: shikiTheme,
  }

  return highlighter.codeToHtml(code, options)
}
