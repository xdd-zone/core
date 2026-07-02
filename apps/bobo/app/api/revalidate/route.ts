import { revalidatePath, revalidateTag } from 'next/cache'

import { getBoboServerEnv } from '@/lib/env.server'

interface RevalidatePayload {
  tags?: unknown
  paths?: unknown
}

export async function POST(request: Request): Promise<Response> {
  const env = getBoboServerEnv()

  if (readSecret(request) !== env.BOBO_REVALIDATE_SECRET || !env.BOBO_REVALIDATE_SECRET) {
    return Response.json({ ok: false, error: 'secret 不正确。' }, { status: 401 })
  }

  const body = await readBody(request)

  if (!body) {
    return Response.json({ ok: false, error: '请求 body 必须是 JSON。' }, { status: 400 })
  }

  const tags = readStringList(body.tags)
  const paths = readStringList(body.paths)

  if (!tags || !paths) {
    return Response.json({ ok: false, error: 'tags 和 paths 必须是字符串数组。' }, { status: 400 })
  }

  if (tags.length === 0 && paths.length === 0) {
    return Response.json({ ok: false, error: 'tags 或 paths 至少传一个。' }, { status: 400 })
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }

  for (const path of paths) {
    revalidatePath(path)
  }

  return Response.json({
    ok: true,
    revalidated: {
      paths,
      tags,
    },
  })
}

function readSecret(request: Request): string | null {
  const auth = request.headers.get('authorization')

  if (auth?.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length)
  }

  return request.headers.get('x-bobo-revalidate-secret') ?? request.headers.get('x-revalidate-secret')
}

async function readBody(request: Request): Promise<RevalidatePayload | null> {
  try {
    const body: unknown = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null
    }

    return body as RevalidatePayload
  } catch {
    return null
  }
}

function readStringList(value: unknown): string[] | null {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    return null
  }

  const list: string[] = []

  for (const item of value) {
    if (typeof item !== 'string') {
      return null
    }

    const trimmed = item.trim()

    if (trimmed.length > 0) {
      list.push(trimmed)
    }
  }

  return list
}
