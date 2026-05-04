import type { AccessPluginInstance } from '@nexus/core'

import { assertAuthenticated, Permissions } from '@nexus/core'
import { Elysia } from 'elysia'

import {
  UpdateMyPasswordBodySchema,
  UpdateMyPasswordResponseSchema,
  UpdateMyProfileBodySchema,
  UpdateUserBodySchema,
  UpdateUserStatusBodySchema,
  UserIdParamsSchema,
  UserListQuerySchema,
  UserListSchema,
  UserSchema,
} from './model'
import { UserOpenApi } from './openapi'
import { UserService } from './service'

/**
 * 用户模块。
 */
export interface UserModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createUserModule({ accessPlugin }: UserModuleOptions) {
  return new Elysia({
    name: 'user-module',
    prefix: '/user',
    tags: ['User'],
  })
    .use(accessPlugin)
    .get(
      '/me',
      async ({ auth }) => {
        assertAuthenticated(auth)

        return await UserService.getProfile(auth.user.id)
      },
      {
        auth: 'required',
        me: Permissions.USER.READ_OWN,
        response: UserSchema,
        detail: UserOpenApi.me,
      },
    )
    .patch(
      '/me',
      async ({ auth, body }) => {
        assertAuthenticated(auth)

        return await UserService.updateProfile(auth.user.id, body)
      },
      {
        auth: 'required',
        me: Permissions.USER.UPDATE_OWN,
        body: UpdateMyProfileBodySchema,
        response: UserSchema,
        detail: UserOpenApi.updateMe,
      },
    )
    .patch(
      '/me/password',
      async ({ auth, body }) => {
        assertAuthenticated(auth)

        return await UserService.updatePassword(auth.user.id, auth.session.id, body)
      },
      {
        auth: 'required',
        me: Permissions.USER.UPDATE_OWN,
        body: UpdateMyPasswordBodySchema,
        response: UpdateMyPasswordResponseSchema,
        detail: UserOpenApi.updateMyPassword,
      },
    )
    .get('/', async ({ query }) => await UserService.list(query), {
      permission: Permissions.USER.READ_ALL,
      query: UserListQuerySchema,
      response: UserListSchema,
      detail: UserOpenApi.list,
    })
    .patch('/:id/status', async ({ body, params }) => await UserService.updateStatus(params.id, body.status), {
      permission: Permissions.USER.DISABLE_ALL,
      params: UserIdParamsSchema,
      body: UpdateUserStatusBodySchema,
      response: UserSchema,
      detail: UserOpenApi.updateStatus,
    })
    .get('/:id', async ({ params }) => await UserService.findById(params.id), {
      permission: Permissions.USER.READ_ALL,
      params: UserIdParamsSchema,
      response: UserSchema,
      detail: UserOpenApi.findById,
    })
    .patch('/:id', async ({ body, params }) => await UserService.updateByAdmin(params.id, body), {
      permission: Permissions.USER.UPDATE_ALL,
      params: UserIdParamsSchema,
      body: UpdateUserBodySchema,
      response: UserSchema,
      detail: UserOpenApi.updateByAdmin,
    })
}
