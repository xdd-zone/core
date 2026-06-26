export type ApplicationCode = 'fifa' | 'bobo'
export type AuthProvider = 'password' | 'github' | 'google'
export const CONTENT_PERMISSION_CODES = [
  'content.post.read',
  'content.post.create',
  'content.post.edit',
  'content.post.publish',
  'content.asset.read',
  'content.asset.upload',
  'content.asset.edit',
  'content.asset.delete',
  'content.preview.generate',
] as const

export type ContentPermissionCode = (typeof CONTENT_PERMISSION_CODES)[number]
export type RoleCode = 'owner' | 'visitor'

export interface ActiveRoleBinding {
  roleCode: RoleCode
}

export interface AuthUserView {
  avatarUrl: string | null
  displayName: string
  id: string
}
