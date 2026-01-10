# 常见问题

## Prisma Client 未生成

修改 schema 后必须运行：

```bash
bun run prisma:generate
```

## 数据库连接失败

1. 检查 `.env` 文件中的 `DATABASE_URL` 是否正确
2. 确保 PostgreSQL 服务正在运行
3. 验证数据库用户名、密码和数据库名称

## 端口被占用

修改 `config.yaml` 中的 `port` 配置：

```yaml
port: 7788
```

## 类型错误

运行类型检查命令：

```bash
bun run type-check
```

## Better Auth Session 问题

1. 确保在请求中正确携带 cookie
2. 检查 `BETTER_AUTH_SECRET` 和 `BETTER_AUTH_URL` 配置
3. 使用 `/api/auth/get-session` 端点验证 session 状态
