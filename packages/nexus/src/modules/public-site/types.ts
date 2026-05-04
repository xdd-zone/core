import type { Prisma } from '@nexus-prisma/generated/client'
import type {
  PUBLIC_SITE_CATEGORY_SELECT,
  PUBLIC_SITE_CONFIG_SELECT,
  PUBLIC_SITE_POST_DETAIL_SELECT,
  PUBLIC_SITE_POST_SUMMARY_SELECT,
} from './constants'

export type PublicSiteConfigData = Prisma.SiteConfigGetPayload<{
  select: typeof PUBLIC_SITE_CONFIG_SELECT
}>

export type PublicSiteCategoryData = Prisma.CategoryGetPayload<{
  select: typeof PUBLIC_SITE_CATEGORY_SELECT
}>

export type PublicSitePostSummaryData = Prisma.PostGetPayload<{
  select: typeof PUBLIC_SITE_POST_SUMMARY_SELECT
}>

export type PublicSitePostDetailData = Prisma.PostGetPayload<{
  select: typeof PUBLIC_SITE_POST_DETAIL_SELECT
}>

export type PublicSitePostWhereInput = Prisma.PostWhereInput
export type PublicSiteCategoryWhereInput = Prisma.CategoryWhereInput
