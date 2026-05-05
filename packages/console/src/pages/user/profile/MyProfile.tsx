import type { SessionPayload } from '@console/modules/auth'
import type { CurrentUserRoles, PermissionSummary } from '@console/modules/rbac'
import type { UpdateMyPasswordBody } from '@console/modules/user'

import { PermissionSummaryList } from '@console/components/business'
import { ConsolePageHeader } from '@console/components/common/ConsolePageHeader'
import { useAuthStore } from '@console/modules/auth'
import { useCurrentUserPermissionsQuery, useCurrentUserRolesQuery } from '@console/modules/rbac'
import { useMyProfileQuery, useUpdateMeMutation, useUpdateMyPasswordMutation } from '@console/modules/user'
import { ARTICLE_PAGE_CLASSNAME } from '@console/pages/article/shared/page-layout'

import { useQueryClient } from '@tanstack/react-query'
import { App as AntdApp, Button, Card, Empty, Form, Input, Spin, Tabs, Tag } from 'antd'
import dayjs from 'dayjs'
import { KeyRound, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 我的资料页面。合并了个人资料编辑和权限查看。
 */
export function MyProfile() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<Record<string, string | null | undefined>>()
  const [passwordForm] = Form.useForm<UpdateMyPasswordBody & { confirmPassword: string }>()
  const [activeTab, setActiveTab] = useState('profile')

  const profileQuery = useMyProfileQuery()
  const updateMeMutation = useUpdateMeMutation()
  const updatePasswordMutation = useUpdateMyPasswordMutation()
  const currentUserRolesQuery = useCurrentUserRolesQuery()
  const currentUserPermissionsQuery = useCurrentUserPermissionsQuery()

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }

    form.setFieldsValue({
      email: profileQuery.data.email,
      image: profileQuery.data.image,
      introduce: profileQuery.data.introduce,
      name: profileQuery.data.name,
      phone: profileQuery.data.phone,
      username: profileQuery.data.username,
    })
  }, [form, profileQuery.data])

  const handleSubmit = async (values: Record<string, string | null | undefined>) => {
    try {
      const payload = {
        ...values,
        email: values.email || null,
        image: values.image || null,
        introduce: values.introduce || null,
        phone: values.phone || null,
        username: values.username || null,
      }
      const updatedProfile = await updateMeMutation.mutateAsync(payload)

      queryClient.setQueryData(['users', 'me'], updatedProfile)
      queryClient.setQueryData<SessionPayload | undefined>(['auth', 'session'], (session) => {
        return session && session.user ? { ...session, user: { ...session.user, ...updatedProfile } } : session
      })

      const authState = useAuthStore.getState()
      if (authState.isAuthenticated) {
        authState.setSessionPayload({
          isAuthenticated: authState.isAuthenticated,
          session: authState.session,
          user: updatedProfile,
        })
      }

      message.success(t('profile.messages.updateSuccess'))
    } catch (error) {
      const errorMessage = error instanceof Error && error.message ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  const handlePasswordSubmit = async (values: UpdateMyPasswordBody & { confirmPassword: string }) => {
    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword || undefined,
        newPassword: values.newPassword,
      })
      passwordForm.resetFields()
      message.success(t('profile.password.messages.updateSuccess'))
    } catch (error) {
      const errorMessage = error instanceof Error && error.message ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!profileQuery.data) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <span>{t('common.notFound')}</span>
      </div>
    )
  }

  const profile = profileQuery.data

  const summaryItems = [
    { label: t('user.columns.username'), value: profile.username || '-' },
    { label: t('user.columns.email'), value: profile.email || '-' },
    { label: t('user.columns.phone'), value: profile.phone || '-' },
    { label: t('user.columns.status'), value: t(`user.status.${profile.status.toLowerCase()}`) },
  ]

  const infoItems = [
    {
      label: t('user.columns.lastLogin'),
      value: profile.lastLogin ? dayjs(profile.lastLogin).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      label: t('user.columns.createdAt'),
      value: dayjs(profile.createdAt).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <ConsolePageHeader
        description={t('profile.summary.description')}
        summaryItems={summaryItems}
        title={t('menu.myProfile')}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'profile',
            label: t('profile.tabs.profile'),
            children: (
              <ProfileTab
                form={form}
                handlePasswordSubmit={handlePasswordSubmit}
                handleSubmit={handleSubmit}
                infoItems={infoItems}
                passwordForm={passwordForm}
                profile={profile}
                updateMeMutation={updateMeMutation}
                updatePasswordMutation={updatePasswordMutation}
              />
            ),
          },
          {
            key: 'access',
            label: t('profile.tabs.access'),
            children: (
              <AccessTab
                currentUserPermissionsQuery={currentUserPermissionsQuery}
                currentUserRolesQuery={currentUserRolesQuery}
              />
            ),
          },
        ]}
      />
    </div>
  )
}

function ProfileTab({
  form,
  handlePasswordSubmit,
  handleSubmit,
  infoItems,
  passwordForm,
  profile,
  updateMeMutation,
  updatePasswordMutation,
}: {
  form: ReturnType<typeof Form.useForm<Record<string, string | null | undefined>>>[0]
  handlePasswordSubmit: (values: UpdateMyPasswordBody & { confirmPassword: string }) => Promise<void>
  handleSubmit: (values: Record<string, string | null | undefined>) => Promise<void>
  infoItems: { label: string; value: string }[]
  passwordForm: ReturnType<typeof Form.useForm<UpdateMyPasswordBody & { confirmPassword: string }>>[0]
  profile: { email: string | null; status: string; username: string | null }
  updateMeMutation: ReturnType<typeof useUpdateMeMutation>
  updatePasswordMutation: ReturnType<typeof useUpdateMyPasswordMutation>
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.84fr)_minmax(0,1.16fr)]">
      <Card className="rounded-2xl" title={t('profile.summary.title')}>
        <div className="mt-3 space-y-2.5">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-subtle/18 px-3.5 py-3"
            >
              <span className="text-sm text-fg-muted">{item.label}</span>
              <span className="text-right text-sm font-medium text-fg">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Tag>{profile.username || '-'}</Tag>
          <Tag>{profile.email || '-'}</Tag>
          <Tag color={profile.status === 'ACTIVE' ? 'success' : profile.status === 'BANNED' ? 'error' : 'default'}>
            {t(`user.status.${profile.status.toLowerCase()}`)}
          </Tag>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="rounded-2xl" title={t('profile.form.title')}>
          <p className="mb-4 text-sm text-fg-muted">{t('profile.form.description')}</p>
          <div className="rounded-2xl border border-border-subtle bg-surface-subtle/18 p-4">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div className="grid gap-x-5 md:grid-cols-2">
                <Form.Item label={t('user.columns.username')} name="username">
                  <Input placeholder={t('profile.form.usernamePlaceholder')} />
                </Form.Item>

                <Form.Item
                  label={t('user.columns.name')}
                  name="name"
                  rules={[{ required: true, message: t('user.nameRequired') }]}
                >
                  <Input placeholder={t('profile.form.namePlaceholder')} />
                </Form.Item>

                <Form.Item
                  label={t('user.columns.email')}
                  name="email"
                  rules={[{ type: 'email', message: t('user.emailInvalid') }]}
                >
                  <Input placeholder={t('profile.form.emailPlaceholder')} />
                </Form.Item>

                <Form.Item label={t('user.columns.phone')} name="phone">
                  <Input placeholder={t('profile.form.phonePlaceholder')} />
                </Form.Item>

                <Form.Item
                  label={t('user.columns.image')}
                  name="image"
                  rules={[{ type: 'url', message: t('profile.form.imageInvalid') }]}
                >
                  <Input placeholder={t('profile.form.imagePlaceholder')} />
                </Form.Item>
              </div>

              <Form.Item label={t('user.columns.introduce')} name="introduce">
                <Input.TextArea
                  rows={4}
                  maxLength={500}
                  placeholder={t('profile.form.introducePlaceholder')}
                  showCount
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Save className="size-4" />}
                  loading={updateMeMutation.isPending}
                >
                  {t('profile.form.submit')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>

        <Card className="rounded-2xl" title={t('profile.password.title')}>
          <p className="mb-4 text-sm text-fg-muted">{t('profile.password.description')}</p>
          <div className="rounded-2xl border border-border-subtle bg-surface-subtle/18 p-4">
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
              <div className="grid gap-x-5 md:grid-cols-2">
                <Form.Item label={t('profile.password.currentPassword')} name="currentPassword">
                  <Input.Password
                    autoComplete="current-password"
                    placeholder={t('profile.password.currentPasswordPlaceholder')}
                  />
                </Form.Item>

                <Form.Item
                  label={t('profile.password.newPassword')}
                  name="newPassword"
                  rules={[
                    { message: t('profile.password.newPasswordRequired'), required: true },
                    { message: t('profile.password.newPasswordMinLength'), min: 8 },
                  ]}
                >
                  <Input.Password
                    autoComplete="new-password"
                    placeholder={t('profile.password.newPasswordPlaceholder')}
                  />
                </Form.Item>

                <Form.Item
                  dependencies={['newPassword']}
                  label={t('profile.password.confirmPassword')}
                  name="confirmPassword"
                  rules={[
                    { message: t('profile.password.confirmPasswordRequired'), required: true },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve()
                        }

                        return Promise.reject(new Error(t('profile.password.passwordMismatch')))
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    autoComplete="new-password"
                    placeholder={t('profile.password.confirmPasswordPlaceholder')}
                  />
                </Form.Item>
              </div>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<KeyRound className="size-4" />}
                  loading={updatePasswordMutation.isPending}
                >
                  {t('profile.password.submit')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AccessTab({
  currentUserPermissionsQuery,
  currentUserRolesQuery,
}: {
  currentUserPermissionsQuery: ReturnType<typeof useCurrentUserPermissionsQuery>
  currentUserRolesQuery: ReturnType<typeof useCurrentUserRolesQuery>
}) {
  const { t } = useTranslation()

  if (currentUserRolesQuery.isLoading || currentUserPermissionsQuery.isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  const roles = currentUserRolesQuery.data?.roles ?? []
  const permissions = currentUserPermissionsQuery.data?.permissions ?? []
  const coveredModulesCount = new Set(permissions.map((permission) => permission.resource)).size
  const elevatedPermissionsCount = permissions.filter(
    (permission) => permission.scope === 'all' || permission.resource === 'system',
  ).length
  const summaryItems = [
    { label: t('access.current.stats.roles'), value: roles.length },
    { label: t('access.current.stats.permissions'), value: permissions.length },
    { label: t('access.current.stats.modules'), value: coveredModulesCount },
    { label: t('access.current.stats.elevated'), value: elevatedPermissionsCount },
  ]

  const getPermissionTitle = (permission: PermissionSummary) =>
    t(`access.permissionMeta.titles.${permission.key}`, {
      defaultValue: permission.displayName || permission.key,
    })

  const buildRoleCapabilityGroups = (role: CurrentUserRoles['roles'][number]) => {
    const groupCounts = new Map<string, number>()

    for (const permission of role.permissions) {
      groupCounts.set(permission.resource, (groupCounts.get(permission.resource) ?? 0) + 1)
    }

    return Array.from(groupCounts.entries()).map(([resource, count]) => ({
      count,
      label: t(`access.permissionMeta.groups.${resource}`, {
        defaultValue: t('access.permissionMeta.groups.other'),
      }),
      resource,
    }))
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border-subtle bg-surface-subtle/18 px-4 py-2.5">
            <span className="text-xs text-fg-muted">{item.label}</span>
            <span className="ml-2 text-sm font-medium text-fg">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
        <Card
          className="rounded-2xl"
          title={t('access.current.rolesTitle')}
          extra={
            <span className="text-fg-muted text-sm">{t('access.current.roleCount', { count: roles.length })}</span>
          }
        >
          <p className="mb-4 text-sm text-fg-muted">{t('access.current.rolesDescription')}</p>
          {roles.length > 0 ? (
            <div className="space-y-2.5">
              {roles.map((role) => {
                const capabilityGroups = buildRoleCapabilityGroups(role)
                const previewPermissions = role.permissions.slice(0, 3)
                const extraPermissionCount = role.permissions.length - previewPermissions.length

                return (
                  <div key={role.id} className="rounded-2xl border border-border-subtle bg-surface-subtle/18 p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-fg">{role.displayName || role.name}</h3>
                      <Tag variant="filled" className="m-0 rounded-full px-2.5 py-0.5 text-xs">
                        {t(`access.current.roleSource.${role.source}`)}
                      </Tag>
                      <Tag
                        variant="filled"
                        color={role.isSystem ? 'processing' : 'default'}
                        className="m-0 rounded-full px-2.5 py-0.5 text-xs"
                      >
                        {role.isSystem ? t('access.current.roleKind.system') : t('access.current.roleKind.custom')}
                      </Tag>
                    </div>

                    <div className="text-fg-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span>{role.name}</span>
                      <span>
                        {t('access.current.roleAssignedAt')} {dayjs(role.assignedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                      <span>{t('access.current.rolePermissionCount', { count: role.permissions.length })}</span>
                    </div>

                    {capabilityGroups.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {capabilityGroups.map((group) => (
                          <span
                            key={`${role.id}-${group.resource}`}
                            className="rounded-full border border-border-subtle bg-overlay-0/20 px-2.5 py-1 text-xs text-fg-muted"
                          >
                            {group.label} {group.count}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {previewPermissions.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {previewPermissions.map((permission) => (
                          <span
                            key={`${role.id}-${permission.key}`}
                            className="rounded-full border border-border-subtle bg-surface/70 px-2.5 py-1 text-xs text-fg"
                          >
                            {getPermissionTitle(permission)}
                          </span>
                        ))}
                        {extraPermissionCount > 0 ? (
                          <span className="rounded-full border border-dashed border-border-subtle px-2.5 py-1 text-xs text-fg-muted">
                            {t('access.current.rolePermissionMore', { count: extraPermissionCount })}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty description={t('access.empty.roles')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        <Card
          className="rounded-2xl"
          title={t('access.current.permissionsTitle')}
          extra={
            <span className="text-fg-muted text-sm">
              {t('access.current.permissionCount', { count: permissions.length })}
            </span>
          }
        >
          <p className="mb-4 text-sm text-fg-muted">{t('access.current.permissionsDescription')}</p>
          {permissions.length > 0 ? (
            <PermissionSummaryList permissions={permissions} />
          ) : (
            <Empty description={t('access.empty.permissions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    </>
  )
}
