import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: {
        version: '19.0.0'
      }
    }
  }
]

export default eslintConfig


