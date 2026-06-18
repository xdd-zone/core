/**
 * XDD Zone 共享 ESLint 配置
 *
 * 使用方法:
 * import antfu from '@antfu/eslint-config'
 * export default antfu({ ...options })
 */

import antfu from '@antfu/eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier'

const baseIgnores = [
  // 依赖
  'node_modules',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',

  // 构建输出
  'dist',
  'build',
  '.next',
  'out',
  '.output',

  // 生成文件
  '*.generated.ts',
  '*.generated.js',
  '*.tsbuildinfo',
  '**/src/infra/db/migrations/meta/*.json',
  'apps/*/dist',
  'apps/*/node_modules',
  'packages/*/dist',
  'packages/*/node_modules',

  // Prisma 生成文件
  '**/prisma/generated',

  // 环境文件
  '.env',
  '.env.*',
  '!.env.example',

  // 日志
  'logs',
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  'pnpm-debug.log*',
  'lerna-debug.log*',

  // 操作系统
  '.DS_Store',
  'Thumbs.db',

  // IDE
  '.vscode',
  '.idea',
  '*.swp',
  '*.swo',
  '*~',

  // 文档
  '**/*.md',

  // 测试
  'coverage',
  '.nyc_output',

  // 其他
  '.cache',
  'temp',
  'tmp',
]

const baseRules = {
  'node/prefer-global/process': 'off',
  'node/prefer-global/buffer': 'off',
  'jsdoc/check-param-names': 'off',
  'antfu/if-newline': 'off',
}

export function createEslintConfig(options = {}, ...configs) {
  const { ignores = [], rules = {}, ...restOptions } = options

  return antfu(
    {
      ...restOptions,
      ignores: [...baseIgnores, ...ignores],
      typescript: true,
      formatters: true,
      markdown: false,
      node: false,
      rules: { ...baseRules, ...rules },
    },
    eslintConfigPrettier,
    ...configs,
  )
}

export default createEslintConfig()
