import type { SessionPayload } from '@console/modules/auth'

import { ConsolePageHeader } from '@console/components/common/ConsolePageHeader'
import { useAuthStore } from '@console/modules/auth'
import { useMyProfileQuery, useUpdateMeMutation } from '@console/modules/user'
import { ARTICLE_PAGE_CLASSNAME } from '@console/pages/article/shared/page-layout'

import { useQueryClient } from '@tanstack/react-query'
import { App as AntdApp, Button, Card, Form, Input, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
import { Save } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 我的资料页面。
 */
export function MyProfile() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const profileQuery = useMyProfileQuery()
  const updateMeMutation = useUpdateMeMutation()

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }

    form.setFieldsValue({
      email: profileQuery.data.email,
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
      </div>
    </div>
  )
}
