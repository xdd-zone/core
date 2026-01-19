import antfu from '@antfu/eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier'

export default antfu(
  {
    typescript: true,
    formatters: true,
    markdown: false,
    node: false,
    rules: {
      'node/prefer-global/process': 'off',
      'node/prefer-global/buffer': 'off',
      'jsdoc/check-param-names': 'off',
      'antfu/if-newline': 'off',
    },
    ignores: [
      // Prisma 生成文件
      '**/prisma/generated',
      // 其他生成文件
      '*.generated.ts',
      '*.generated.js',
    ],
  },
  eslintConfigPrettier,
)
