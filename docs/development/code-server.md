# code-server 开发

本地开发用：

```sh
pnpm dev
```

在 code-server 里开发用：

```sh
pnpm dev:cs
```

## 访问地址

```text
Momo: https://code.example.com/proxy/7788/
Fifa: https://code.example.com/absproxy/2333/
Bobo: https://code.example.com/absproxy/4399/
```

Momo 的 `BETTER_AUTH_URL` 要填它的对外地址。code-server 里可以写成 `https://code.example.com/proxy/7788` 这种带代理前缀的值，Momo 会按这个地址拼 `/api/auth`。

Fifa 的 `VITE_MOMO_BASE_URL` 也要填 Momo 的对外地址。登录请求会按这个地址拼 `/api/auth/sign-in/email`。

## 配置文件

本地配置放在：

```text
apps/momo/.env.development
apps/fifa/.env.development
apps/bobo/.env.development
```

code-server 配置放在：

```text
apps/momo/.env.code-server
apps/fifa/.env.code-server
apps/bobo/.env.code-server
```

不要把 code-server 的代理地址写进 `.env.development`。
