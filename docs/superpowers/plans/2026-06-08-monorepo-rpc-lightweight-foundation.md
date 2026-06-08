# Monorepo RPC Lightweight Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给当前 monorepo 补上清楚的 Hono RPC 类型入口、Console 类型依赖声明和对应文档说明。

**Architecture:** 保留当前 `apps/*` 和 `packages/*` 结构。`packages/contracts` 继续作为前后端共用接口约定包，`apps/nexus` 新增只导出 RPC 类型的入口，`apps/console` 通过 `import type` 拿 Nexus 路由类型并用 `hc<AppType>()` 调接口。

**Tech Stack:** pnpm workspace, Turborepo, TypeScript, Hono, Hono RPC client, React, Vite.

---

## File Structure

- Create: `apps/nexus/src/rpc.ts`
  只导出 Hono RPC 使用的 `AppType` 类型。
- Modify: `apps/nexus/package.json`
  给 `@xdd-zone/nexus` 增加 `./rpc` 子路径导出。
- Modify: `apps/console/src/api/client.ts`
  从 `@xdd-zone/nexus/rpc` 引入 `AppType`。
- Modify: `apps/console/src/api/system/ping.ts`
  去掉 RPC 响应的手写类型断言。
- Modify: `apps/console/package.json`
  把 `@xdd-zone/nexus` 从 `dependencies` 移到 `devDependencies`。
- Modify: `README.md`
  补上 `packages/contracts` 和当前包结构。
- Modify: `docs/architecture.md`
  写清 `contracts` 和 RPC 类型入口。
- Modify: `docs/development.md`
  补充新增接口时的处理顺序。

---

### Task 1: Nexus RPC 类型入口

**Files:**
- Create: `apps/nexus/src/rpc.ts`
- Modify: `apps/nexus/package.json`

- [ ] **Step 1: 新增 RPC 类型入口文件**

Create `apps/nexus/src/rpc.ts`:

```ts
export type { RoutesType as AppType } from '#nexus/routes'
```

- [ ] **Step 2: 增加 `./rpc` 子路径导出**

Modify `apps/nexus/package.json` `exports` to:

```json
"exports": {
  ".": {
    "types": "./src/app.ts",
    "import": "./src/app.ts",
    "default": "./src/app.ts"
  },
  "./rpc": {
    "types": "./src/rpc.ts",
    "import": "./src/rpc.ts",
    "default": "./src/rpc.ts"
  }
}
```

- [ ] **Step 3: 运行 Nexus 类型检查**

Run:

```bash
pnpm type-check:nexus
```

Expected: command exits with code 0.

- [ ] **Step 4: 提交 RPC 类型入口改动**

Run:

```bash
git add apps/nexus/src/rpc.ts apps/nexus/package.json
git commit -m "chore(nexus): add rpc type export"
```

Expected: commit succeeds.

---

### Task 2: Console 使用 RPC 类型入口

**Files:**
- Modify: `apps/console/src/api/client.ts`
- Modify: `apps/console/src/api/system/ping.ts`
- Modify: `apps/console/package.json`

- [ ] **Step 1: 修改 Console RPC 类型 import**

Modify `apps/console/src/api/client.ts` to:

```ts
import type { AppType } from '@xdd-zone/nexus/rpc'
import { getConsoleEnv } from '@console/env'
import { hc } from 'hono/client'

const consoleEnv = getConsoleEnv()
const nexusBaseUrl = consoleEnv.VITE_NEXUS_BASE_URL

export const nexusClient = hc<AppType>(nexusBaseUrl)

export { consoleEnv, nexusBaseUrl }
```

- [ ] **Step 2: 去掉 RPC 响应类型断言**

Modify `apps/console/src/api/system/ping.ts` to:

```ts
import type { ApiResponse, PingRequest, PingResponse } from '@xdd-zone/contracts'
import { BizCode } from '@xdd-zone/contracts'

import { nexusClient } from '../client'

export async function pingNexus(payload: PingRequest): Promise<ApiResponse<PingResponse>> {
  try {
    const response = await nexusClient.rpc.system.ping.$post({
      json: payload,
    })

    return await response.json()
  } catch (error) {
    return {
      ok: false,
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: error instanceof Error ? error.message : 'Nexus 请求失败',
      },
      meta: {
        requestId: 'unavailable',
        timestamp: new Date().toISOString(),
      },
    }
  }
}
```

- [ ] **Step 3: 调整 Console 对 Nexus 的依赖位置**

Modify `apps/console/package.json`:

- Remove from `dependencies`:

```json
"@xdd-zone/nexus": "workspace:*"
```

- Add to `devDependencies`:

```json
"@xdd-zone/nexus": "workspace:*"
```

- [ ] **Step 4: 运行 Console 类型检查**

Run:

```bash
pnpm type-check:console
```

Expected: command exits with code 0.

- [ ] **Step 5: 提交 Console RPC 调整**

Run:

```bash
git add apps/console/src/api/client.ts apps/console/src/api/system/ping.ts apps/console/package.json
git commit -m "chore(console): use nexus rpc type entry"
```

Expected: commit succeeds.

---

### Task 3: 同步文档说明

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/development.md`

- [ ] **Step 1: 更新 README 包列表和目录结构**

Modify `README.md`:

- In "现在有哪些包", add:

```md
- `@xdd-zone/contracts`
  Console 和 Nexus 共用的接口 schema、请求类型、响应类型和错误码，放在 `packages/contracts`。
```

- In repository tree, include:

```text
packages/
├── contracts/
└── eslint-config/
```

- In frequently viewed directories, add:

```md
- `packages/contracts`
  Console 和 Nexus 共用的接口约定。
```

- [ ] **Step 2: 更新 architecture 文档**

Modify `docs/architecture.md`:

- Ensure "当前包" lists `packages/contracts`.
- Under `packages/contracts`, include:

```md
`packages/contracts` 只放 Console 和 Nexus 都要用的接口 schema、请求类型、响应类型和错误码。
页面代码、前端组件、业务 hooks 和只服务单个应用的函数继续放在对应 app 里。
```

- Under `apps/nexus`, include:

```md
`apps/nexus/src/rpc.ts` 只导出 `AppType` 类型，给 Console 的 Hono RPC client 使用。
Console 从 `@xdd-zone/nexus/rpc` 通过 `import type` 引入这个类型。
```

- [ ] **Step 3: 更新 development 文档**

Modify `docs/development.md` "改后端接口" section to include:

```md
新增接口时按这个顺序处理：

1. 在 `packages/contracts/src/<module>` 写请求 schema 和响应类型。
2. 在 `apps/nexus/src/modules/<module>/<module>.route.ts` 用链式写法注册路由。
3. 在 `apps/nexus/src/routes/index.ts` 用 `route()` 挂载模块路由，并接住返回值。
4. 在 Console 里通过 `nexusClient.<path>.$get()` 或 `nexusClient.<path>.$post()` 调 Nexus，不手写接口 URL。

Console 的 RPC 类型从 `@xdd-zone/nexus/rpc` 引入，只使用 `import type`。
```

- [ ] **Step 4: 检查文档路径**

Run:

```bash
test -d packages/contracts
test -f apps/nexus/src/routes/index.ts
test -f apps/console/src/api/client.ts
```

Expected: all commands exit with code 0.

- [ ] **Step 5: 提交文档同步**

Run:

```bash
git add README.md docs/architecture.md docs/development.md
git commit -m "docs: clarify monorepo rpc boundaries"
```

Expected: commit succeeds.

---

### Task 4: 最终验证

**Files:**
- Verify: all modified files

- [ ] **Step 1: 运行全仓库类型检查**

Run:

```bash
pnpm type-check
```

Expected: command exits with code 0.

- [ ] **Step 2: 运行全仓库构建**

Run:

```bash
pnpm build
```

Expected: command exits with code 0.

- [ ] **Step 3: 运行 Nexus 测试**

Run:

```bash
cd apps/nexus
pnpm test
```

Expected: command exits with code 0.

- [ ] **Step 4: 查看最终工作区状态**

Run:

```bash
git status --short
```

Expected: no unrelated files changed. If only build output files are changed, inspect them before deciding whether to keep or clean.

- [ ] **Step 5: 提交验证记录不需要单独 commit**

No commit is needed for this task unless verification requires fixing code or docs. If a fix is needed, commit with a message matching the changed area, such as:

```bash
git add <fixed-files>
git commit -m "fix: repair rpc foundation verification"
```
