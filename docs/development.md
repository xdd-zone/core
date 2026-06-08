# 开发指南

这份文档只写当前仓库能直接用的开发动作。

## 环境要求

- Node.js 22+
- pnpm 10+

## 安装依赖

```bash
pnpm install
```

## 开发命令

```bash
# 前后端一起跑
pnpm dev

# 只跑后端
pnpm dev:nexus

# 只跑前端
pnpm dev:console
```

默认地址：

- Console: `http://localhost:2333`
- Nexus: `http://localhost:7788`
- Health: `http://localhost:7788/health`

## 构建命令

```bash
pnpm build
pnpm build:console
pnpm build:nexus
```

## 检查命令

```bash
pnpm format:check
pnpm lint
pnpm type-check
```

如果要直接格式化：

```bash
pnpm format
```

## 改后端接口

先看：

- [nexus.md](./nexus.md)
- [api.md](./api.md)

常改文件：

- `apps/nexus/src/app.ts`
- `apps/nexus/src/routes/index.ts`
- `apps/nexus/src/modules/<module>/<module>.route.ts`
- `apps/nexus/src/modules/<module>/<module>.service.ts`
- `apps/nexus/src/modules/<module>/<module>.repository.ts`
- `packages/contracts/src/<module>`

新增接口时按这个顺序处理：

1. 在 `packages/contracts/src/<module>` 写请求 schema 和响应类型。
2. 在 `apps/nexus/src/modules/<module>/<module>.route.ts` 用链式写法注册路由。
3. 在 `apps/nexus/src/routes/index.ts` 用 `route()` 挂载模块路由，并接住返回值。
4. 在 Console 的 `apps/console/src/api/<module>` 里写接口函数。接口函数内部通过 `nexusClient.<path>.$get()` 或 `nexusClient.<path>.$post()` 调 Nexus，不手写接口 URL。
5. 在 Console 的 `apps/console/src/api/<module>/<module>.query.ts` 写 TanStack Query hook。`GET` 接口用 `useQuery`，`POST` 接口用 `useMutation`。
6. 页面只调用 hook，不直接 import `nexusClient`，也不手写 query key。

路由处理函数直接返回 Hono response，比如 `c.json(...)`。
Console 的 RPC 类型从 `@xdd-zone/nexus/rpc` 引入，只使用 `import type`。

改完后按范围跑：

```bash
pnpm type-check:nexus
pnpm build:nexus
cd apps/nexus && pnpm test
```

## 改前端页面

常改文件：

- `apps/console/src/features/<module>/pages`
- `apps/console/src/features/<module>/routes.tsx`
- `apps/console/src/app/router/records.ts`
- `apps/console/src/layout`

新增页面先放到对应模块的 `pages/` 目录，再写到同模块的 `routes.tsx`。
如果新增了模块，把模块导出的路由记录加到 `apps/console/src/app/router/records.ts`。
菜单从页面记录生成，已有菜单组通常不用改 `app/navigation/navigation.ts`。

改完后按范围跑：

```bash
pnpm lint:console
pnpm type-check:console
pnpm build:console
```

## 只改文档

当前仓库没有单独检查 `docs/` 的命令。

只改 Markdown 时，手动确认：

- 文档里的路径在仓库里能找到。
- 文档里的命令在 `package.json` 里存在。
- 文档没有写旧技术栈、旧接口或旧目录。
