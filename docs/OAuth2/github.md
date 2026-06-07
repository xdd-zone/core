# GitHub OAuth 状态

当前仓库没有实现 GitHub OAuth。

## 当前情况

- `apps/nexus` 没有 GitHub 登录接口。
- `apps/nexus` 没有 OAuth 配置文件。
- `apps/console` 没有登录页和 GitHub 登录按钮。
- 当前不需要 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`。

## 当前可用接口

当前 Nexus 只有：

- `GET /`
- `GET /health`
- `GET /api/example`

## 如果以后要加 GitHub 登录

先补实际代码，再更新这份文档。

文档里需要写清：

- GitHub OAuth App 怎么填。
- 后端环境变量。
- 后端回调接口。
- 前端登录入口。
- 本地验证步骤。
