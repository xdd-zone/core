# 开发指南

这份文档只写当前仓库的常用开发动作。

## 开发前先确认

- Bun 1.3.5
- Docker 可用
- `.env` 里至少有 `DATABASE_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`
- 如果要测 GitHub 登录，再补 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`
- `packages/nexus/config.yaml` 的 `auth.trustedOrigins` 已包含当前 Console 地址

## 初始化

```bash
bun install
bun run db prepare
```

如果只想先生成 Prisma Client：

```bash
bun run prisma:generate
```

## 常用开发命令

```bash
# 前后端一起跑
bun run dev

# 只跑后端
bun run dev:nexus

# 只跑前端
bun run dev:console

# 基础检查
bun run format
bun run lint
bun run type-check
```

## 数据库约定

当前项目不维护 Prisma migration 文件，数据库结构以当前 schema 为准。

改完 schema 后：

- 可以清空数据时，优先执行：

```bash
bun run prisma:push:reset
bun run seed
```

- 不想清空数据时，执行：

```bash
bun run prisma:push
```

## 改后端接口时怎么走

默认顺序：

1. 先改 `model.ts`
2. 再改 `service.ts / repository.ts`
3. 最后改 `index.ts`
4. 跑检查

至少会碰到这些文件：

- `packages/nexus/src/modules/<feature>/model.ts`
- `packages/nexus/src/modules/<feature>/service.ts`
- `packages/nexus/src/modules/<feature>/repository.ts`
- `packages/nexus/src/modules/<feature>/index.ts`

如果接口还要给前端复用明确的 HTTP 类型，再补：

- `packages/nexus/src/public/*-types.ts`

## 改前端页面时怎么走

默认顺序：

1. 先确认后端接口和登录态约定
2. 再看页面路径和菜单是否要一起改
3. 最后补 query / mutation 和页面实现
4. 跑检查

最常改的文件：

- `packages/console/src/app/router/routes.tsx`
- `packages/console/src/app/router/guards.tsx`
- `packages/console/src/app/navigation/navigation.ts`
- `packages/console/src/app/access/access-control.ts`
- `packages/console/src/modules/*`
- `packages/console/src/pages/*`

## 代码该放哪

### 后端

- 路由、schema 绑定、鉴权声明：`modules/*/index.ts`
- HTTP schema：`modules/*/model.ts`
- 业务逻辑：`modules/*/service.ts`
- Prisma 查询：`modules/*/repository.ts`
- 认证和权限：`core/security/*`
- HTTP 公共插件：`core/http/*`
- 最终配置：`core/config/*`

### 前端

- 路由树和重定向：`app/router/*`
- 菜单：`app/navigation/*`
- 页面访问控制：`app/access/access-control.ts`
- Treaty 客户端：`shared/api/eden.ts`
- 页面侧请求逻辑：`modules/*`
- 页面组件：`pages/*`
- 布局壳层：`layout/*`

## 改认证或权限时要多看哪几处

### 认证

- `packages/nexus/src/core/security/auth/*`
- `packages/nexus/src/core/security/plugins/auth.plugin.ts`
- `packages/nexus/src/modules/auth/*`
- `packages/console/src/modules/auth/*`
- `packages/console/src/pages/auth/Login.tsx`

### 权限

- `packages/nexus/src/core/security/plugins/access.plugin.ts`
- `packages/nexus/src/core/security/guards/*`
- `packages/nexus/src/core/security/permissions/*`
- `packages/console/src/app/access/access-control.ts`

## 回归检查

### 只改文档

```bash
bun run format:check
```

### 改前端

```bash
bun run lint:console
bun run --filter @xdd-zone/console type-check
bun run build:console
```

### 改后端接口、认证、权限、OpenAPI、Eden

```bash
bun run --filter @xdd-zone/nexus type-check
bun run --filter @xdd-zone/nexus test
```

### 提交前最小检查

```bash
bun run format
bun run lint
bun run type-check
```
