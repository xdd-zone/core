import { RbacRequestError, useAssignRoleMutation, useRemoveRoleMutation, useRoleListQuery, useUserPermissionsQuery, useUserRolesQuery } from '@console/modules/rbac'
import { useUserDetailQuery } from '@console/modules/user'

import { useNavigate, useParams } from '@tanstack/react-router'
import { App as AntdApp, Button, Card, Descriptions, Empty, Popconfirm, Select, Space, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
import { ArrowLeft, ShieldCheck, ShieldPlus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 用户访问管理页面。
 */
export function UserAccess() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const { id } = useParams({ from: '/protected/app-layout/users/$id/access' })

  const [selectedRoleId, setSelectedRoleId] = useState<string>()

  const userQuery = useUserDetailQuery(id)
  const userRolesQuery = useUserRolesQuery(id)
  const userPermissionsQuery = useUserPermissionsQuery(id)
  const roleListQuery = useRoleListQuery({ page: 1, pageSize: 100 })
  const assignRoleMutation = useAssignRoleMutation()
  const removeRoleMutation = useRemoveRoleMutation()

  const assignedRoleIds = useMemo(() => new Set((userRolesQuery.data ?? []).map((role) => role.roleId)), [userRolesQuery.data])

  const availableRoleOptions = useMemo(
    () =>
      (roleListQuery.data?.items ?? [])
        .filter((role) => !assignedRoleIds.has(role.id))
        .map((role) => ({
          label: role.displayName || role.name,
          value: role.id,
        })),
    [assignedRoleIds, roleListQuery.data?.items],
  )

  const refreshAccessData = async () => {
    await Promise.all([userRolesQuery.refetch(), userPermissionsQuery.refetch()])
  }

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      message.warning(t('access.manage.roleRequired'))
      return
    }

    try {
      await assignRoleMutation.mutateAsync({ roleId: selectedRoleId, userId: id })
      await refreshAccessData()
      setSelectedRoleId(undefined)
      message.success(t('access.manage.assignSuccess'))
    } catch (error) {
      const errorMessage = error instanceof RbacRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  const handleRemoveRole = async (roleId: string) => {
    try {
      await removeRoleMutation.mutateAsync({ roleId, userId: id })
      await refreshAccessData()
      message.success(t('access.manage.removeSuccess'))
    } catch (error) {
      const errorMessage = error instanceof RbacRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  if (userQuery.isLoading || userRolesQuery.isLoading || userPermissionsQuery.isLoading) {
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
  const roles = userRolesQuery.data ?? []
  const permissions = userPermissionsQuery.data?.permissions ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button icon={<ArrowLeft className="size-4" />} onClick={() => void navigate({ to: '/users/$id', params: { id } })}>
          {t('common.back')}
        </Button>
        <Space>
          <Button onClick={() => void navigate({ to: '/users/$id/edit', params: { id } })}>{t('common.edit')}</Button>
        </Space>
      </div>

      <Card title={t('access.manage.userSummaryTitle')}>
        <Descriptions column={2}>
          <Descriptions.Item label={t('user.columns.name')}>{user.name}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.username')}>{user.username || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.email')}>{user.email || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('user.columns.status')}>
            <Tag color={user.status === 'ACTIVE' ? 'success' : user.status === 'BANNED' ? 'error' : 'default'}>
              {t(`user.status.${user.status.toLowerCase()}`)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('user.columns.lastLogin')}>
            {user.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('user.columns.createdAt')}>
            {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card
          title={t('access.manage.rolesTitle')}
          extra={<span className="text-fg-muted text-sm">{t('access.manage.roleCount', { count: roles.length })}</span>}
        >
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-subtle/35 p-4 md:flex-row md:items-center">
            <Select
              value={selectedRoleId}
              onChange={setSelectedRoleId}
              options={availableRoleOptions}
              placeholder={t('access.manage.roleSelectPlaceholder')}
              className="min-w-0 flex-1"
              loading={roleListQuery.isLoading}
            />
            <Button
              type="primary"
              icon={<ShieldPlus className="size-4" />}
              onClick={() => void handleAssignRole()}
              loading={assignRoleMutation.isPending}
            >
              {t('access.manage.assignAction')}
            </Button>
          </div>

          {roles.length > 0
            ? (
                <div className="flex flex-col divide-y divide-border-subtle">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{role.roleDisplayName || role.roleName}</div>
                        <div className="mt-1 flex flex-col gap-1 text-sm text-fg-muted">
                          <span>{role.roleName}</span>
                          <span>{t('access.manage.assignedAt', { value: dayjs(role.assignedAt).format('YYYY-MM-DD HH:mm') })}</span>
                        </div>
                      </div>
                      <Popconfirm
                        title={t('access.manage.removeConfirmTitle')}
                        description={t('access.manage.removeConfirmDescription')}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                        onConfirm={() => void handleRemoveRole(role.roleId)}
                      >
                        <Button danger type="text" icon={<Trash2 className="size-4" />} loading={removeRoleMutation.isPending}>
                          {t('access.manage.removeAction')}
                        </Button>
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              )
            : <Empty description={t('access.empty.roles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </Card>

        <Card
          title={t('access.manage.permissionsTitle')}
          extra={
            <span className="text-fg-muted text-sm">{t('access.manage.permissionCount', { count: permissions.length })}</span>
          }
        >
          {permissions.length > 0
            ? (
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <Tag key={permission} icon={<ShieldCheck className="size-3.5" />}>
                      {permission}
                    </Tag>
                  ))}
                </div>
              )
            : <Empty description={t('access.empty.permissions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </Card>
      </div>
    </div>
  )
}
