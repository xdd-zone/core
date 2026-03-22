import type { HighlighterCore, LanguageInput } from 'shiki'
import type { BundledLanguage } from 'shiki/langs'
import type { BundledTheme } from 'shiki/themes'
import type { CodeToHastOptions } from 'shiki/types.mjs'

import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers'
import { createHighlighterCoreSync, createJavaScriptRegexEngine } from 'shiki'
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

let langLoaderCache: Record<string, LanguageInput> | null = null

/**
 * 获取语言加载器（带缓存）：
 * - 首次调用时缓存整个 bundledLanguages 模块
 * - 后续调用直接从缓存读取，避免重复导入
 */
async function getLangLoader (lang: string) {
  if (!langLoaderCache) {
    const { bundledLanguages } = await import('shiki/langs')
    langLoaderCache = bundledLanguages as Record<string, LanguageInput>
  }
  return langLoaderCache[lang]
}

/**
 * 确保指定语言已加载到高亮器：
 * - 从缓存的 bundledLanguages 获取语言加载器
 * - 若语言已加载或不存在对应 loader，则跳过
 */
export async function ensureLanguageLoaded (highlighter: HighlighterCore, lang: string) {
  const loader = await getLangLoader(lang)
  if (!loader) return
  const loaded = highlighter.getLoadedLanguages().includes(lang)
  if (!loaded) {
    const mod = typeof loader === 'function' ? await loader() : loader
    await highlighter.loadLanguage(mod as LanguageInput)
  }
}

/**
 * 将代码转换为带有主题与标注的 HTML 字符串：
 * - 支持根据 Catppuccin 主题 ID 选择对应的高亮主题
 * - 支持 diff、高亮、单词高亮、行高亮等标注
 */
export function codeToHtml (highlighter: HighlighterCore,  { attrs, code, lang, themeId }: { attrs?: string; code: string; lang: string; themeId?: string }) {
  const shikiTheme = themeId ? (CATPUCCIN_TO_SHIKI_THEME[themeId] ?? 'catppuccin-latte') : 'catppuccin-latte'

  const common = {
    lang,
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
