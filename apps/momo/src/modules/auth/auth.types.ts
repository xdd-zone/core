export type ApplicationCode = 'fifa' | 'bobo'
export type AuthProvider = 'password' | 'github' | 'google'
export type RoleCode = 'owner' | 'visitor'

export interface ActiveRoleBinding {
  roleCode: RoleCode
}

export interface AuthUserView {
  avatarUrl: string | null
  displayName: string
  id: string
}
