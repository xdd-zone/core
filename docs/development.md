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
# Fifa、Momo 和 Bobo 一起跑
pnpm dev

# 只跑后端
pnpm dev:momo

# 只跑前端
pnpm dev:fifa

# 只跑个人站点
pnpm dev:bobo
```

默认地址：

- Fifa: `http://localhost:2333`
- Momo: `http://localhost:7788`
- Bobo: `http://localhost:4399`
- Health: `http://localhost:7788/health`

## 构建命令

```bash
pnpm build
pnpm build:fifa
pnpm build:momo
pnpm build:bobo
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

- [apps/momo.md](./apps/momo.md)
- [topics/api.md](./topics/api.md)

常改文件：

- `apps/momo/src/app.ts`
- `apps/momo/src/routes/index.ts`
- `apps/momo/src/modules/<module>/<module>.route.ts`
- `apps/momo/src/modules/<module>/<module>.service.ts`
- `apps/momo/src/modules/<module>/<module>.repository.ts`
- `packages/contracts/src/<module>`

新增接口时按这个顺序处理：

1. 在 `packages/contracts/src/<module>` 写请求 schema 和响应类型。
2. 在 `apps/momo/src/modules/<module>/<module>.route.ts` 用链式写法注册路由。
3. 在 `apps/momo/src/routes/index.ts` 用 `route()` 挂载模块路由，并接住返回值。
4. 在 Fifa 的 `apps/fifa/src/api/<module>` 里写接口函数。接口函数内部通过 `momoClient.<path>.$get()` 或 `momoClient.<path>.$post()` 调 Momo，不手写接口 URL。
5. 在 Fifa 的 `apps/fifa/src/api/<module>/<module>.query.ts` 写 TanStack Query hook。`GET` 接口用 `useQuery`，`POST` 接口用 `useMutation`。
6. 页面只调用 hook，不直接 import `momoClient`，也不手写 query key。

路由处理函数直接返回 Hono response，比如 `c.json(...)`。
Fifa 的 RPC 类型从 `@xdd-zone/momo/rpc` 引入，只使用 `import type`。

改完后按范围跑：

```bash
pnpm type-check:momo
pnpm build:momo
cd apps/momo && pnpm test
```

## 改前端页面

常改文件：

- `apps/fifa/src/features/<module>/pages`
- `apps/fifa/src/features/<module>/routes.tsx`
- `apps/fifa/src/app/router/records.ts`
- `apps/fifa/src/layout`

新增页面先放到对应模块的 `pages/` 目录，再写到同模块的 `routes.tsx`。
如果新增了模块，把模块导出的路由记录加到 `apps/fifa/src/app/router/records.ts`。
菜单从页面记录生成，已有菜单组通常不用改 `app/navigation/navigation.ts`。

改完后按范围跑：

```bash
pnpm lint:fifa
pnpm type-check:fifa
pnpm build:fifa
```

## 改个人站点

先看：

- [apps/bobo.md](./apps/bobo.md)

常改文件：

- `apps/bobo/app/layout.tsx`
- `apps/bobo/app/page.tsx`
- `apps/bobo/app/lab/page.tsx`
- `apps/bobo/app/globals.css`
- `apps/bobo/app/styles`
- `apps/bobo/components`

新增页面优先放到 `apps/bobo/app/<route>/page.tsx`。
全局布局、字体、metadata 和主题初始化放在 `apps/bobo/app/layout.tsx`。
全局样式入口是 `apps/bobo/app/globals.css`。

改完后按范围跑：

```bash
pnpm lint:bobo
pnpm type-check:bobo
pnpm build:bobo
```

## 只改文档

当前仓库没有单独检查 `docs/` 的命令。

只改 Markdown 时，手动确认：

- 文档里的路径在仓库里能找到。
- 文档里的命令在 `package.json` 里存在。
- 文档没有写旧技术栈、旧接口或旧目录。
