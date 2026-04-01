import type { SignInEmailBody } from '@console/modules/auth'
import { DASHBOARD_ROUTE_PATH, sanitizeRedirectPath } from '@console/app/router/guards'

import { AuthContainer } from '@console/components/business'
import { authApi, AuthRequestError, useLoginMutation } from '@console/modules/auth'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'

import { Alert, App as AntdApp, Button, Divider, Form, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import { AiFillGithub, AiFillWechat, AiOutlineGoogle } from 'react-icons/ai'

function resolveSocialLoginError(
  error?: string,
): 'email_not_found' | 'github_sign_in_failed' | 'invalid_callback_url' | 'unknown' | null {
  if (!error) {
    return null
  }

  if (error === 'email_not_found') {
    return 'email_not_found'
  }

  if (error === 'invalid_callback_url') {
    return 'invalid_callback_url'
  }

  if (error === 'github_sign_in_failed') {
    return 'github_sign_in_failed'
  }

  return 'unknown'
}

/**
 * 登录页
 */
export function Login() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const router = useRouter()
  const { error, redirect } = useSearch({ from: '/login' })
  const loginMutation = useLoginMutation()
  const socialLoginError = resolveSocialLoginError(error)

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

  const handleGithubLogin = () => {
    const callbackURL = sanitizeRedirectPath(redirect) ?? DASHBOARD_ROUTE_PATH
    const callbackTarget = new URL(callbackURL, window.location.origin).toString()
    window.location.href = authApi.getGithubSignInUrl(callbackTarget)
  }

  return (
    <AuthContainer>
      {/* 标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-fg mb-2 text-2xl font-bold">{t('auth.loginTitle')}</h1>
        <p className="text-fg-muted">{t('auth.loginWelcome')}</p>
      </div>

      {socialLoginError ? (
        <Alert
          showIcon
          type="warning"
          className="mb-6 rounded-2xl border border-border-subtle bg-surface-muted/55"
          message={t('auth.socialLoginErrorTitle')}
          description={
            <div className="space-y-2">
              <p className="text-sm leading-6">
                {socialLoginError === 'email_not_found'
                  ? t('auth.socialLoginErrorEmailNotFound')
                  : socialLoginError === 'invalid_callback_url'
                    ? t('auth.socialLoginErrorInvalidCallback')
                    : t('auth.socialLoginErrorFallback')}
              </p>
              <p className="text-fg-muted text-xs leading-6">
                {socialLoginError === 'email_not_found'
                  ? t('auth.socialLoginAutoRegisterHint')
                  : socialLoginError === 'invalid_callback_url'
                    ? t('auth.socialLoginErrorConfigHint')
                    : t('auth.socialLoginRetryHint')}
              </p>
            </div>
          }
        />
      ) : null}

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
          icon={<AiFillGithub />}
          onClick={handleGithubLogin}
          className="border-border text-fg hover:border-primary hover:text-primary h-12 flex-1 rounded-lg bg-transparent transition-colors"
        >
          {t('auth.githubLogin')}
        </Button>
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
