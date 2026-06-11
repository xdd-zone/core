import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'

import {
  ensureBoboVisitorRole,
  findActiveRoleBinding,
  hasActiveAuthMethod,
  hasPasswordAccount,
  isUserActive,
} from './access.repository'

export async function assertFifaOwner(userId: string): Promise<void> {
  if (!(await isUserActive(userId))) {
    throw new AppError(BizCode.AUTH_USER_DISABLED, '当前账号已停用', 403)
  }

  if (!(await hasActiveAuthMethod('fifa', 'password')) || !(await hasPasswordAccount(userId))) {
    throw new AppError(BizCode.AUTH_METHOD_NOT_ALLOWED, '当前账号不能使用密码登录 fifa', 403)
  }

  if (!(await findActiveRoleBinding(userId, 'fifa', 'owner'))) {
    throw new AppError(BizCode.AUTH_OWNER_REQUIRED, '当前账号没有 fifa owner 权限', 403)
  }
}

export async function ensureBoboVisitor(userId: string): Promise<void> {
  if (!(await isUserActive(userId))) {
    throw new AppError(BizCode.AUTH_USER_DISABLED, '当前账号已停用', 403)
  }

  await ensureBoboVisitorRole(userId)
}
