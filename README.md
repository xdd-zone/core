# XDD ZONE CORE

基于 Bun 的现代化 Monorepo 后端项目，提供 RESTful API 和 HTTP 客户端 SDK。

## 特性

- 🚀 **高性能**: 基于 Bun 1.3.5 运行时，极快的启动和执行速度
- 🔐 **完整认证**: 集成 Better Auth，支持邮箱密码登录/注册
- 🛡️ **RBAC 权限**: 基于角色的访问控制系统，细粒度权限管理
- 📊 **类型安全**: 全栈 TypeScript + Prisma ORM + Zod 验证
- 📝 **自动文档**: OpenAPI (Swagger) 自动生成 API 文档
- 🧪 **测试就绪**: Docker Compose 测试数据库，完整的测试基础设施

## 技术栈

- **运行时**: Bun 1.3.5
- **框架**: Elysia 1.4.19
- **认证**: Better Auth 1.4.10
- **数据库**: PostgreSQL + Prisma ORM 7.2.0
- **验证**: Zod 4.3.4
- **日志**: Pino 10.1.0

## 快速开始

### 环境要求

- Bun 1.3.5
- PostgreSQL 15+
- Docker（用于测试数据库）

### 安装依赖

```bash
bun install
```

### 配置环境变量

创建 `.env` 文件并配置数据库连接：

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/core_db"
```

### 启动开发服务器

```bash
bun run dev
```

服务启动后访问：
- API: http://localhost:7788
- OpenAPI 文档: http://localhost:7788/openapi

## 项目结构

```
core/
├── packages/
│   ├── nexus/          # 后端 API（主包）
│   ├── client/         # HTTP 客户端 SDK
│   └── eslint-config/  # 共享配置
├── docs/               # 项目文档
└── scripts/            # 测试数据库管理
```

### 分层架构

```
nexus/src/
├── core/     # 框架层（Bootstrap, 权限, 模块工厂）
├── infra/    # 基础设施层（Prisma, 日志）
└── modules/  # 业务模块（Auth, User, RBAC）
```

## 常用命令

### 开发

```bash
bun run dev              # 启动 nexus 开发服务器
bun run dev:client       # 启动 client 开发服务器
```

### 构建

```bash
bun run build            # 构建所有包
bun run build:nexus      # 构建 nexus 包
bun run build:client     # 构建 client 包
```

### 代码质量

```bash
bun run lint             # ESLint 检查
bun run lint:fix         # ESLint 自动修复
bun run format           # Prettier 格式化
bun run type-check       # TypeScript 类型检查
```

### 数据库

```bash
bun run prisma:generate  # 生成 Prisma 客户端
bun run prisma:migrate   # 创建并应用迁移
bun run prisma:push      # 直接推送 schema（更快）
bun run seed             # 填充种子数据
```

### 测试数据库

```bash
bun run test-db          # 交互式菜单
bun run test-db start    # 启动测试数据库（端口 5433）
bun run test-db stop     # 停止测试数据库
bun run test-db reset    # 重置测试数据库
```

## 文档

- [项目架构](./docs/architecture.md) - 详细的项目架构说明
- [API 文档](./docs/api.md) - API 端点和响应格式
- [认证系统](./docs/authentication.md) - Better Auth 集成说明
- [RBAC 权限](./docs/rbac.md) - 角色和权限管理
- [开发指南](./docs/development.md) - 开发规范和最佳实践
- [测试指南](./docs/testing.md) - 测试数据库使用说明
- [常见问题](./docs/faq.md) - 常见问题解答

## 许可证

MIT
