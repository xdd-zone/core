import type { AuthMethod, SignInEmailBody } from '@console/modules/auth'
import { DASHBOARD_ROUTE_PATH, sanitizeRedirectPath } from '@console/app/router/guards'

import { AuthContainer } from '@console/components/business'
import { AuthRequestError, resolveAuthMethodAction, useAuthMethodsQuery, useLoginMutation } from '@console/modules/auth'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'

import { Alert, App as AntdApp, Button, Divider, Form, Input, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import { AiFillGithub, AiFillWechat, AiOutlineGoogle } from 'react-icons/ai'

function resolveSocialLoginError(
  error?: string,
):
  | 'auth_method_disabled'
  | 'auth_sign_up_disabled'
  | 'email_not_found'
  | 'github_sign_in_failed'
  | 'invalid_callback_url'
  | 'unknown'
  | null {
  if (!error) {
    return null
  }

  if (error === 'auth_method_disabled') {
    return 'auth_method_disabled'
  }

  if (error === 'auth_sign_up_disabled') {
    return 'auth_sign_up_disabled'
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

function resolveMethodState(methods: AuthMethod[] | undefined, methodId: AuthMethod['id'], isLoading: boolean) {
  const method = methods?.find((item) => item.id === methodId)

  if (!method) {
    const fallbackKind: AuthMethod['kind'] = methodId === 'emailPassword' ? 'credential' : 'oauth'

    return {
      allowSignUp: true,
      enabled: !isLoading,
      entryPath: null,
      id: methodId,
      implemented: false,
      kind: fallbackKind,
    }
  }

  return method
}

function resolveSocialLoginMethodLabel(method?: string) {
  if (method === 'github') {
    return 'GitHub'
  }

  if (method === 'wechat') {
    return '微信'
  }

  if (method === 'google') {
    return 'Google'
  }

  return null
}

function resolveMethodDisabledReason(
  method: AuthMethod,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!method.enabled) {
    return t('auth.socialLoginErrorMethodDisabled', {
      method: resolveSocialLoginMethodLabel(method.id) ?? method.id,
    })
  }

  if (!method.implemented) {
    return t('auth.socialLoginComingSoon', {
      method: resolveSocialLoginMethodLabel(method.id) ?? method.id,
    })
  }

  return null
}

/**
 * 登录页
 */
export function Login() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const navigate = useNavigate()
  const router = useRouter()
  const { error, method, redirect } = useSearch({ from: '/login' })
  const authMethodsQuery = useAuthMethodsQuery()
  const loginMutation = useLoginMutation()
  const socialLoginError = resolveSocialLoginError(error)
  const socialLoginMethodLabel = resolveSocialLoginMethodLabel(method)
  const authMethods = authMethodsQuery.data?.methods
  const emailPasswordMethod = resolveMethodState(authMethods, 'emailPassword', authMethodsQuery.isLoading)
  const githubMethod = resolveMethodState(authMethods, 'github', authMethodsQuery.isLoading)
  const wechatMethod = resolveMethodState(authMethods, 'wechat', authMethodsQuery.isLoading)
  const googleMethod = resolveMethodState(authMethods, 'google', authMethodsQuery.isLoading)
  const isEmailPasswordDisabled = !emailPasswordMethod.enabled
  const socialMethods = [
    { icon: <AiFillGithub />, method: githubMethod, textKey: 'auth.githubLogin' as const },
    { icon: <AiFillWechat />, method: wechatMethod, textKey: 'auth.wechatLogin' as const },
    { icon: <AiOutlineGoogle />, method: googleMethod, textKey: 'auth.googleLogin' as const },
  ] as const

  const handleLogin = async (values: SignInEmailBody) => {
    if (isEmailPasswordDisabled) {
      return
    }

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

  const handleSocialLogin = (method: AuthMethod) => {
    const disabledReason = resolveMethodDisabledReason(method, t)
    if (disabledReason) {
      message.info(disabledReason)
      return
    }

    const callbackURL = sanitizeRedirectPath(redirect) ?? DASHBOARD_ROUTE_PATH
    const callbackTarget = new URL(callbackURL, window.location.origin).toString()
    const action = resolveAuthMethodAction(method, callbackTarget)

    if (!action) {
      message.info(
        t('auth.socialLoginComingSoon', {
          method: resolveSocialLoginMethodLabel(method.id) ?? method.id,
        }),
      )
      return
    }

    window.location.assign(action.url)
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
                {socialLoginError === 'auth_method_disabled'
                  ? t('auth.socialLoginErrorMethodDisabled', {
                      method: socialLoginMethodLabel ?? t('auth.githubLogin'),
                    })
                  : socialLoginError === 'auth_sign_up_disabled'
                    ? t('auth.socialLoginErrorSignUpDisabled', {
                        method: socialLoginMethodLabel ?? t('auth.githubLogin'),
                      })
                    : socialLoginError === 'email_not_found'
                      ? t('auth.socialLoginErrorEmailNotFound')
                      : socialLoginError === 'invalid_callback_url'
                        ? t('auth.socialLoginErrorInvalidCallback')
                        : t('auth.socialLoginErrorFallback')}
              </p>
              <p className="text-fg-muted text-xs leading-6">
                {socialLoginError === 'auth_method_disabled'
                  ? t('auth.socialLoginDisabledHint')
                  : socialLoginError === 'auth_sign_up_disabled'
                    ? t('auth.socialLoginSignUpDisabledHint')
                    : socialLoginError === 'email_not_found'
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
          <Input
            placeholder={t('auth.emailPlaceholder')}
            className="rounded-lg"
            autoComplete="email"
            disabled={isEmailPasswordDisabled}
          />
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
            disabled={isEmailPasswordDisabled}
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
            disabled={isEmailPasswordDisabled}
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
        {socialMethods.map(({ icon, method, textKey }) => {
          const disabledReason = resolveMethodDisabledReason(method, t)
          const disabled = !!disabledReason
          const button = (
            <Button
              icon={icon}
              onClick={() => handleSocialLogin(method)}
              disabled={disabled}
              className="border-border text-fg hover:border-primary hover:text-primary h-12 flex-1 rounded-lg bg-transparent transition-colors disabled:text-fg-muted"
            >
              {t(textKey)}
            </Button>
          )

          if (!disabledReason) {
            return (
              <div key={method.id} className="flex-1">
                {button}
              </div>
            )
          }

          return (
            <Tooltip key={method.id} title={disabledReason}>
              <div className="flex-1">{button}</div>
            </Tooltip>
          )
        })}
      </div>

      {socialMethods.some(({ method }) => method.enabled && !method.implemented) ? (
        <p className="text-fg-muted mt-3 text-center text-xs leading-6">{t('auth.socialLoginComingSoonHint')}</p>
      ) : null}

      {/* 注册链接 */}
      <div className="mt-6 text-center">
        <span className="text-fg-muted text-sm">{t('auth.registerUnavailable')}</span>
      </div>
    </AuthContainer>
  )
}
