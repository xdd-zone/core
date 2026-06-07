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

- Console: `http://localhost:5173`
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

当前后端入口：

- `apps/nexus/src/index.ts`

新增接口先放这里。路由处理函数直接返回 Hono response，比如 `c.json(...)`。

改完后按范围跑：

```bash
pnpm type-check:nexus
pnpm build:nexus
```

## 改前端页面

常改文件：

- `apps/console/src/app/router/routes.tsx`
- `apps/console/src/app/navigation/navigation.ts`
- `apps/console/src/pages`
- `apps/console/src/layout`

新增页面通常同时改路由、菜单和页面组件。

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
