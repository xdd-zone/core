import { UserRequestError, useUpdateUserMutation, useUserDetailQuery } from '@console/modules/user'

import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'

import { App as AntdApp, Button, Card, Form, Input, Space, Spin } from 'antd'

import { ArrowLeft } from 'lucide-react'
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

  return (
    <div className="flex flex-col gap-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <Button icon={<ArrowLeft className="size-4" />} onClick={() => void navigate({ to: '/users/$id', params: { id } })}>
          {t('common.back')}
        </Button>
      </div>

      {/* 编辑表单 */}
      <Card title={t('user.edit.title')}>
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
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
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
