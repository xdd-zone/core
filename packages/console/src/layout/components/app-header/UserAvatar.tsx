import type { MenuProps } from 'antd'
import { canAccessConsolePath, createPermissionKeySet } from '@console/app/access/access-control'
import { useAuthStore, useLogoutMutation } from '@console/modules/auth'
import { useCurrentUserPermissionsQuery } from '@console/modules/rbac'

import { useTabBarStore } from '@console/stores'
import { useNavigate } from '@tanstack/react-router'
import { Avatar, Dropdown } from 'antd'

import { KeyRound, LogOut, User, UserCog } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 用户头像组件 (简化版)
 */
export function UserAvatar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logoutMutation = useLogoutMutation()
  const user = useAuthStore((state) => state.user)
  const resetTabs = useTabBarStore((state) => state.reset)
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()
  const permissionKeys = useMemo(
    () => createPermissionKeySet(currentUserPermissionsQuery.data?.permissions),
    [currentUserPermissionsQuery.data?.permissions],
  )

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    resetTabs()
    await navigate({ replace: true, to: '/login' })
  }

  const shortcutItems: MenuProps['items'] = []

  if (canAccessConsolePath('/profile', permissionKeys)) {
    shortcutItems.push({
      icon: <UserCog size={20} />,
      key: 'profile',
      label: t('menu.myProfile'),
      onClick: () => {
        void navigate({ to: '/profile' })
      },
    })
  }

  if (canAccessConsolePath('/my-access', permissionKeys)) {
    shortcutItems.push({
      icon: <KeyRound size={20} />,
      key: 'my-access',
      label: t('menu.myAccess'),
      onClick: () => {
        void navigate({ to: '/my-access' })
      },
    })
  }

  const menuItems: MenuProps['items'] = [
    {
      disabled: true,
      key: 'user-info',
      label: (
        <div className="py-2">
          <div className="text-cat font-medium">{user?.name || user?.email || 'Guest'}</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    ...shortcutItems,
    ...(shortcutItems.length > 0 ? [{ type: 'divider' as const }] : []),
    {
      danger: true,
      icon: <LogOut size={20} />,
      key: 'logout',
      label: t('user.logout'),
      onClick: () => {
        void handleLogout()
      },
    },
  ]

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow={{ pointAtCenter: true }} trigger={['click']}>
      <div className="guide-avatar flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors">
        <Avatar icon={<User />} />
      </div>
    </Dropdown>
  )
}
