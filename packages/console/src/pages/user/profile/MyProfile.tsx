import type { SessionPayload } from '@console/modules/auth'

import { useAuthStore } from '@console/modules/auth'
import { useMyProfileQuery, useUpdateMeMutation } from '@console/modules/user'

import { useQueryClient } from '@tanstack/react-query'
import { App as AntdApp, Button, Card, Descriptions, Form, Input, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
import { IdCard, Save } from 'lucide-react'
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
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!profileQuery.data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span>{t('common.notFound')}</span>
      </div>
    )
  }

  const profile = profileQuery.data

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
                {t('profile.summary.eyebrow')}
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                  <IdCard className="size-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{t('menu.myProfile')}</h1>
                  <p className="text-fg-muted mt-2 text-sm leading-7">{t('profile.summary.description')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Tag>{profile.username || '-'}</Tag>
                    <Tag>{profile.email || '-'}</Tag>
                    <Tag
                      color={
                        profile.status === 'ACTIVE' ? 'success' : profile.status === 'BANNED' ? 'error' : 'default'
                      }
                    >
                      {t(`user.status.${profile.status.toLowerCase()}`)}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
                <div className="text-fg-muted text-xs">{t('user.columns.lastLogin')}</div>
                <div className="mt-2 font-medium">
                  {profile.lastLogin ? dayjs(profile.lastLogin).format('YYYY-MM-DD HH:mm') : '-'}
                </div>
              </article>
              <article className="rounded-2xl border border-border-subtle bg-overlay-0/20 p-4">
                <div className="text-fg-muted text-xs">{t('user.columns.createdAt')}</div>
                <div className="mt-2 font-medium">{dayjs(profile.createdAt).format('YYYY-MM-DD HH:mm')}</div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_320px]">
        <Card
          title={t('profile.summary.title')}
          extra={<span className="text-fg-muted text-sm">{t('profile.summary.infoDescription')}</span>}
        >
          <Descriptions column={2}>
            <Descriptions.Item label={t('user.columns.username')}>{profile.username || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.status')}>
              <Tag color={profile.status === 'ACTIVE' ? 'success' : profile.status === 'BANNED' ? 'error' : 'default'}>
                {t(`user.status.${profile.status.toLowerCase()}`)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('user.columns.email')}>{profile.email || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.phone')}>{profile.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('user.columns.lastLogin')}>
              {profile.lastLogin ? dayjs(profile.lastLogin).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('user.columns.createdAt')}>
              {dayjs(profile.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={t('profile.summary.sideTitle')}>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border-subtle bg-surface-subtle/35 p-4">
              <div className="text-sm font-medium">{t('profile.summary.identityTitle')}</div>
              <p className="text-fg-muted mt-2 text-sm leading-7">{t('profile.summary.identityDescription')}</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-surface-subtle/35 p-4">
              <div className="text-sm font-medium">{t('profile.summary.contactTitle')}</div>
              <p className="text-fg-muted mt-2 text-sm leading-7">{t('profile.summary.contactDescription')}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title={t('profile.form.title')}
        extra={<span className="text-fg-muted text-sm">{t('profile.form.description')}</span>}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid gap-x-6 md:grid-cols-2">
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
            <Input.TextArea rows={4} maxLength={500} placeholder={t('profile.form.introducePlaceholder')} showCount />
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
      </Card>
    </div>
  )
}
