import { UserRequestError, useUpdateUserMutation, useUserDetailQuery } from '@console/modules/user'

import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'

import { App as AntdApp, Button, Card, Form, Input, Space, Spin, Tag } from 'antd'
import dayjs from 'dayjs'

import { ArrowLeft, PencilLine } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 用户编辑页面
 */
export function UserEdit() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams({ from: '/protected/app-layout/users/$id/edit' })

  const [form] = Form.useForm()

  const userQuery = useUserDetailQuery(id)
  const updateMutation = useUpdateUserMutation()

  useEffect(() => {
    if (userQuery.data) {
      form.setFieldsValue({
        username: userQuery.data.username,
        name: userQuery.data.name,
        email: userQuery.data.email,
        phone: userQuery.data.phone,
        introduce: userQuery.data.introduce,
      })
    }
  }, [userQuery.data, form])

  const handleSubmit = async (values: Record<string, string>) => {
    try {
      const updatedUser = await updateMutation.mutateAsync({
        id,
        ...values,
        email: values.email || null,
        introduce: values.introduce || null,
        phone: values.phone || null,
      })
      queryClient.setQueryData(['users', id], updatedUser)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success(t('common.success'))
      await navigate({ to: '/users/$id', params: { id } })
    } catch (error) {
      const errorMessage = error instanceof UserRequestError ? error.message : t('common.error')
      message.error(errorMessage)
    }
  }

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

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[28px] border border-border-subtle bg-surface/85 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl">
            <Button
              icon={<ArrowLeft className="size-4" />}
              onClick={() => void navigate({ to: '/users/$id', params: { id } })}
            >
              {t('common.back')}
            </Button>
            <div className="mt-4 flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                <PencilLine className="size-5" />
              </div>
              <div>
                <div className="text-fg-muted text-[11px] font-semibold tracking-[0.18em] uppercase">
                  {t('user.edit.eyebrow')}
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t('user.edit.title')}</h1>
                <p className="text-fg-muted mt-2 text-sm">{t('user.edit.description')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag>{user.username || '-'}</Tag>
                  <Tag>{user.email || '-'}</Tag>
                  <Tag color={user.status === 'ACTIVE' ? 'success' : user.status === 'BANNED' ? 'error' : 'default'}>
                    {t(`user.status.${user.status.toLowerCase()}`)}
                  </Tag>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-fg-muted">
                  <span>{t('user.columns.createdAt')} {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                  <span>{t('user.columns.updatedAt')} {dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card title={t('user.edit.formTitle')}>
        <p className="mb-4 text-sm text-fg-muted">{t('user.edit.formDescription')}</p>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label={t('user.columns.username')} name="username">
            <Input disabled />
          </Form.Item>

          <Form.Item
            label={t('user.columns.name')}
            name="name"
            rules={[{ required: true, message: t('user.nameRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('user.columns.email')}
            name="email"
            rules={[{ type: 'email', message: t('user.emailInvalid') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={t('user.columns.phone')} name="phone">
            <Input />
          </Form.Item>

          <Form.Item label={t('user.columns.introduce')} name="introduce">
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space wrap>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                {t('common.save')}
              </Button>
              <Button onClick={() => void navigate({ to: '/users/$id', params: { id } })}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
