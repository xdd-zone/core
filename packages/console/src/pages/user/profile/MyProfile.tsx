import type { SessionPayload } from '@console/modules/auth'

import { useAuthStore } from '@console/modules/auth'
import { useMyProfileQuery, useUpdateMeMutation } from '@console/modules/user'

import { useQueryClient } from '@tanstack/react-query'
import { App as AntdApp, Button, Form, Input, Spin, Tag } from 'antd'
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

  const infoItems = [
    { label: t('user.columns.username'), value: profile.username || '-' },
    { label: t('user.columns.email'), value: profile.email || '-' },
    { label: t('user.columns.phone'), value: profile.phone || '-' },
    { label: t('user.columns.status'), value: t(`user.status.${profile.status.toLowerCase()}`) },
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
    <section className="rounded-[28px] border border-border-subtle bg-surface/84 p-[clamp(20px,3vw,32px)] shadow-sm backdrop-blur-xs">
      <div className="max-w-4xl">
        <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
          {t('profile.summary.eyebrow')}
        </div>
        <div className="mt-3 flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <IdCard className="size-5" />
          </div>
          <div>
            <h1 className="text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.04em] text-fg">
              {t('menu.myProfile')}
            </h1>
            <p className="text-fg-muted mt-3 text-sm leading-7">{t('profile.summary.description')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>{profile.username || '-'}</Tag>
              <Tag>{profile.email || '-'}</Tag>
              <Tag color={profile.status === 'ACTIVE' ? 'success' : profile.status === 'BANNED' ? 'error' : 'default'}>
                {t(`user.status.${profile.status.toLowerCase()}`)}
              </Tag>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h2 className="text-base font-semibold text-fg">{t('profile.summary.title')}</h2>
          <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {infoItems.map((item) => (
              <div key={item.label} className="border-border-subtle flex items-center justify-between gap-4 border-b py-2">
                <span className="text-sm text-fg-muted">{item.label}</span>
                <span className="text-right text-sm font-medium text-fg">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-fg">{t('profile.form.title')}</h2>
          <div className="mt-4">
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
          </div>
        </div>
      </div>
    </section>
  )
}
