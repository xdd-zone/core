# 测试和检查

这份文档写当前仓库的测试目录设计、编写规则和可直接跑的检查命令。

## 测试目录设计

测试文件统一放在各应用的 `src/test/` 下，目录结构和 `src/` 的一级目录一一对应。

当前 Momo 和 Fifa 有单元测试。其他应用后续新增时按同样的结构放。

### Momo 测试目录

```text
apps/momo/src/test/
├── bootstrap/                  # 对应 src/bootstrap
│   └── create-app.test.ts
├── helpers/                    # 多个测试共用的工具
│   └── auth-test-db.ts
├── infra/                      # 对应 src/infra
│   ├── local-storage.test.ts
│   ├── logger.test.ts
│   └── media-file.test.ts
├── middleware/                  # 对应 src/middleware
│   └── request-log.middleware.test.ts
├── modules/                    # 对应 src/modules
│   ├── auth/
│   │   ├── auth.guard.test.ts
│   │   └── auth.route.test.ts
│   ├── content/
│   │   └── content.route.test.ts
│   └── system/
│       └── system.route.test.ts
└── shared/                     # 对应 src/shared
    └── env.test.ts
```

### Fifa 测试目录

```text
apps/fifa/src/test/
├── api/
│   └── auth/
│       └── me.api.test.ts
└── app/
    └── router/
        └── auth-guard.test.ts
```

分目录的原则：

- 一级目录和 `src/` 下的一级目录保持一致：`bootstrap/`、`infra/`、`middleware/`、`modules/`、`shared/`。
- `modules/` 下按业务模块再分一层，和 `src/modules/<module>` 一一对应。
- 测试文件名和被测文件名一致，后缀改成 `.test.ts`。比如 `system.route.ts` 对应 `system.route.test.ts`。

什么时候新建目录：

- 新增业务模块 `src/modules/post/` 时，对应加 `src/test/modules/post/`。
- 新增基础设施如 `src/infra/cache/memory-cache.ts` 时，测试放 `src/test/infra/memory-cache.test.ts`。
- 没有测试的目录不用提前建空目录。

不需要做的：

- 不搞 `__tests__` 目录或 `*.spec.ts` 命名，统一用 `.test.ts`。
- 不提前建 `helpers/`、`fixtures/`、`utils/` 子目录。确实出现多个测试共用的工具代码时，加一个 `src/test/helpers/` 就够。

### 为什么放 `src/test/` 而不是 `apps/momo/test/`

- `#momo/` 和 `@fifa/` 路径别名直接可用，和源码 import 方式一致。
- `tsup` 只编译指定入口文件，`test/` 目录天然不会被打包。
- Vitest 默认匹配 `**/*.test.ts`，在 `src/` 下直接识别，不用额外配。

## 测试编写规则

### 接口测试

用 Hono 的 `app.request()` 发请求，不需要启动真实端口。

```typescript
import app from '#momo/app'

const response = await app.request('/health')
const body = await response.json()

expect(response.status).toBe(200)
```

### 工具函数和基础设施测试

直接 import 被测函数，传参数、验结果。

```typescript
import { getMomoEnv } from '#momo/shared/env'

expect(() => getMomoEnv({ APP_ENV: 'development' })).toThrow()
```

### 中间件测试

构造一个临时 Hono app，挂上要测的中间件，用 `app.request()` 触发。

```typescript
import { createRequestLogMiddleware } from '#momo/middleware'

const app = new Hono()
app.use('*', createRequestLogMiddleware(mockLogger))
app.get('/demo', (c) => c.text('ok'))

await app.request('/demo')
expect(mockLogger.info).toHaveBeenCalled()
```

### 通用规则

- 一个 `describe` 块对应一个被测文件或一组紧密相关的功能。
- `it` 描述用中文或英文都行，和当前文件已有风格保持一致。
- mock 只 mock 外部依赖（数据库、日志），不 mock 被测模块内部逻辑。
- 测试之间不共享可变状态。
- Momo 认证和内容接口测试读取 `apps/momo/.env.test`，使用 `momo_test` 数据库。先运行 `pnpm --filter @xdd-zone/momo local:up`，测试会自动创建 `momo_test`、执行 migration，并清理这个测试库里的表。
- Momo 测试通过 `apps/momo/vitest.config.ts` 关闭文件并行，避免多个数据库接口测试同时重建同一个测试库。
- Fifa 测试读取 `apps/fifa/.env.test`。当前只测前端请求解析和路由权限判断，不需要启动 Momo。
- Fifa 测试通过 `apps/fifa/vitest.config.ts` 配置 `@fifa` 路径别名和 Vitest 运行环境。

## 检查命令

### 根目录

```bash
pnpm format:check
pnpm lint
pnpm type-check
```

如果要直接格式化：

```bash
pnpm format
```

### Fifa

```bash
pnpm lint:fifa
pnpm type-check:fifa
cd apps/fifa && pnpm test
pnpm build:fifa
```

### Momo

```bash
pnpm type-check:momo
pnpm build:momo
cd apps/momo && pnpm test
```

### Bobo

```bash
pnpm lint:bobo
pnpm type-check:bobo
pnpm build:bobo
pnpm --filter @xdd-zone/bobo test
```

只改 `apps/bobo` 的 Markdown 时，可以只跑：

```bash
pnpm --filter @xdd-zone/bobo format:check
```

### 只改文档

只改 `docs/` 或 README 时，当前没有单独的 Markdown 检查命令。

手动确认：

- 文档里的路径存在。
- 文档里的命令存在。
- 文档没有写当前代码里没有的接口、页面、目录和环境变量。
