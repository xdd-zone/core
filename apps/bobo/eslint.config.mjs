import { createEslintConfig } from '@xdd-zone/eslint-config'

export default createEslintConfig({ react: true, nextjs: true }).append({
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
  ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-console': ['off', { allow: ['warn', 'error', 'info'] }],
    'react/dom-no-dangerously-set-innerhtml': 'off',
    'react/no-array-index-key': 'off',
    'react/use-state': 'off',
  },
})
