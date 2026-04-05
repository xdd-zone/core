import type { SiteConfig, UpdateSiteConfigBody } from './model'
import { prisma } from '@nexus/infra/database'
import { Prisma } from '@nexus/infra/database/prisma/generated/client'

const SITE_CONFIG_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  description: true,
  logo: true,
  favicon: true,
  footerText: true,
  socialLinks: true,
  defaultSeoTitle: true,
  defaultSeoDescription: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SiteConfigSelect

export type SiteConfigRecord = Prisma.SiteConfigGetPayload<{
  select: typeof SITE_CONFIG_SELECT
}>

function toDatabaseJsonValue(value: Prisma.JsonValue | null | undefined) {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return Prisma.JsonNull
  }

  return value as Prisma.InputJsonValue
}

function toSiteConfigWriteData(data: UpdateSiteConfigBody) {
  return {
    ...data,
    socialLinks: toDatabaseJsonValue(data.socialLinks),
  }
}

/**
 * 站点配置仓储类。
 */
export class SiteConfigRepository {
  /**
   * 读取默认站点配置。
   */
  static async findDefault() {
    return prisma.siteConfig.findUnique({
      where: { id: 'default' },
      select: SITE_CONFIG_SELECT,
    })
  }

  /**
   * 读取默认站点配置，不存在时自动初始化。
   */
  static async ensureDefault(data: Pick<SiteConfig, 'title'>) {
    return prisma.siteConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        title: data.title,
      },
      update: {},
      select: SITE_CONFIG_SELECT,
    })
  }

  /**
   * 更新默认站点配置。
   */
  static async updateDefault(data: UpdateSiteConfigBody, defaultData: Pick<SiteConfig, 'title'>) {
    const writeData = toSiteConfigWriteData(data)

    return prisma.siteConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...writeData,
        title: data.title ?? defaultData.title,
      },
      update: writeData,
      select: SITE_CONFIG_SELECT,
    })
  }

  /**
   * 还原默认站点配置。
   */
  static async restoreDefault(data: SiteConfigRecord) {
    return prisma.siteConfig.upsert({
      where: { id: 'default' },
      create: {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        logo: data.logo,
        favicon: data.favicon,
        footerText: data.footerText,
        socialLinks: toDatabaseJsonValue(data.socialLinks),
        defaultSeoTitle: data.defaultSeoTitle,
        defaultSeoDescription: data.defaultSeoDescription,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        logo: data.logo,
        favicon: data.favicon,
        footerText: data.footerText,
        socialLinks: toDatabaseJsonValue(data.socialLinks),
        defaultSeoTitle: data.defaultSeoTitle,
        defaultSeoDescription: data.defaultSeoDescription,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      select: SITE_CONFIG_SELECT,
    })
  }

  /**
   * 删除默认站点配置。
   */
  static async deleteDefault() {
    return prisma.siteConfig.deleteMany({
      where: { id: 'default' },
    })
  }
}
