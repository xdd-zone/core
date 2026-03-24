import type { SignInEmailBody } from '@console/modules/auth'
import { DASHBOARD_ROUTE_PATH, sanitizeRedirectPath } from '@console/app/router/guards'

import { AuthContainer } from '@console/components/business'
import { AuthRequestError, useLoginMutation } from '@console/modules/auth'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'

import { App as AntdApp, Button, Divider, Form, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import { AiFillWechat, AiOutlineGoogle } from 'react-icons/ai'

/**
 * 登录页
 */
export function Login() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const router = useRouter()
  const { redirect } = useSearch({ from: '/login' })
  const loginMutation = useLoginMutation()

  const handleLogin = async (values: SignInEmailBody) => {
    try {
      await loginMutation.mutateAsync(values)
      message.success(t('auth.loginSuccess'))

      const redirectPath = sanitizeRedirectPath(redirect)
      if (redirectPath) {
        router.history.push(redirectPath)
        return
      }

      await navigate({
        replace: true,
        to: DASHBOARD_ROUTE_PATH,
      })
    } catch (error) {
      const errorMessage = error instanceof AuthRequestError ? error.message : t('auth.loginFailed')
      message.error(errorMessage)
    }
  }

  return (
    <AuthContainer>
      {/* 标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-fg mb-2 text-2xl font-bold">{t('auth.loginTitle')}</h1>
        <p className="text-fg-muted">{t('auth.loginWelcome')}</p>
      </div>

      {/* 登录表单 */}
      <Form<SignInEmailBody> name="login" layout="vertical" size="large" className="gap-y-4" onFinish={handleLogin}>
        <Form.Item
          label={t('auth.email')}
          name="email"
          rules={[
            { message: t('auth.emailRequired'), required: true },
            { message: t('auth.emailInvalid'), type: 'email' },
          ]}
        >
          <Input placeholder={t('auth.emailPlaceholder')} className="rounded-lg" autoComplete="email" />
        </Form.Item>

        <Form.Item
          label={t('auth.password')}
          name="password"
          rules={[{ message: t('auth.passwordRequired'), required: true }]}
        >
          <Input.Password
            placeholder={t('auth.passwordPlaceholder')}
            className="rounded-lg"
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="mb-4 flex justify-end">
          <a href="#" className="text-primary-cat hover:text-primary-hover text-sm transition-colors">
            {t('auth.forgotPassword')}
          </a>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loginMutation.isPending}
            className="h-12 w-full rounded-lg font-medium"
          >
            {t('auth.login')}
          </Button>
        </Form.Item>
      </Form>

      {/* 分割线 */}
      <Divider className="my-6">
        <span className="text-fg-subtle text-sm">{t('auth.orSocialLogin')}</span>
      </Divider>

      {/* 社交登录按钮 */}
      <div className="flex gap-4">
        <Button
          icon={<AiFillWechat />}
          disabled
          className="border-border text-fg-muted hover:border-success hover:text-success h-12 flex-1 rounded-lg bg-transparent transition-colors"
        >
          {t('auth.wechatLogin')}
        </Button>
        <Button
          icon={<AiOutlineGoogle />}
          disabled
          className="border-border text-fg-muted hover:border-error hover:text-error h-12 flex-1 rounded-lg bg-transparent transition-colors"
        >
          {t('auth.googleLogin')}
        </Button>
      </div>

      {/* 注册链接 */}
      <div className="mt-6 text-center">
        <span className="text-fg-muted text-sm">{t('auth.registerUnavailable')}</span>
      </div>
    </AuthContainer>
  )
}
