import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { CreateProjectRequestSchema, SaveProjectDraftRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequirePermission } from '#momo/modules/auth/index'
import { createEventsRepository, createEventsService } from '#momo/modules/events/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createProjectsRepository } from './projects.repository'
import { createProjectsService } from './projects.service'

export function createProjectsRoute(runtime: MomoRuntime) {
  const service = createProjectsService(
    createProjectsRepository(getDb()),
    createEventsService(runtime, createEventsRepository(getDb())),
  )

  return new Hono<HonoEnv>()
    .get('/rpc/projects', createRequirePermission(runtime, 'projects.read'), async (c) => {
      const projects = await service.listProjects()
      return c.json(createSuccessResponse({ projects }, createMeta(c.var.requestId)))
    })
    .post(
      '/rpc/projects',
      createRequirePermission(runtime, 'projects.create'),
      zValidator('json', CreateProjectRequestSchema, (result) => {
        if (result.success) return
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const project = await service.createProject(c.req.valid('json'), c.var.user!.id)
        return c.json(createSuccessResponse({ project }, createMeta(c.var.requestId)), 201)
      },
    )
    .get('/rpc/projects/:id', createRequirePermission(runtime, 'projects.read'), async (c) => {
      const project = await service.getProject(c.req.param('id'))
      return c.json(createSuccessResponse({ project }, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/projects/:id/draft',
      createRequirePermission(runtime, 'projects.edit'),
      zValidator('json', SaveProjectDraftRequestSchema, (result) => {
        if (result.success) return
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const project = await service.saveDraft(c.req.param('id'), c.req.valid('json'), c.var.user!.id)
        return c.json(createSuccessResponse({ project }, createMeta(c.var.requestId)))
      },
    )
    .post('/rpc/projects/:id/publish', createRequirePermission(runtime, 'projects.publish'), async (c) => {
      const result = await service.publishProject(c.req.param('id'), c.var.user!.id)
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .post(
      '/rpc/projects/:id/preview-token',
      createRequirePermission(runtime, 'content.preview.generate'),
      async (c) => {
        const token = await service.createPreviewToken(c.req.param('id'), c.var.user!.id)
        return c.json(createSuccessResponse(token, createMeta(c.var.requestId)))
      },
    )
    .post('/rpc/projects/:id/archive', createRequirePermission(runtime, 'projects.edit'), async (c) => {
      const project = await service.archiveProject(c.req.param('id'), c.var.user!.id)
      return c.json(createSuccessResponse({ project }, createMeta(c.var.requestId)))
    })
    .get('/rpc/bobo/projects', async (c) => {
      const projects = await service.listPublicProjects()
      return c.json(createSuccessResponse({ projects }, createMeta(c.var.requestId)))
    })
    .get('/rpc/bobo/projects/:slug', async (c) => {
      const project = await service.getPublicProject(c.req.param('slug'))
      return c.json(createSuccessResponse({ project }, createMeta(c.var.requestId)))
    })
}
