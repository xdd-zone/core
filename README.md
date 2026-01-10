# XDD SPACE Core API

基于 Elysia 框架和 Bun 运行时构建的后端 API 服务器，提供用户管理、Better Auth 认证和 RBAC 权限控制。

## 特性

- 🚀 **高性能**: Bun 运行时 + Elysia 框架
- 🔐 **现代认证**: Better Auth 集成（基于 Session 的认证系统）
- 🛡️ **RBAC 权限**: 完整的基于角色的访问控制（Role-Based Access Control）
- 📝 **类型安全**: 完整的 TypeScript + Zod 验证
- 🗄️ **数据库**: Prisma 7 + PostgreSQL（多文件 schema）
- 📊 **结构化日志**: Pino 日志系统
- 📖 **API 文档**: 自动生成 OpenAPI/Swagger 文档
- 🧪 **测试支持**: 内置 Docker 测试数据库

## 快速开始

### 环境要求

- Bun >= 1.3.5
- PostgreSQL >= 15
- Docker（可选，用于测试数据库）

### 安装依赖

```bash
bun install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Better Auth 配置
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:7788"
```

### 配置应用设置

编辑 `config.yaml` 文件（可选）：

```yaml
port: 7788
prefix: api
openapi_enabled: true
logger_level: info
```

### 数据库初始化

```bash
bun run prisma:generate
bun run prisma:migrate
bun run seed  # 可选
```

### 启动开发服务器

```bash
bun run dev
```

服务器将在 `http://localhost:7788` 启动。

### 访问 API 文档

启动服务后，访问 OpenAPI 文档：

```
http://localhost:7788/openapi
```

## 文档

- [项目架构](docs/architecture.md) - 目录结构和技术栈
- [开发指南](docs/development.md) - 创建模块、认证保护、权限控制等
- [API 文档](docs/api.md) - 核心 API 端点和响应格式
- [认证系统](docs/authentication.md) - Better Auth 认证说明
- [RBAC 权限系统](docs/rbac.md) - 权限模型和权限控制
- [测试数据库](docs/testing.md) - Docker 测试数据库使用
- [常见问题](docs/faq.md) - 常见问题排查

## 开发命令

```bash
# 开发模式
bun run dev

# 类型检查
bun run type-check

# 代码质量
bun run lint
bun run lint:fix
bun run format
bun run format:check

# 数据库操作
bun run prisma:generate
bun run prisma:migrate
bun run prisma:reset
bun run seed

# 测试数据库
bun run test-db
```

## 技术栈

- **运行时**: [Bun](https://bun.sh/) 1.3.5
- **框架**: [Elysia](https://elysiajs.com/) 1.4.19
- **认证**: [Better Auth](https://www.better-auth.com/) 1.4.10
- **数据库**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) 7.2.0
- **验证**: [Zod](https://zod.dev/) 4.3.4
- **日志**: [Pino](https://getpino.io/) 10.1.0
- **API 文档**: [OpenAPI (Swagger)](https://swagger.io/)
- **代码质量**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

## 许可证

MIT License
