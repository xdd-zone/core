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
