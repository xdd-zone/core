import type { MomoLogger } from '#momo/infra/logger'

export interface BoboRevalidateInput {
  paths?: string[]
  tags?: string[]
}

export interface BoboRevalidateClient {
  revalidate: (input: BoboRevalidateInput) => Promise<void>
}

export class DisabledBoboRevalidateClient implements BoboRevalidateClient {
  async revalidate(): Promise<void> {}
}

export class HttpBoboRevalidateClient implements BoboRevalidateClient {
  constructor(
    private readonly config: {
      baseUrl: string
      secret: string
    },
    private readonly logger?: MomoLogger,
  ) {}

  async revalidate(input: BoboRevalidateInput): Promise<void> {
    const response = await fetch(new URL('/api/revalidate', this.config.baseUrl), {
      body: JSON.stringify({
        paths: input.paths ?? [],
        tags: input.tags ?? [],
      }),
      headers: {
        authorization: `Bearer ${this.config.secret}`,
        'content-type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      this.logger?.warn(
        {
          event: 'bobo.revalidate.failed',
          responseBody: text,
          status: response.status,
        },
        'Bobo 缓存刷新失败',
      )
      throw new Error(`Bobo 缓存刷新失败: ${response.status}`)
    }
  }
}
