import type { MenuProps } from 'antd'

import { useFifaAuthMeQuery, useSignOutMutation } from '@fifa/api/auth'
import { useNavigate } from '@tanstack/react-router'
import { App, Avatar, Dropdown } from 'antd'
import { LogOut } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

function getAvatarInitial(displayName?: string) {
  const trimmedName = displayName?.trim()

  if (!trimmedName) {
    return 'F'
  }

  return trimmedName.slice(0, 1).toUpperCase()
}

export function AccountMenuButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const authMeQuery = useFifaAuthMeQuery()
  const signOutMutation = useSignOutMutation()
  const user = authMeQuery.data?.user
  const displayName = user?.displayName ?? t('auth.currentAccount')

  const menuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'account',
        disabled: true,
        label: (
          <div className="min-w-36 px-1 py-0.5">
            <div className="text-fg text-sm font-medium">{displayName}</div>
            <div className="text-fg-muted mt-0.5 text-xs">{t('auth.currentAccount')}</div>
          </div>
        ),
      },
      {
        type: 'divider',
      },
      {
        key: 'sign-out',
        danger: true,
        icon: <LogOut size={14} />,
        label: t('auth.signOut'),
      },
    ],
    [displayName, t],
  )

  const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key !== 'sign-out') {
      return
    }

    try {
      await signOutMutation.mutateAsync()
      message.success(t('auth.signOutSuccess'))
      await navigate({ replace: true, to: '/login' as never })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.signOutFailed')
      message.error(errorMessage)
    }
  }

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: menuItems,
        onClick: handleMenuClick,
      }}
    >
      <button
        type="button"
        aria-label={t('auth.accountMenu')}
        className="hover:border-primary/60 focus-visible:border-primary focus-visible:ring-primary/20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-surface-muted transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Avatar size={30} src={user?.avatarUrl ?? undefined} className="bg-primary text-surface text-sm font-semibold">
          {getAvatarInitial(user?.displayName)}
        </Avatar>
      </button>
    </Dropdown>
  )
}
