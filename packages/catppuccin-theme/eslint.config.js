import config from '@xdd-zone/eslint-config'

export default config.append({
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: ['node:*'],
      },
    ],
  },
})
