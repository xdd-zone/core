import type { MetadataRoute } from 'next'

import { getPublicWritingData } from '@/lib/content/public-content'
import { getPublicProjects } from '@/lib/projects'
import { getSiteBaseUrl, getSiteShellData } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl()
  const [shell, writing, projects] = await Promise.allSettled([
    getSiteShellData(),
    getPublicWritingData(),
    getPublicProjects(),
  ])

  const now = new Date()
  const navigation = shell.status === 'fulfilled' ? shell.value.navigation : []
  const navEntries = navigation.map((item) => ({
    lastModified: now,
    url: new URL(item.href, baseUrl).toString(),
  }))
  const postEntries =
    writing.status === 'fulfilled'
      ? writing.value.posts.map((post) => ({
          lastModified: new Date(post.publishedAt ?? post.updatedAt),
          url: new URL(`/writing/${post.slug}`, baseUrl).toString(),
        }))
      : []
  const projectEntries =
    projects.status === 'fulfilled'
      ? projects.value.map((project) => ({
          lastModified: new Date(project.publishedAt ?? project.updatedAt),
          url: new URL(`/projects/${project.slug}`, baseUrl).toString(),
        }))
      : []

  return [
    {
      lastModified: now,
      url: baseUrl,
    },
    ...navEntries,
    ...postEntries,
    ...projectEntries,
  ]
}
