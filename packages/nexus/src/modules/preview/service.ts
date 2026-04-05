import type { PreviewHeading, PreviewMarkdownBody, PreviewMarkdownResponse } from './model'
import MarkdownIt from 'markdown-it'
import { PreviewMarkdownResponseSchema } from './model'

const EXCERPT_MAX_LENGTH = 160

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

function createSlugFactory() {
  const headingIdCounts = new Map<string, number>()

  return (input: string) => {
    const baseSlug =
      input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u4E00-\u9FA5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'heading'

    const duplicateCount = headingIdCounts.get(baseSlug) ?? 0
    headingIdCounts.set(baseSlug, duplicateCount + 1)

    return duplicateCount === 0 ? baseSlug : `${baseSlug}-${duplicateCount + 1}`
  }
}

function truncateExcerpt(text: string) {
  if (text.length <= EXCERPT_MAX_LENGTH) {
    return text
  }

  return text.slice(0, EXCERPT_MAX_LENGTH).trimEnd()
}

function renderMarkdown(markdownText: string) {
  const createSlug = createSlugFactory()
  const headingIndexByLine = new Map<number, PreviewHeading>()

  const tokens = markdown.parse(markdownText, {})

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token?.type !== 'heading_open') {
      continue
    }

    const inlineToken = tokens[index + 1]
    if (!inlineToken || inlineToken.type !== 'inline') {
      continue
    }

    const text = inlineToken.content.trim()
    if (!text) {
      continue
    }

    const level = Number(token.tag.replace('h', ''))
    const slug = createSlug(text)

    token.attrSet('id', slug)

    if (typeof token.map?.[0] === 'number') {
      headingIndexByLine.set(token.map[0], {
        level,
        text,
        slug,
      })
    }
  }

  return {
    html: markdown.renderer.render(tokens, markdown.options, {}),
    toc: Array.from(headingIndexByLine.values()),
    tokens,
  }
}

function extractFirstParagraph(markdownText: string) {
  const tokens = markdown.parse(markdownText, {})

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token?.type !== 'paragraph_open') {
      continue
    }

    const inlineToken = tokens[index + 1]
    if (!inlineToken || inlineToken.type !== 'inline') {
      continue
    }

    const text = inlineToken.content.replace(/\s+/g, ' ').trim()
    if (text) {
      return text
    }
  }

  return ''
}

function resolveExcerpt(body: PreviewMarkdownBody) {
  if (body.excerpt !== undefined) {
    return body.excerpt
  }

  const firstParagraph = extractFirstParagraph(body.markdown)
  return firstParagraph ? truncateExcerpt(firstParagraph) : null
}

/**
 * Markdown 预览服务。
 */
export class PreviewService {
  /**
   * 生成 Markdown 预览结果。
   */
  static renderMarkdown(body: PreviewMarkdownBody): PreviewMarkdownResponse {
    const rendered = renderMarkdown(body.markdown)

    return PreviewMarkdownResponseSchema.parse({
      html: rendered.html,
      toc: rendered.toc,
      excerpt: resolveExcerpt(body),
    })
  }
}
