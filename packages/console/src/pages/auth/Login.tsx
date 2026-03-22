import { Button, Divider, Form, Input } from 'antd'
import { useTranslation } from 'react-i18next'
import { AiFillWechat, AiOutlineGoogle } from 'react-icons/ai'

import { AuthContainer } from '@/components/business'

/**
 * 登录页
 */
export function Login() {
  const { t } = useTranslation()

  return (
    <AuthContainer>
      {/* 标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-fg mb-2 text-2xl font-bold">{t('auth.loginTitle')}</h1>
        <p className="text-fg-muted">{t('auth.loginWelcome')}</p>
      </div>

      {/* 登录表单 */}
      <Form name="login" layout="vertical" size="large" className="gap-y-4">
        <Form.Item
          label={t('auth.username')}
          name="username"
          rules={[{ message: t('auth.usernameRequired'), required: true }]}
        >
          <Input placeholder={t('auth.usernamePlaceholder')} className="rounded-lg" autoComplete="username" />
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
          <Button type="primary" htmlType="submit" className="h-12 w-full rounded-lg font-medium">
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
          className="border-border text-fg-muted hover:border-success hover:text-success h-12 flex-1 rounded-lg bg-transparent transition-colors"
        >
          {t('auth.wechatLogin')}
        </Button>
        <Button
          icon={<AiOutlineGoogle />}
          className="border-border text-fg-muted hover:border-error hover:text-error h-12 flex-1 rounded-lg bg-transparent transition-colors"
        >
          {t('auth.googleLogin')}
        </Button>
      </div>

      {/* 注册链接 */}
      <div className="mt-6 text-center">
        <span className="text-fg-muted text-sm">{t('auth.noAccount')}</span>
        <a href="#" className="text-primary-cat hover:text-primary-hover ml-1 text-sm transition-colors">
          {t('auth.registerNow')}
        </a>
      </div>
    </AuthContainer>
  )
}
