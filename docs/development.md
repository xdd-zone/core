# 开发指南

这份文档只写当前仓库能直接用的开发动作。

## 环境要求

- Node.js 22+
- pnpm 10+

## 安装依赖

```bash
pnpm install
```

## 依赖维护

外部依赖版本统一写在根目录 `pnpm-workspace.yaml`。
子包 `package.json` 只写自己需要哪些依赖，不直接写版本号。

当前仓库按这几类放版本：

- `catalog`
  放通用依赖，比如 `typescript`、`zod`、`hono`、`eslint`。
- `catalogs.react`
  放 React 和 React 类型包。
- `catalogs.vite`
  放 Vite 和 Vite React 插件。
- `catalogs.shiki`
  放 Shiki 相关包。
- `catalogs.next`
  放 Bobo 使用的 Next.js 相关包。

子包里按来源写依赖版本：

```json
{
  "dependencies": {
    "zod": "catalog:",
    "react": "catalog:react",
    "vite": "catalog:vite",
    "next": "catalog:next",
    "@xdd-zone/contracts": "workspace:*"
  }
}
```

新增外部依赖时按这个顺序处理：

1. 在根目录 `pnpm-workspace.yaml` 的 `catalog` 或 `catalogs.<name>` 里写版本号。
2. 在目标包的 `package.json` 里写 `catalog:` 或 `catalog:<name>`。
3. 在根目录执行 `pnpm install`。
4. 按影响范围执行检查命令。

升级外部依赖时按这个顺序处理：

1. 只改根目录 `pnpm-workspace.yaml` 里的版本号。
2. 在根目录执行 `pnpm install`，让 `pnpm-lock.yaml` 跟着更新。
3. 按影响范围执行检查命令。

删除外部依赖时按这个顺序处理：

1. 从目标包的 `package.json` 删除依赖。
2. 如果没有其他包再使用这个依赖，从根目录 `pnpm-workspace.yaml` 删除对应版本。
3. 在根目录执行 `pnpm install`。
4. 按影响范围执行检查命令。

仓库内部包使用 `workspace:*`，比如 `@xdd-zone/contracts`、`@xdd-zone/catppuccin-theme`、`@xdd-zone/eslint-config`。
内部包不写到 `catalog`。

常用检查命令：

```bash
# 全仓库检查
pnpm type-check
pnpm lint
pnpm build

# 只检查 Momo
pnpm type-check:momo
pnpm lint:momo
pnpm build:momo

# 只检查 Fifa
pnpm type-check:fifa
pnpm lint:fifa
pnpm build:fifa

# 只检查 Bobo
pnpm type-check:bobo
pnpm lint:bobo
pnpm build:bobo
```

不要在 `apps/*` 或 `packages/*` 下面新增独立的 `pnpm-lock.yaml` 或 `pnpm-workspace.yaml`。

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

code-server 里通过代理访问本机服务时，用：

```bash
pnpm dev:cs
```

具体地址和环境变量看 [code-server 开发](./development/code-server.md)。

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

- `apps/momo/src/bootstrap/create-app.ts`
- `apps/momo/src/routes/index.ts`
- `apps/momo/src/modules/<module>/<module>.route.ts`
- `apps/momo/src/modules/<module>/<module>.types.ts`
- `apps/momo/src/modules/<module>/<module>.service.ts`
- `apps/momo/src/modules/<module>/services/index.ts`
- `apps/momo/src/modules/<module>/<module>.repository.ts`
- `apps/momo/src/modules/<module>/repositories/index.ts`
- `apps/momo/src/infra/db/schema/<module>.schema.ts`
- `packages/contracts/src/<module>`

新增接口时按这个顺序处理：

1. 在 `packages/contracts/src/<module>` 写请求 schema 和响应类型。
2. 在 `apps/momo/src/modules/<module>/<module>.route.ts` 用链式写法注册路由。
3. 需要模块内部类型时，添加或修改 `<module>.types.ts`。
4. 需要业务判断时，添加或修改 `<module>.service.ts`。如果模块已经有 `services/` 目录，就放到 `services/` 里，并从 `services/index.ts` 导出。
5. 需要数据库读写时，添加或修改 `<module>.repository.ts`。如果模块已经有 `repositories/` 目录，就放到 `repositories/` 里，并从 `repositories/index.ts` 导出。
6. 需要新表或新字段时，修改 `apps/momo/src/infra/db/schema/<module>.schema.ts` 和 migration。
7. 在 `apps/momo/src/routes/index.ts` 用 `route()` 挂载模块路由。
8. 给 Momo 补接口测试。测试里要覆盖成功响应的 contract schema parse。
9. 在 Fifa 的 `apps/fifa/src/api/<module>` 里写接口函数。接口函数内部通过 `momoClient.<path>.$get()` 或 `momoClient.<path>.$post()` 调 Momo，不手写接口 URL。
10. 在 Fifa 的 `apps/fifa/src/api/<module>/<module>.query.ts` 写 TanStack Query hook。`GET` 接口用 `useQuery`，`POST` 接口用 `useMutation`。
11. 页面只调用 hook，不直接 import `momoClient`，也不手写 query key。

Momo 模块按 `contracts -> route -> types -> service -> repository -> schema` 的顺序整理类型。route 只处理 Hono 请求和响应包装，service 不接收 Hono `Context`，repository 不返回 API response DTO。具体规则看 [apps/momo.md](./apps/momo.md)。

路由处理函数直接返回 Hono response，比如 `c.json(...)`。
如果模块有 `services/index.ts`，route 从 `./services` 引入服务；如果模块有 `repositories/index.ts`，service 从 `./repositories` 引入 repository。
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
- `apps/bobo/app/(site)/page.tsx`
- `apps/bobo/app/(lab)/lab/page.tsx`
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
