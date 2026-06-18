import { foldGutter, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const MARKER_SIZE = 14

/**
 * 创建 Lucide 风格的折叠图标 DOM 元素。
 * open = true 时显示 ChevronDown（可折叠），open = false 时旋转为 ChevronRight（已折叠）。
 */
function createFoldMarker(open: boolean): HTMLElement {
  const wrapper = document.createElement('span')
  wrapper.className = 'cm-fifa-fold-marker'
  wrapper.setAttribute('aria-hidden', 'true')

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', String(MARKER_SIZE))
  svg.setAttribute('height', String(MARKER_SIZE))
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  // 始终用 ChevronDown 路径，通过 CSS rotate 区分展开/折叠
  polyline.setAttribute('points', '6 9 12 15 18 9')
  svg.appendChild(polyline)

  if (!open) {
    svg.style.transform = 'rotate(-90deg)'
  }

  wrapper.appendChild(svg)
  return wrapper
}

/**
 * 自定义 fold gutter，使用 Lucide 风格箭头图标。
 */
export function createFifaFoldGutter() {
  return foldGutter({
    markerDOM: createFoldMarker,
  })
}

/**
 * Fifa 编辑器的 CodeMirror 主题。
 * 颜色全部读取 Catppuccin CSS 变量，切换主题后编辑器同步变化。
 */
export function createFifaCodeMirrorTheme(isDark: boolean) {
  const editorTheme = EditorView.theme(
    {
      '&': {
        backgroundColor: 'color-mix(in srgb, var(--theme-base) 92%, var(--theme-base-muted))',
        color: 'var(--theme-text)',
      },

      '.cm-content': {
        caretColor: 'var(--theme-primary)',
        fontFamily: 'inherit',
      },

      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--theme-primary)',
      },

      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
      },

      '.cm-panels': {
        backgroundColor: 'var(--theme-base-muted)',
        color: 'var(--theme-text)',
      },

      '.cm-panels.cm-panels-top': {
        borderBottom: '1px solid color-mix(in srgb, var(--theme-surface-0) 60%, transparent)',
      },

      '.cm-panels.cm-panels-bottom': {
        borderTop: '1px solid color-mix(in srgb, var(--theme-surface-0) 60%, transparent)',
      },

      '.cm-searchMatch': {
        backgroundColor: 'color-mix(in srgb, var(--theme-yellow) 25%, transparent)',
        outline: '1px solid color-mix(in srgb, var(--theme-yellow) 40%, transparent)',
      },

      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: 'color-mix(in srgb, var(--theme-peach) 30%, transparent)',
      },

      '.cm-activeLine': {
        backgroundColor: 'color-mix(in srgb, var(--theme-surface-0) 18%, transparent)',
      },

      '.cm-selectionMatch': {
        backgroundColor: 'color-mix(in srgb, var(--theme-lavender) 15%, transparent)',
      },

      '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: 'color-mix(in srgb, var(--theme-surface-1) 50%, transparent)',
        outline: '1px solid color-mix(in srgb, var(--theme-surface-2) 50%, transparent)',
      },

      '.cm-gutters': {
        backgroundColor: 'color-mix(in srgb, var(--theme-base-muted) 45%, var(--theme-base))',
        color: 'var(--theme-text-subtle)',
        borderRight: '1px solid color-mix(in srgb, var(--theme-surface-0) 40%, transparent)',
      },

      '.cm-activeLineGutter': {
        backgroundColor: 'color-mix(in srgb, var(--theme-surface-0) 25%, transparent)',
        color: 'var(--theme-text)',
      },

      '.cm-foldPlaceholder': {
        backgroundColor: 'color-mix(in srgb, var(--theme-surface-0) 40%, transparent)',
        border: 'none',
        color: 'var(--theme-text-muted)',
      },

      // 折叠图标容器
      '.cm-foldGutter .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2px',
        cursor: 'pointer',
      },

      // Lucide 风格折叠箭头
      '.cm-fifa-fold-marker': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--theme-text-muted)',
        opacity: '0.55',
        transition: 'opacity 150ms ease, color 150ms ease',
      },

      '.cm-fifa-fold-marker svg': {
        transition: 'transform 150ms ease',
      },

      '.cm-foldGutter .cm-gutterElement:hover .cm-fifa-fold-marker': {
        color: 'var(--theme-primary)',
        opacity: '1',
      },

      '.cm-tooltip': {
        backgroundColor: 'var(--theme-base-muted)',
        border: '1px solid color-mix(in srgb, var(--theme-surface-0) 60%, transparent)',
        color: 'var(--theme-text)',
      },

      '.cm-tooltip .cm-tooltip-arrow::before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      },

      '.cm-tooltip .cm-tooltip-arrow::after': {
        borderTopColor: 'var(--theme-base-muted)',
        borderBottomColor: 'var(--theme-base-muted)',
      },

      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
          color: 'var(--theme-text)',
        },
      },

      '.cm-placeholder': {
        color: 'var(--theme-text-muted)',
        fontStyle: 'italic',
      },
    },
    { dark: isDark },
  )

  const highlightTheme = HighlightStyle.define([
    // 标题 / 关键字 — mauve
    { tag: tags.heading, color: 'var(--theme-mauve)', fontWeight: '600' },
    { tag: tags.keyword, color: 'var(--theme-mauve)' },

    // 链接 / 属性 / URL — blue
    { tag: tags.link, color: 'var(--theme-blue)', textDecoration: 'underline' },
    { tag: tags.url, color: 'var(--theme-blue)' },
    { tag: tags.attributeName, color: 'var(--theme-blue)' },

    // 字符串 — green
    { tag: tags.string, color: 'var(--theme-green)' },
    { tag: tags.attributeValue, color: 'var(--theme-green)' },

    // 数字 / 变量 — peach
    { tag: tags.number, color: 'var(--theme-peach)' },
    { tag: tags.variableName, color: 'var(--theme-peach)' },
    { tag: tags.bool, color: 'var(--theme-peach)' },

    // 注释 — text-subtle
    { tag: tags.comment, color: 'var(--theme-text-subtle)', fontStyle: 'italic' },
    { tag: tags.lineComment, color: 'var(--theme-text-subtle)', fontStyle: 'italic' },
    { tag: tags.blockComment, color: 'var(--theme-text-subtle)', fontStyle: 'italic' },

    // 标签名 — pink
    { tag: tags.tagName, color: 'var(--theme-pink)' },

    // 操作符和标点 — text-muted
    { tag: tags.operator, color: 'var(--theme-text-muted)' },
    { tag: tags.punctuation, color: 'var(--theme-text-muted)' },
    { tag: tags.bracket, color: 'var(--theme-text-muted)' },
    { tag: tags.angleBracket, color: 'var(--theme-text-muted)' },

    // 强调 / 加粗 — flamingo / rosewater
    { tag: tags.emphasis, color: 'var(--theme-flamingo)', fontStyle: 'italic' },
    { tag: tags.strong, color: 'var(--theme-rosewater)', fontWeight: '600' },

    // 引用 — lavender
    { tag: tags.quote, color: 'var(--theme-lavender)' },

    // 元信息（frontmatter 等）— teal
    { tag: tags.meta, color: 'var(--theme-teal)' },
    { tag: tags.processingInstruction, color: 'var(--theme-teal)' },

    // 类型名 — yellow
    { tag: tags.typeName, color: 'var(--theme-yellow)' },
    { tag: tags.className, color: 'var(--theme-yellow)' },

    // 删除线 / 插入 — red / green
    { tag: tags.strikethrough, color: 'var(--theme-red)', textDecoration: 'line-through' },
    { tag: tags.inserted, color: 'var(--theme-green)' },
    { tag: tags.deleted, color: 'var(--theme-red)' },

    // 代码 / monospace — sapphire
    { tag: tags.monospace, color: 'var(--theme-sapphire)' },

    // 函数名 — sky
    { tag: tags.function(tags.variableName), color: 'var(--theme-sky)' },
    { tag: tags.definition(tags.variableName), color: 'var(--theme-sky)' },
  ])

  return [editorTheme, syntaxHighlighting(highlightTheme)]
}
