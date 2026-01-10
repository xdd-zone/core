# Elysia with Bun runtime

基于 Elysia 框架和 Bun 运行时构建的 RESTful API 服务器，提供用户管理、身份认证和 RBAC 权限控制。

## 特性

- 🚀 **高性能**: 使用 Bun 运行时和 Elysia 框架
- 📝 **类型安全**: 完整的 TypeScript 支持
- 🗄️ **数据库**: Prisma ORM + PostgreSQL (多文件 schema)
- 📊 **日志系统**: Pino 结构化日志
- 📖 **API 文档**: 自动生成 OpenAPI/Swagger 文档
- 🏗️ **分层架构**: 清晰的分层架构 (Routes -> Service -> Repository)
- 🧪 **测试数据库**: 内置 Docker 测试数据库支持

## 快速开始

### 环境要求

- Bun >= 1.0
- PostgreSQL >= 15
- Docker (可选，用于测试数据库)

### 安装依赖

```bash
bun install
```

### 配置环境变量

复制并配置环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# 应用配置
NODE_ENV="development"
```

### 数据库初始化

```bash
# 生成 Prisma Client
bun run prisma:generate

# 运行数据库迁移
bun run prisma:migrate

# 填充初始数据（可选）
bun run seed
```

### 启动开发服务器

```bash
bun run dev
```

服务器将在 `http://localhost:3000` 启动。

### 访问 API 文档

启动服务后，访问 OpenAPI 文档：

```
http://localhost:3000/api/docs
```

## 项目结构

```
src/
├── core/                  # 核心基础设施
│   ├── bootstrap/         # 应用启动流程
│   ├── config/            # 配置管理（环境变量 + YAML）
│   ├── plugins/           # Elysia 插件（响应、错误、模块）
│   ├── guards/            # 守卫（权限、认证）
│   └── decorators/        # 装饰器
├── modules/               # 业务模块
│   └── user/              # 用户模块示例
│       ├── index.ts       # 路由定义
│       ├── user.service.ts    # 业务逻辑
│       ├── user.repository.ts # 数据访问
│       ├── user.model.ts      # Zod 验证模型
│       └── user.types.ts      # 类型定义
├── infrastructure/        # 基础设施
│   ├── database/          # 数据库（Prisma、客户端）
│   └── logger/            # 日志系统
├── shared/                # 共享工具和常量
├── app.ts                 # Elysia 应用实例
└── index.ts               # 应用入口
```

## 可用命令

### 开发命令

```bash
# 开发模式（热重载）
bun run dev

# 类型检查
bun run type-check

# 生成 Prisma Client（schema 修改后必须执行）
bun run prisma:generate
```

### 数据库命令

```bash
# 创建并应用新迁移
bun run prisma:migrate

# 重置数据库（删除所有数据并重新迁移）
bun run prisma:reset

# 填充种子数据
bun run seed
```

## 配置说明

项目使用双层配置系统：

1. **环境变量** (`.env`): 数据库 URL、密钥等敏感信息
2. **YAML 配置** (`config.yaml`): 应用设置（端口、日志级别等）

### 配置项示例

```yaml
# config.yaml
server:
  port: 3000
  prefix: /api

openapi:
  enabled: true
  path: /docs

logger:
  level: info
  pretty: true
```

## API 响应格式

所有 API 响应遵循统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

- `code`: 0 表示成功，非 0 表示错误
- `message`: 人类可读的消息
- `data`: 响应数据

## 创建新模块

使用 `createModule()` 工厂创建新模块：

```typescript
// src/modules/my-module/index.ts
import { createModule } from '@/core/plugins'

export const myModule = createModule({
  prefix: '/my-resource',
  tags: ['MyResource'],
})
  .get('/', () => ({ items: [] }))
  .post('/', ({ body, ok }) => ok(body, 'Created successfully'))
```

然后在 `src/core/bootstrap/routes.ts` 中注册模块。

## 开发指南

### 添加数据库模型

1. 在 `src/infrastructure/database/prisma/schema/` 创建新的 `.prisma` 文件
2. 运行 `bun run prisma:generate`
3. 创建并应用迁移：`bun run prisma:migrate`

### 日志使用

```typescript
import { createModuleLogger } from '@/infrastructure/logger'

const logger = createModuleLogger('my-module')
logger.info({ userId: 123 }, 'User action completed')
```

### 数据库查询

```typescript
import { prisma } from '@/infrastructure/database/client'

const users = await prisma.user.findMany()
```

或使用分页助手：

```typescript
import { PrismaService } from '@/infrastructure/database/prisma.service'

const result = await PrismaService.paginate('user', { status: 'ACTIVE' }, { page: 1, pageSize: 20 })
```

## 技术栈

- **运行时**: [Bun](https://bun.sh/)
- **框架**: [Elysia](https://elysiajs.com/)
- **数据库**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **验证**: [Zod](https://zod.dev/)
- **日志**: [Pino](https://getpino.io/)
- **API 文档**: [OpenAPI (Swagger)](https://swagger.io/)

## 常见问题

### Prisma Client 未生成

修改 schema 后必须运行：

```bash
bun run prisma:generate
```

### 数据库连接失败

检查 `.env` 文件中的 `DATABASE_URL` 是否正确，并确保 PostgreSQL 服务正在运行。

### 端口被占用

修改 `config.yaml` 中的 `server.port` 配置。
