import { getPublicWritingData } from '@/lib/content/public-content'
import { getPublicProjectsOrFallback } from '@/lib/projects'
import { getSiteBaseUrl, getSiteShellData } from '@/lib/site'

export async function GET() {
  const baseUrl = getSiteBaseUrl()
  const [shell, writing, projectsResult] = await Promise.allSettled([
    getSiteShellData(),
    getPublicWritingData(),
    getPublicProjectsOrFallback(),
  ])
  const site = shell.status === 'fulfilled' ? shell.value.site : null
  const posts = writing.status === 'fulfilled' ? writing.value.posts : []
  const projects = projectsResult.status === 'fulfilled' ? projectsResult.value : []
  const title = site?.seo.title ?? '喜东东'
  const description = site?.seo.description ?? '喜东东的公开内容。'

  const items = [
    ...posts.map((post) => ({
      description: post.excerpt,
      href: `/writing/${post.slug}`,
      publishedAt: post.publishedAt ?? post.updatedAt,
      title: post.title,
    })),
    ...projects.map((project) => ({
      description: project.description,
      href: `/projects/${project.slug}`,
      publishedAt: project.publishedAt ?? project.updatedAt,
      title: project.title,
    })),
  ]
    .map((item) => {
      const href = new URL(item.href, baseUrl).toString()

      return [
        '<item>',
        `<title>${escapeXml(item.title)}</title>`,
        `<link>${escapeXml(href)}</link>`,
        `<guid>${escapeXml(href)}</guid>`,
        item.publishedAt ? `<pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>` : '',
        item.description ? `<description>${escapeXml(item.description)}</description>` : '',
        '</item>',
      ].join('')
    })
    .join('')

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(baseUrl)}</link>`,
    `<description>${escapeXml(description)}</description>`,
    items,
    '</channel>',
    '</rss>',
  ].join('')

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  })
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
