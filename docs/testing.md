# 测试数据库

项目内置 Docker 测试数据库支持，用于开发测试。

## 使用方式

```bash
# 启动测试数据库（端口 5433）
bun run test-db start

# 查看测试数据库状态
bun run test-db status

# 重置测试数据库
bun run test-db reset

# 停止测试数据库
bun run test-db stop

# 交互式菜单
bun run test-db
```

## 配置

使用测试数据库时，修改 `.env`：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/test_db"
```

## 数据库信息

- **主机**: localhost
- **端口**: 5433
- **用户名**: postgres
- **密码**: postgres
- **数据库名**: test_db

## 注意事项

- 测试数据库与生产数据库使用不同的端口
- 重置测试数据库会删除所有数据
- 开发时可以使用测试数据库进行快速迭代
