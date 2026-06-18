import type { MomoAuth } from '../auth.config'
import type { AuthUserView } from '../auth.types'
import { BizCode } from '@xdd-zone/contracts'
import { eq } from 'drizzle-orm'
import { getDb } from '#momo/infra/db/client'
import { user } from '#momo/infra/db/schema/index'
import { AppError } from '#momo/shared/app-error'

export async function getCurrentAuthUser(auth: MomoAuth, headers: Headers): Promise<AuthUserView | null> {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>

  try {
    session = await auth.api.getSession({ headers })
  } catch {
    throw new AppError(BizCode.AUTH_SESSION_INVALID, '当前登录状态无效', 401)
  }

  if (!session?.user.id) {
    return null
  }

  const rows = await getDb()
    .select({
      avatarUrl: user.image,
      displayName: user.name,
      id: user.id,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const currentUser = rows[0]

  if (!currentUser) {
    throw new AppError(BizCode.AUTH_SESSION_INVALID, '当前登录用户不存在', 401)
  }

  return currentUser
}
