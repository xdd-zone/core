# OpenAI SDK 原生接入指南

本文介绍如何在 Node.js 或前端项目中直接使用官方 `openai` NPM 包调用符合 OpenAI 协议的 LLM 接口。

## 1. 安装依赖

在项目根目录下执行以下命令安装官方 SDK：

```bash
npm install openai
```

---

## 2. 初始化客户端

使用 `new OpenAI` 实例化客户端。如果调用第三方兼容平台（如 DeepSeek、OpenRouter 等），需要修改 `baseURL`。

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  // 传入你的 API Key
  apiKey: process.env.OPENAI_API_KEY || "your-api-key",
  // 如果调用非 OpenAI 官方接口，需指定对应的接口根地址
  // 例如调用 DeepSeek：https://api.deepseek.com/v1
  baseURL: "https://api.openai.com/v1",
  // 如果在浏览器等前端环境直接调用，必须设置此项，否则 SDK 会报错阻止运行
  dangerouslyAllowBrowser: true,
  // 可选：配置全局请求头，比如某些网关要求的身份标识
  defaultHeaders: {
    "X-Client-Name": "my-app",
  },
});
```

---

## 3. 调用标准聊天接口 (Chat Completions)

标准聊天接口对应 `/v1/chat/completions` 端点，是最通用的调用方式。

### 3.1 非流式调用（一次性返回）

适用于单次问答或不需要等待打字机效果的场景。

```typescript
async function getCompletion() {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o", // 替换为目标模型名称
      messages: [
        { role: "system", content: "你是一个得力的助手。" },
        { role: "user", content: "讲个笑话" }
      ],
      // 限制最大输出 token 数
      max_completion_tokens: 1024,
      // 控制随机性，0 最稳定，1 最随机
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;
    console.log("回复内容:", reply);
    console.log("Token 使用量:", response.usage);
  } catch (error) {
    handleError(error);
  }
}
```

### 3.2 流式调用与思维链解析

流式调用可以通过迭代器实时获取模型输出。如果使用的模型支持深度思考（如 DeepSeek-R1 或 OpenAI o1/o3-mini），需要同时处理思维链内容。

```typescript
async function getStreamCompletion() {
  try {
    const responseStream = await client.chat.completions.create({
      model: "deepseek-reasoner", // 示例模型
      messages: [
        { role: "user", content: "为什么天空是蓝色的？" }
      ],
      stream: true,
      // 开启流式响应的 Token 使用量统计
      stream_options: {
        include_usage: true
      }
    });

    for await (const chunk of responseStream) {
      // 1. 获取普通文本内容
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
      }

      // 2. 获取思维链/深度思考内容
      // 不同平台和模型的思维链字段名可能不同，以下是常见的几种兼容写法
      const delta = chunk.choices[0]?.delta as any;
      const reasoningContent = delta?.reasoning_content || delta?.reasoning || delta?.reasoning_text;
      if (reasoningContent) {
        process.stdout.write(`[思考中: ${reasoningContent}]`);
      }

      // 3. 获取 Token 统计数据（通常在最后一个 chunk 返回）
      if (chunk.usage) {
        console.log("\n流式调用结束。统计数据:", chunk.usage);
      }
    }
  } catch (error) {
    handleError(error);
  }
}
```

---

## 4. 调用 OpenAI 新 Responses 接口

OpenAI SDK 较新版本中引入了 `responses` 资源，使用 `input` 参数代替 `messages`。**注意：此接口目前主要在 OpenAI 官方特定模型上支持，第三方兼容平台大多不支持。**

```typescript
async function getResponsesStream() {
  try {
    const responseStream = await client.responses.create({
      model: "gpt-4o",
      // 注意：这里使用的是 input，而非 messages
      input: [
        { role: "user", content: "介绍一下响应式设计" }
      ],
      stream: true,
    });

    for await (const chunk of responseStream) {
      // 解析流式响应，具体字段结构需参考 OpenAI 最新 SDK 文档
      console.log(chunk);
    }
  } catch (error) {
    handleError(error);
  }
}
```

---

## 5. 踩坑点与边界处理

### 5.1 跨域与安全限制
在浏览器或 Web 前端环境直接实例化 `new OpenAI` 时，如果不传 `dangerouslyAllowBrowser: true` 会直接报错抛出异常。
**注意：** 在前端直接硬编码 `apiKey` 会有密钥泄露风险。最稳妥的做法是在你自己的后端服务做中转代理，或者通过接口动态下发临时 Token。

### 5.2 请求超时与手动取消 (Abort)
如果网络环境不好，或者模型生成内容过长导致卡死，需要支持手动中断请求。可以通过 `AbortController` 实现：

```typescript
const controller = new AbortController();

// 启动请求
client.chat.completions.create(
  {
    model: "gpt-4o",
    messages: [{ role: "user", content: "写一篇长文" }],
    stream: true,
  },
  { signal: controller.signal } // 将信号传给 SDK
);

// 需要取消时执行
// controller.abort();
```

### 5.3 兼容服务商的 Token 统计差异
在流式传输中，标准的 OpenAI 协议要求通过指定 `stream_options: { include_usage: true }`，并在流的最后一个 chunk 返回 `usage` 数据（此时 choices 数组为空）。
但部分非标准服务商（如 Moonshot 等）可能不会遵守此规范，而是将 `usage` 放在 `choices[0].usage` 中，甚至直接不返回。在编写多平台适配逻辑时，需要做如下兼容判断：

```typescript
let usage = chunk.usage || (chunk.choices[0] as any)?.usage;
if (usage) {
  // 记录或累加 Token 消耗
}
```

### 5.4 错误处理与解析
SDK 抛出的错误可以转换为 `APIError`，其中包含 HTTP 状态码和底层报错信息。

```typescript
function handleError(error: unknown) {
  if (error instanceof Error) {
    const apiError = error as any;
    if (typeof apiError.status === "number") {
      console.error(`API 报错 (状态码 ${apiError.status}):`, apiError.message);
      return;
    }
    console.error("常规错误:", error.message);
  } else {
    console.error("未知错误:", error);
  }
}
```
