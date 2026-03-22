import type { MenuProps } from 'antd'

import { Avatar, Dropdown } from 'antd'
import { LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { useAuthStore } from '@/modules/auth'
import { useTabBarStore } from '@/stores'

/**
 * 用户头像组件 (简化版)
 */
export function UserAvatar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const resetTabs = useTabBarStore((state) => state.reset)

  const handleLogout = async () => {
    await logout()
    resetTabs()
    navigate('/login', { replace: true })
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
