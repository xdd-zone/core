import { ConsolePageHeader } from '@console/components/common/ConsolePageHeader'
import { UserRequestError, useUpdateUserMutation, useUserDetailQuery } from '@console/modules/user'
import { ARTICLE_PAGE_CLASSNAME } from '@console/pages/article/shared/page-layout'

import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'

import { App as AntdApp, Button, Card, Form, Input, Space, Spin } from 'antd'
import dayjs from 'dayjs'

import { Save } from 'lucide-react'
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
      <div className="flex min-h-full items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!userQuery.data) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <span>{t('common.notFound')}</span>
      </div>
    )
  }

  const user = userQuery.data
  const summaryItems = [
    { label: t('user.columns.username'), value: user.username || '-' },
    { label: t('user.columns.email'), value: user.email || '-' },
    { label: t('user.columns.status'), value: t(`user.status.${user.status.toLowerCase()}`) },
    { label: t('user.columns.updatedAt'), value: dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm') },
  ]

  return (
    <div className={ARTICLE_PAGE_CLASSNAME}>
      <ConsolePageHeader
        backLabel={t('common.back')}
        description={t('user.edit.description')}
        onBack={() => {
          void navigate({ to: '/users/$id', params: { id } })
        }}
        summaryItems={summaryItems}
        title={t('user.edit.title')}
      />

      <Card className="rounded-3xl" title={t('user.edit.formTitle')}>
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
              <Button
                type="primary"
                htmlType="submit"
                icon={<Save className="size-4" />}
                loading={updateMutation.isPending}
              >
                {t('common.save')}
              </Button>
              <Button onClick={() => void navigate({ to: '/users/$id', params: { id } })}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
