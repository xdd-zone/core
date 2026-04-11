import { z } from 'zod'

export const LogLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])

export const AuthMethodPolicySchema = z.object({
  enabled: z.boolean(),
  allowSignUp: z.boolean(),
})

export const RawConfigSchema = z
  .object({
    app: z
      .object({
        name: z.string().min(1).optional(),
        port: z.coerce.number().int().positive().optional(),
        apiPrefix: z.string().min(1).optional(),
        publicBaseUrl: z.string().url().optional(),
      })
      .partial()
      .optional(),
    http: z
      .object({
        cors: z
          .object({
            enabled: z.boolean().optional(),
            origins: z.union([z.literal(true), z.array(z.string().url())]).optional(),
            allowCredentials: z.boolean().optional(),
            allowedHeaders: z.array(z.string().min(1)).optional(),
            exposedHeaders: z.array(z.string().min(1)).optional(),
            methods: z.array(z.string().min(1)).optional(),
            maxAge: z.coerce.number().int().nonnegative().optional(),
          })
          .partial()
          .optional(),
        requestLogger: z
          .object({
            enabled: z.boolean().optional(),
            logBody: z.boolean().optional(),
            logHeaders: z.boolean().optional(),
          })
          .partial()
          .optional(),
      })
      .partial()
      .optional(),
    openapi: z
      .object({
        enabled: z.boolean().optional(),
        path: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        version: z.string().min(1).optional(),
      })
      .partial()
      .optional(),
    logger: z
      .object({
        level: LogLevelSchema.optional(),
        pretty: z.boolean().optional(),
        filePath: z.string().min(1).nullable().optional(),
        serviceName: z.string().min(1).optional(),
      })
      .partial()
      .optional(),
    auth: z
      .object({
        trustedOrigins: z.array(z.string().url()).optional(),
        methods: z
          .object({
            emailPassword: AuthMethodPolicySchema.partial().optional(),
            github: AuthMethodPolicySchema.partial().optional(),
            google: AuthMethodPolicySchema.partial().optional(),
            wechat: AuthMethodPolicySchema.partial().optional(),
          })
          .partial()
          .optional(),
      })
      .partial()
      .optional(),
    database: z
      .object({
        log: z
          .object({
            query: z.boolean().optional(),
            info: z.boolean().optional(),
            warn: z.boolean().optional(),
            error: z.boolean().optional(),
          })
          .partial()
          .optional(),
      })
      .partial()
      .optional(),
  })
  .strict()

export const ResolvedConfigSchema = z.object({
  env: z.object({
    nodeEnv: z.enum(['development', 'test', 'production']),
    isDevelopment: z.boolean(),
    isTest: z.boolean(),
    isProduction: z.boolean(),
  }),
  app: z.object({
    name: z.string().min(1),
    port: z.number().int().positive(),
    apiPrefix: z.string().min(1),
    publicBaseUrl: z.string().url(),
  }),
  http: z.object({
    cors: z.object({
      enabled: z.boolean(),
      origins: z.union([z.literal(true), z.array(z.string().url())]),
      allowCredentials: z.boolean(),
      allowedHeaders: z.array(z.string().min(1)),
      exposedHeaders: z.array(z.string().min(1)),
      methods: z.array(z.string().min(1)),
      maxAge: z.number().int().nonnegative(),
    }),
    requestLogger: z.object({
      enabled: z.boolean(),
      logBody: z.boolean(),
      logHeaders: z.boolean(),
    }),
  }),
  openapi: z.object({
    enabled: z.boolean(),
    path: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    version: z.string().min(1),
  }),
  logger: z.object({
    level: LogLevelSchema,
    pretty: z.boolean(),
    filePath: z.preprocess((value) => (value === null ? undefined : value), z.string().min(1).optional()),
    serviceName: z.string().min(1),
  }),
  auth: z.object({
    trustedOrigins: z.array(z.string().url()),
    methods: z.object({
      emailPassword: AuthMethodPolicySchema,
      github: AuthMethodPolicySchema,
      google: AuthMethodPolicySchema,
      wechat: AuthMethodPolicySchema,
    }),
  }),
  betterAuth: z.object({
    secret: z.string().min(1),
    url: z.string().url(),
    providers: z.object({
      github: z
        .object({
          clientId: z.string().min(1),
          clientSecret: z.string().min(1),
        })
        .optional(),
    }),
  }),
  database: z.object({
    url: z.string().url(),
    log: z.object({
      query: z.boolean(),
      info: z.boolean(),
      warn: z.boolean(),
      error: z.boolean(),
    }),
  }),
})
