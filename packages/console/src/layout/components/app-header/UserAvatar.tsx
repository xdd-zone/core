import type { MenuProps } from 'antd'
import { useAuthStore, useLogoutMutation } from '@console/modules/auth'

import { useTabBarStore } from '@console/stores'
import { useNavigate } from '@tanstack/react-router'
import { Avatar, Dropdown } from 'antd'

import { KeyRound, LogOut, User, UserCog } from 'lucide-react'
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

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    resetTabs()
    await navigate({ replace: true, to: '/login' })
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
    {
      icon: <UserCog size={20} />,
      key: 'profile',
      label: t('menu.myProfile'),
      onClick: () => {
        void navigate({ to: '/profile' })
      },
    },
    {
      icon: <KeyRound size={20} />,
      key: 'my-access',
      label: t('menu.myAccess'),
      onClick: () => {
        void navigate({ to: '/my-access' })
      },
    },
    {
      type: 'divider',
    },
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
