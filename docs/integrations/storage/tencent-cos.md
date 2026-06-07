# 腾讯云 COS 对象存储

Nexus 的媒体文件可以写到本地目录，也可以写到腾讯云 COS。当前上传接口不变，仍然走 `POST /api/media/upload`。

## 代码位置

- `apps/nexus/src/core/config/schema.ts`
  校验 `storage` 和 `COS_*` 配置。
- `apps/nexus/src/core/config/load-config.ts`
  从环境变量读取 `STORAGE_PROVIDER`、`COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET`、`COS_REGION`。
- `apps/nexus/src/infra/storage/media-storage.ts`
  按 `storage.provider` 选择本地存储或 COS 存储。
- `apps/nexus/src/infra/storage/local-media-storage.ts`
  本地文件存储，文件写到 `apps/nexus/storage/media`。
- `apps/nexus/src/infra/storage/cos-media-storage.ts`
  COS 文件存储，调用 `cos-nodejs-sdk-v5` 的 `putObject`、`getObject`、`deleteObject`。
- `apps/nexus/src/modules/media/service.ts`
  上传、读取、删除媒体文件。这里不直接写 COS 代码。

## 配置文件

默认配置在：

```text
apps/nexus/config.yaml
```

当前默认使用本地文件：

```yaml
storage:
  provider: local
  cos:
    keyPrefix: media
    signedUrlExpires: 600
```

当前机器的实际密钥写到：

```text
apps/nexus/.env
```

示例文件在：

```text
apps/nexus/.env.example
```

## 切换到本地存储

`.env` 写：

```env
STORAGE_PROVIDER=local
```

重启 Nexus：

```bash
cd apps/nexus
bun run dev
```

上传后的文件会出现在：

```text
apps/nexus/storage/media
```

## 切换到 COS 存储

`.env` 写：

```env
STORAGE_PROVIDER=cos
COS_SECRET_ID=your-cos-secret-id
COS_SECRET_KEY=your-cos-secret-key
COS_BUCKET=your-bucket-name-appid
COS_REGION=ap-shanghai
COS_PUBLIC_BASE_URL=https://your-bucket.cos.ap-shanghai.myqcloud.com
COS_KEY_PREFIX=media
COS_SIGNED_URL_EXPIRES=600
```

重启 Nexus：

```bash
cd apps/nexus
bun run dev
```

注意：

- `COS_SECRET_ID` 和 `COS_SECRET_KEY` 不写进 `config.yaml`。
- `COS_BUCKET` 必须带 APPID，例如 `example-1250000000`。
- `COS_REGION` 只能写地域代码。上海写 `ap-shanghai`，不要写 `上海（中国）（ap-shanghai）`。
- `COS_KEY_PREFIX` 是对象 key 前缀。写 `media` 时，COS 里的对象路径类似 `media/<uuid>.png`。

## OpenAPI 上传测试

先登录 Console，让浏览器拿到 Nexus 的登录 Cookie：

```text
http://localhost:2333
```

再打开：

```text
http://localhost:7788/openapi#tag/media/POST/api/media/upload
```

操作步骤：

1. 点 `Try it out`。
2. 在 `Request body` 里选择 `multipart/form-data`。
3. 找到 `file` 字段。
4. 选择一张图片。
5. 点 `Execute`。

接口成功后返回媒体记录：

```json
{
  "id": "media-id",
  "fileName": "uuid.png",
  "originalName": "test.png",
  "mimeType": "image/png",
  "size": 1234,
  "url": "/api/media/media-id/file",
  "uploadedBy": "user-id",
  "createdAt": "2026-05-05T00:00:00.000Z",
  "updatedAt": "2026-05-05T00:00:00.000Z"
}
```

## curl 上传测试

先登录并保存 Cookie：

```bash
curl -i -c /tmp/xdd-cookie.txt \
  -H 'content-type: application/json' \
  -X POST http://localhost:7788/api/auth/sign-in/email \
  --data '{"email":"your-email@example.com","password":"your-password"}'
```

再上传图片：

```bash
curl -i -b /tmp/xdd-cookie.txt \
  -X POST http://localhost:7788/api/media/upload \
  -F 'file=@/path/to/test.png;type=image/png'
```

读取文件：

```bash
curl -i -b /tmp/xdd-cookie.txt \
  http://localhost:7788/api/media/<media-id>/file \
  -o /tmp/media-file
```

删除媒体：

```bash
curl -i -b /tmp/xdd-cookie.txt \
  -X DELETE http://localhost:7788/api/media/<media-id>
```

## 常见错误

### `Region format error.`

原因是 `COS_REGION` 填错。

错误写法：

```env
COS_REGION=上海（中国）（ap-shanghai）
```

正确写法：

```env
COS_REGION=ap-shanghai
```

改完 `.env` 后重启 Nexus。

### `媒体文件存储访问失败`

这是 Nexus 包装后的错误。先查 COS 原始错误：

1. 看 `COS_REGION` 是否只写地域代码。
2. 看 `COS_BUCKET` 是否带 APPID。
3. 看 `COS_SECRET_ID` 和 `COS_SECRET_KEY` 是否填到了 `.env`。
4. 看机器时间是否正常。COS 签名依赖时间，时间偏差可能导致签名失败。
5. 看子账号是否有 `cos:PutObject`、`cos:GetObject`、`cos:DeleteObject` 权限。

### `401`

没有登录。先在 Console 登录，或用 curl 登录后带上 Cookie。

### `403`

账号没有媒体管理权限。检查当前用户角色和 `MediaPermissions.WRITE_ALL`。

### `400`

上传的不是允许的图片类型。当前只允许：

```text
image/avif
image/gif
image/jpeg
image/png
image/webp
```

## 当前实现边界

- 数据库 `media.storagePath` 只存对象 key，不存完整 COS 地址。
- 读取文件仍走 `GET /api/media/:id/file`。
- 删除媒体记录时会调用存储驱动删除文件。
- 切换 `local` 和 `cos` 不会自动搬迁旧文件。
