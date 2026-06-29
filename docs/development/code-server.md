# code-server 内开发

这个文件只放 XDD Core 仓库里需要知道的入口。

喜东东有时会在 code-server Web IDE 里开发。浏览器调试时需要 HTTPS 域名访问开发服务，所以个人环境里给 Momo、Fifa 和 Bobo 配了 3 个 dev 域名。

本地开发仍然用：

```sh
pnpm dev
```

在 code-server 里开发也用同一个命令：

```sh
pnpm dev
```

这个命令读取各应用自己的 `.env.development`：

```text
/Users/wuwanzhu/Code/xdd/core/apps/momo/.env.development
/Users/wuwanzhu/Code/xdd/core/apps/fifa/.env.development
/Users/wuwanzhu/Code/xdd/core/apps/bobo/.env.development
```

## 个人环境维护位置

dev 域名、frp、Caddy、OAuth 回调地址和排查命令维护在个人目录：

```text
/Users/wuwanzhu/Projects/code-server-frp-maintenance/README.md
/Users/wuwanzhu/Projects/code-server-frp-maintenance/xdd-core-dev-maintenance.md
```

这里不维护服务器端口、frp 配置和公网域名细节。修改这些内容时，去上面的个人维护目录改。

## 项目内只保留的约定

如果个人 dev 域名继续指向本机服务，应用端口保持：

```text
Momo: 127.0.0.1:7788
Fifa: 127.0.0.1:2333
Bobo: 127.0.0.1:4399
```

相关环境变量仍然写在各应用自己的 `.env.development`。例如 Momo 的 `BETTER_AUTH_URL`、Fifa 的 `VITE_MOMO_BASE_URL`、Bobo 的 `BOBO_ALLOWED_DEV_ORIGINS`。

如果只在普通本地浏览器开发，直接用 localhost 地址，不需要看个人 frp 维护文档。
