import { Permissions } from './permissions'

export const CATEGORY_MANAGE_PERMISSIONS = [Permissions.POST.READ_ALL, Permissions.POST.WRITE_ALL] as const

export type {
  Category,
  CategoryIdParams,
  CategoryList,
  CategoryListQuery,
  CreateCategoryBody,
  PublicCategory,
  PublicCategoryList,
  PublicCategoryListQuery,
  UpdateCategoryBody,
} from '../modules/category/model'
