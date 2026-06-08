import nextPlugin from '@next/eslint-plugin-next'
import baseConfig from '@xdd-zone/eslint-config'

export default baseConfig.append({
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
  ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  plugins: {
    '@next/next': nextPlugin,
  },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-console': ['off', { allow: ['warn', 'error', 'info'] }],
  },
})
