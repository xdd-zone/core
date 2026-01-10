# 项目架构

## 目录结构

```
src/
├── core/                  # 核心基础设施
│   ├── bootstrap/         # 应用启动流程
│   │   ├── index.ts       # Bootstrap 入口
│   │   ├── openapi.ts     # OpenAPI 设置
│   │   ├── plugins.ts     # 全局插件注册
│   │   ├── routes.ts      # 路由注册
│   │   ├── lifecycle.ts   # 生命周期钩子
│   │   └── server.ts      # 服务器启动
│   ├── config/            # 配置管理
│   │   ├── index.ts       # 配置聚合
│   │   ├── app.config.ts  # 应用配置
│   │   ├── database.config.ts  # 数据库配置
│   │   ├── logger.config.ts     # 日志配置
│   │   ├── openapi.config.ts    # OpenAPI 配置
│   │   └── better-auth.config.ts # Better Auth 配置
│   ├── plugins/           # Elysia 插件
│   │   ├── index.ts       # 插件聚合
│   │   ├── response.plugin.ts  # 统一响应格式
│   │   ├── error.plugin.ts     # 错误处理
│   │   └── module.plugin.ts    # 模块工厂
│   ├── guards/            # 守卫和装饰器
│   │   ├── index.ts
│   │   ├── auth.guard.ts  # 认证守卫
│   │   ├── permission.guard.ts # 权限守卫
│   │   └── permission.decorator.ts # 权限装饰器
│   ├── permissions/       # 权限系统
│   │   ├── index.ts
│   │   ├── permissions.ts      # 权限定义
│   │   ├── permission.service.ts # 权限服务
│   │   ├── helpers.ts          # 权限助手
│   │   └── permissions.types.ts # 权限类型
│   ├── decorators/        # 装饰器
│   └── index.ts           # 核心导出
├── modules/               # 业务模块
│   ├── auth/              # 认证模块（Better Auth）
│   │   ├── index.ts       # 路由定义
│   │   ├── auth.service.ts    # 业务逻辑
│   │   ├── auth.model.ts      # Zod 验证模型
│   │   └── auth.types.ts      # 类型定义
│   ├── user/              # 用户模块
│   │   ├── index.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── user.model.ts
│   │   └── user.types.ts
│   └── rbac/              # RBAC 权限模块
│       ├── index.ts
│       ├── rbac.service.ts
│       ├── repositories/      # 数据访问层
│       │   ├── index.ts
│       │   ├── role.repository.ts
│       │   ├── permission.repository.ts
│       │   ├── user-role.repository.ts
│       │   └── role-permission.repository.ts
│       ├── rbac.model.ts
│       └── rbac.types.ts
├── infrastructure/        # 基础设施
│   ├── database/          # 数据库
│   │   ├── prisma/
│   │   │   ├── schema/        # 多文件 schema
│   │   │   │   ├── user.prisma
│   │   │   │   ├── account.prisma
│   │   │   │   ├── session.prisma
│   │   │   │   ├── verification.prisma
│   │   │   │   ├── role.prisma
│   │   │   │   ├── permission.prisma
│   │   │   │   ├── user-role.prisma
│   │   │   │   └── role-permission.prisma
│   │   │   ├── migrations/    # 数据库迁移
│   │   │   ├── seed/          # 种子数据
│   │   │   └── generated/     # Prisma 生成
│   │   └── index.ts
│   ├── logger/            # 日志系统
│   └── index.ts
├── shared/                # 共享工具和常量
├── app.ts                 # Elysia 应用实例
└── index.ts               # 应用入口
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
