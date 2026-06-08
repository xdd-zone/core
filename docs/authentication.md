# 认证状态

当前仓库没有实现认证。

## 当前情况

- `apps/nexus` 没有登录、登出和 session 接口。
- `apps/console` 没有登录页。
- 当前没有 Better Auth、OAuth、cookie session 或路由守卫代码。
- 当前没有认证环境变量要求。

## 当前可用接口

认证相关接口不存在。

当前 Nexus 只有：

- `GET /`
- `GET /health`
- `POST /rpc/system/ping`

## 如果以后要加认证

先补后端接口和前端页面，再更新这份文档。

文档里需要写清：

- 代码位置。
- 环境变量。
- 登录、登出和读取当前用户的接口。
- 前端页面入口。
- 本地验证命令。
