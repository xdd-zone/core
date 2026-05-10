import type { AppBootstrapContext } from '@nexus/bootstrap'
import type { DeepPartial, ResolvedConfig } from '@nexus/core/config'
import type { ApiError } from '@nexus/shared/schema'

import { expect } from 'bun:test'

import { createApp } from '../app'
import { createAppContext } from '../bootstrap'

export interface TestAppOptions {
  config?: DeepPartial<ResolvedConfig>
}

export function createTestApp(options: TestAppOptions = {}) {
  const context = createAppContext(options.config)
  const app = createApp(context)

  return {
    app,
    context,
  }
}

export function createTestRequest(
  path: string,
  init?: RequestInit,
  options: {
    baseUrl?: string
  } = {},
) {
  const baseUrl = options.baseUrl ?? 'http://localhost'
  return new Request(new URL(path, baseUrl), init)
}

export async function readJson<T = unknown>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export async function expectNoBody(response: Response, status = 204) {
  expect(response.status).toBe(status)
  expect(await response.text()).toBe('')
}

export async function expectErrorResponse(
  response: Response,
  expected: {
    status: number
    message?: string
    errorCode?: string
  },
) {
  expect(response.status).toBe(expected.status)

  const body = await readJson<ApiError>(response)
  expect(body.code).toBe(expected.status)
  expect(body.data).toBeNull()

  if (expected.message !== undefined) {
    expect(body.message).toBe(expected.message)
  } else {
    expect(typeof body.message).toBe('string')
  }

  if (expected.errorCode !== undefined) {
    expect(body.errorCode).toBe(expected.errorCode)
  }

  return body
}

export function expectDateTime(value: unknown) {
  expect(value instanceof Date || typeof value === 'string').toBe(true)
  expect(Number.isNaN(new Date(value as string | Date).getTime())).toBe(false)
}

export type TestAppContext = AppBootstrapContext
export type TestApp = ReturnType<typeof createApp>
