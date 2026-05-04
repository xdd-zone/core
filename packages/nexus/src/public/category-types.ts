import { PostPermissions } from './permissions'

export const CATEGORY_MANAGE_PERMISSIONS = [PostPermissions.READ_ALL, PostPermissions.WRITE_ALL] as const

export type {
  Category,
  CategoryIdParams,
  CategoryList,
  CategoryListQuery,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '../modules/category/model'
