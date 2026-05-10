import type { SiteConfigRecord } from './repository'
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { SiteConfigRepository } from './repository'
import { SiteConfigService } from './service'

function createSiteConfigRecord(overrides: Partial<SiteConfigRecord> = {}): SiteConfigRecord {
  return {
    id: 'default',
    title: 'XDD Zone',
    subtitle: null,
    description: null,
    logo: null,
    favicon: null,
    footerText: null,
    socialLinks: {},
    defaultSeoTitle: null,
    defaultSeoDescription: null,
    createdAt: new Date('2026-05-10T00:00:00.000Z'),
    updatedAt: new Date('2026-05-10T00:00:00.000Z'),
    ...overrides,
  }
}

describe('SiteConfigService', () => {
  afterEach(() => {
    spyOn(SiteConfigRepository, 'ensureDefault').mockRestore()
    spyOn(SiteConfigRepository, 'updateDefault').mockRestore()
  })

  it('get 应用默认配置初始化并序列化返回', async () => {
    const ensureDefaultSpy = spyOn(SiteConfigRepository, 'ensureDefault').mockResolvedValue(createSiteConfigRecord())

    const result = await SiteConfigService.get()

    expect(ensureDefaultSpy).toHaveBeenCalledWith({
      title: 'XDD Zone',
    })
    expect(result).toEqual({
      id: 'default',
      title: 'XDD Zone',
      subtitle: null,
      description: null,
      logo: null,
      favicon: null,
      footerText: null,
      socialLinks: {},
      defaultSeoTitle: null,
      defaultSeoDescription: null,
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    })
  })

  it('update 应更新默认配置并序列化返回', async () => {
    const updateData = {
      title: 'New Site',
      logo: 'https://example.com/logo.png',
      socialLinks: {
        github: 'https://github.com/xdd-zone',
      },
    }
    const updateDefaultSpy = spyOn(SiteConfigRepository, 'updateDefault').mockResolvedValue(
      createSiteConfigRecord({
        title: updateData.title,
        logo: updateData.logo,
        socialLinks: updateData.socialLinks,
        updatedAt: new Date('2026-05-10T01:00:00.000Z'),
      }),
    )

    const result = await SiteConfigService.update(updateData)

    expect(updateDefaultSpy).toHaveBeenCalledWith(updateData, {
      title: 'XDD Zone',
    })
    expect(result.title).toBe(updateData.title)
    expect(result.logo).toBe(updateData.logo)
    expect(result.socialLinks).toEqual(updateData.socialLinks)
    expect(result.updatedAt).toBe('2026-05-10T01:00:00.000Z')
  })
})
