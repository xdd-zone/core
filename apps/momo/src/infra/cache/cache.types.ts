export interface CacheSetOptions {
  ttlSeconds?: number
}

export interface CacheDriver {
  close: () => Promise<void>
  delete: (key: string) => Promise<void>
  get: <T>(key: string) => Promise<T | undefined>
  set: (key: string, value: unknown, options?: CacheSetOptions) => Promise<void>
  wrap: <T>(key: string, loader: () => Promise<T>, options?: CacheSetOptions) => Promise<T>
}
