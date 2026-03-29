import { useUserRolesQuery } from '@console/modules/rbac'

import { useUserDetailQuery } from '@console/modules/user'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Badge, Button, Card, Descriptions, Empty, Space, Spin, Tag } from 'antd'
import dayjs from 'dayjs'

import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * 用户详情页面
 */
export function UserDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams({ from: '/protected/app-layout/users/$id' })

  const userQuery = useUserDetailQuery(id)
  const userRolesQuery = useUserRolesQuery(id)

  if (userQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!userQuery.data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span>{t('common.notFound')}</span>
      </div>
    )
  }

  const user = userQuery.data
  const roles = userRolesQuery.data || []

  const statusMap: Record<string, { color: string; text: string }> = {
    ACTIVE: { color: 'success', text: t('user.status.active') },
    INACTIVE: { color: 'default', text: t('user.status.inactive') },
    BANNED: { color: 'error', text: t('user.status.banned') },
  }
  const statusConfig = statusMap[user.status] || { color: 'default', text: user.status }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <Button icon={<ArrowLeft className="size-4" />} onClick={() => void navigate({ to: '/users' })}>
                {t('common.back')}
              </Button>
              <div className="mt-4 flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
                    {t('user.detail.eyebrow')}
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight">{user.name}</h1>
                  <p className="text-fg-muted mt-2 text-sm">{t('user.detail.description')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                    <Tag>{user.username || t('user.detail.noUsername')}</Tag>
                    <Tag>{user.email || t('user.detail.noEmail')}</Tag>
                  </div>
                </div>
              </div>
            </div>

            <Space wrap>
              <Button onClick={() => void navigate({ to: '/users/$id/access', params: { id } })}>
                {t('access.manage.title')}
              </Button>
              <Button type="primary" onClick={() => void navigate({ to: '/users/$id/edit', params: { id } })}>
                {t('common.edit')}
              </Button>
            </Space>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-fg-muted">
            <span>{t('user.columns.lastLogin')} {user.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : '-'}</span>
            <span>{t('user.columns.createdAt')} {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm')}</span>
            <span>{t('user.detail.roles')} {roles.length}</span>
            <span>{t('user.columns.updatedAt')} {dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <Card title={t('user.detail.title')}>
          <Descriptions column={2}>
            <Descriptions.Item label={t('user.columns.username')}>{user.username || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.name')}>{user.name}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.email')}>{user.email || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.phone')}>{user.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.status')}>
              <Badge status={statusConfig.color as 'success' | 'default' | 'error'} text={statusConfig.text} />
            </Descriptions.Item>
            <Descriptions.Item label={t('user.columns.introduce')}>{user.introduce || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.lastLogin')}>
              {user.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('user.columns.lastLoginIp')}>{user.lastLoginIp || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.createdAt')}>
              {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={t('user.columns.updatedAt')}>
              {dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <div className="flex flex-col gap-5">
          <Card
            title={t('user.detail.roles')}
            extra={
              <span className="text-fg-muted text-sm">{t('access.manage.roleCount', { count: roles.length })}</span>
            }
            loading={userRolesQuery.isLoading}
          >
            {roles.length > 0 ? (
              <div className="flex flex-col divide-y divide-border-subtle">
                {roles.map((role) => (
                  <article key={role.roleId} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{role.roleDisplayName || role.roleName}</div>
                      <div className="text-fg-muted mt-1 text-sm">{role.roleName}</div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty description={t('user.detail.noRoles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
