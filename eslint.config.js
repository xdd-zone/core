/**
 * 根目录 ESLint 配置
 *
 * 仅用于指定全局忽略规则
 * 具体的 lint 规则由各子包的配置文件定义
 */

export default [
  {
    ignores: [
      // 依赖
      "node_modules",
      "bun.lock",
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",

      // 构建输出
      "dist",
      "build",
      ".next",
      "out",
      ".output",

      // 生成文件
      "*.generated.ts",
      "*.generated.js",
      "packages/*/dist",
      "packages/*/node_modules",

      // Prisma 生成文件
      "**/prisma/generated",

      // 环境文件
      ".env",
      ".env.*",
      "!.env.example",

      // 日志
      "logs",
      "*.log",
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      "pnpm-debug.log*",
      "lerna-debug.log*",

      // 操作系统
      ".DS_Store",
      "Thumbs.db",

      // IDE
      ".vscode",
      ".idea",
      "*.swp",
      "*.swo",
      "*~",

      // 文档
      "**/*.md",

      // 测试
      "coverage",
      ".nyc_output",

      // 其他
      ".cache",
      "temp",
      "tmp",
    ],
  },
];
