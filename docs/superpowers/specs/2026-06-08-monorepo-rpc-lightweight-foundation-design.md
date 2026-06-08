# Monorepo 和 RPC 轻量基建改造方案

## 背景

当前仓库已经是 `pnpm workspace + Turborepo` 的 monorepo。

现有包：

- `apps/console`
  前端控制台，包名是 `@xdd-zone/console`。
- `apps/nexus`
  Hono API 服务，包名是 `@xdd-zone/nexus`。
- `packages/contracts`
  Console 和 Nexus 共用的接口 schema、请求类型、响应类型和错误码，包名是 `@xdd-zone/contracts`。
- `packages/eslint-config`
  共享 ESLint / Prettier 配置，包名是 `@xdd-zone/eslint-config`。

当前 workspace、包名和 `workspace:*` 依赖已经能正常工作。Console 也已经通过 `hono/client` 调 Nexus。此次改造只补齐边界和入口，不重做项目结构。

## 改造目标

- 保留当前 `apps/*` 和 `packages/*` 目录结构。
- 保留 `packages/contracts`，不新增泛用的 `packages/shared`。
- 明确 `@xdd-zone/contracts` 是内部源码导出的接口约定包。
- 给 Nexus 增加单独的 RPC 类型入口。
- Console 只通过 `import type` 引入 Nexus RPC 类型。
- 把 Console 对 Nexus 的依赖改成开发期类型依赖。
- 去掉 Console 当前 RPC 返回值里不必要的类型断言。
- 更新 README 和 docs，让后续新增接口时按同一套规则处理。

## 不做的事

- 不新建 `packages/shared`。
- 不引入 OpenAPI、Swagger 或代码生成。
- 不重写 Nexus 路由结构。
- 不调整全部 Turborepo 任务图。
- 不删除 `packages/contracts` 的 `build` 脚本。
- 不做全仓库依赖分类整理。

## Monorepo 设计

### Workspace 范围

继续使用根目录 `pnpm-workspace.yaml`：

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

理由：

- `apps/console`、`apps/nexus`、`packages/contracts` 和 `packages/eslint-config` 已经能被 pnpm 识别。
- 当前本地包引用靠 workspace、包名和 `workspace:*` 建立，不靠目录碰巧放在一起。

### 共享包边界

保留 `packages/contracts`，只放 Console 和 Nexus 都要用的接口约定：

- 请求 schema。
- 请求类型。
- 响应类型。
- 统一响应结构。
- 业务错误码。

页面代码、前端组件、业务 hooks、页面状态和只服务单个应用的函数继续放在对应 app 里。

理由：

- `contracts` 的用途明确，后续查找和修改都直接。
- 不新建泛用 `shared`，避免把还没稳定的业务代码提前放进共享层。

### 内部包导出策略

`@xdd-zone/contracts` 继续源码导出：

```json
{
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    }
  }
}
```

理由：

- `contracts` 只在 monorepo 内部使用。
- Console 使用 Vite，Nexus 开发使用 `tsx`，Nexus 构建使用 `tsup`，都能处理 TypeScript 源码入口。
- 改 `contracts` 后不需要先构建 `dist` 才能被 Console 和 Nexus 引用。

### 依赖声明

Console 继续在 `dependencies` 里声明 `@xdd-zone/contracts`：

```json
"@xdd-zone/contracts": "workspace:*"
```

Console 把 `@xdd-zone/nexus` 从 `dependencies` 移到 `devDependencies`：

```json
"@xdd-zone/nexus": "workspace:*"
```

理由：

- Console 运行时通过 HTTP 请求 Nexus，不直接执行 Nexus 包里的服务代码。
- Console 只在 TypeScript 编译期需要 Nexus 的 RPC 类型。

## RPC 设计

### 后端路由写法

Nexus 模块路由继续使用链式写法：

```ts
const systemRoute = new Hono<HonoEnv>()
  .get('/', handler)
  .get('/health', handler)
  .post('/rpc/system/ping', validator, handler)
```

理由：

- Hono RPC 依赖 TypeScript 从链式调用里推导路由、方法、请求参数和响应类型。
- 新增接口时不能写成分散的 `app.get()`、`app.post()` 再丢掉返回值。

### 模块挂载

`apps/nexus/src/routes/index.ts` 继续接住 `route()` 返回值：

```ts
const routes = new Hono<HonoEnv>().route('/', systemRoute)

export type RoutesType = typeof routes

export default routes
```

理由：

- `app.route()` 的返回值里包含挂载后的子路由类型。
- 前端 RPC 类型要从这个返回值推导，不能从一个普通 `Hono` 实例上推导。

### RPC 类型入口

新增 `apps/nexus/src/rpc.ts`：

```ts
export type { RoutesType as AppType } from '#nexus/routes'
```

`apps/nexus/package.json` 增加 `./rpc` 子路径：

```json
"./rpc": {
  "types": "./src/rpc.ts",
  "import": "./src/rpc.ts",
  "default": "./src/rpc.ts"
}
```

理由：

- Console 需要的是 Nexus 路由类型，不是完整后端 app。
- `@xdd-zone/nexus/rpc` 这个入口只给前端拿类型，名字和用途更直接。
- `import type` 不会把 Nexus 运行时代码打进 Console。

### Console 调用方式

`apps/console/src/api/client.ts` 改成：

```ts
import type { AppType } from '@xdd-zone/nexus/rpc'
import { hc } from 'hono/client'

export const nexusClient = hc<AppType>(nexusBaseUrl)
```

现有调用保持：

```ts
const response = await nexusClient.rpc.system.ping.$post({
  json: payload,
})
```

理由：

- `hc<AppType>()` 根据 Nexus 路由类型推导调用方法。
- URL、HTTP 方法和请求体类型都从后端路由来，不在前端手写一份。

### 响应类型

`apps/console/src/api/system/ping.ts` 去掉手写断言：

```ts
return await response.json()
```

理由：

- `response.json()` 可以从 Hono RPC 类型推导返回值。
- 手写 `as ApiResponse<PingResponse>` 会绕开这层检查。

## 文档改造

需要更新：

- `README.md`
  补上 `packages/contracts`，更新当前包列表和目录结构。
- `docs/architecture.md`
  写清 `contracts` 的职责和 `@xdd-zone/nexus/rpc` 的用途。
- `docs/development.md`
  补充新增接口顺序：先写 `contracts`，再写 Nexus 链式路由，再由 Console 通过 `nexusClient` 调用。

文档只写当前实现，不展开还没做的包和流程。

## 实现步骤

1. 新增 `apps/nexus/src/rpc.ts`。
2. 修改 `apps/nexus/package.json`，增加 `./rpc` 导出。
3. 修改 `apps/console/src/api/client.ts`，从 `@xdd-zone/nexus/rpc` 引入 `AppType`。
4. 修改 `apps/console/package.json`，把 `@xdd-zone/nexus` 移到 `devDependencies`。
5. 修改 `apps/console/src/api/system/ping.ts`，去掉响应类型断言。
6. 更新 `README.md`、`docs/architecture.md` 和 `docs/development.md`。
7. 运行检查命令。

## 验证

改完后运行：

```bash
pnpm type-check
pnpm build
```

如果 Nexus 路由或测试文件有改动，再运行：

```bash
cd apps/nexus
pnpm test
```

通过标准：

- `pnpm type-check` 通过。
- `pnpm build` 通过。
- Console 能继续通过 `nexusClient.rpc.system.ping.$post()` 调用 Nexus ping。
- 文档里的包列表、目录结构和命令都能在仓库里找到。
