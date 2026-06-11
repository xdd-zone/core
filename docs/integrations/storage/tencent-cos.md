# 腾讯云 COS 状态

当前仓库没有接入腾讯云 COS。

## 当前情况

- `apps/momo` 没有媒体上传接口。
- `apps/momo` 没有本地文件存储或 COS 存储代码。
- 当前没有 `COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET`、`COS_REGION` 等环境变量要求。
- 当前没有 `POST /api/media/upload` 接口。

## 当前和文件存储无关的接口

当前 Momo 已有这些和文件存储无关的接口：

- `GET /`
- `GET /health`
- `POST /rpc/system/ping`
- `GET` 或 `POST /api/auth/*`
- `POST /api/auth/sign-up/email`
- `GET /rpc/fifa/auth/me`
- `GET /rpc/bobo/auth/me`

## 如果以后要加 COS

先补实际代码，再更新这份文档。

文档里需要写清：

- 上传接口路径。
- 文件存储代码位置。
- 本地存储和 COS 存储怎么切换。
- 环境变量。
- 上传、读取和删除文件怎么验证。
- 常见错误怎么查。
