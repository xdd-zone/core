export type NodeEnv = 'development' | 'test' | 'production'

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'

export type AuthMethodId = 'emailPassword' | 'github' | 'google' | 'wechat'

export type AuthMethodKind = 'credential' | 'oauth'

export interface AuthMethodPolicy {
  enabled: boolean
  allowSignUp: boolean
}

export interface ResolvedConfig {
  env: {
    nodeEnv: NodeEnv
    isDevelopment: boolean
    isTest: boolean
    isProduction: boolean
  }
  app: {
    name: string
    port: number
    apiPrefix: string
    publicBaseUrl: string
  }
  http: {
    cors: {
      enabled: boolean
      origins: true | string[]
      allowCredentials: boolean
      allowedHeaders: string[]
      exposedHeaders: string[]
      methods: string[]
      maxAge: number
    }
    requestLogger: {
      enabled: boolean
      logBody: boolean
      logHeaders: boolean
    }
  }
  openapi: {
    enabled: boolean
    path: string
    title: string
    description: string
    version: string
  }
  logger: {
    level: LogLevel
    pretty: boolean
    filePath?: string
    serviceName: string
  }
  auth: {
    trustedOrigins: string[]
    methods: {
      emailPassword: AuthMethodPolicy
      github: AuthMethodPolicy
      google: AuthMethodPolicy
      wechat: AuthMethodPolicy
    }
  }
  betterAuth: {
    secret: string
    url: string
    providers: {
      github?: {
        clientId: string
        clientSecret: string
      }
    }
  }
  database: {
    url: string
    log: {
      query: boolean
      info: boolean
      warn: boolean
      error: boolean
    }
  }
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U> ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K]
}
