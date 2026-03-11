import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: false,
  vue: true,
  pnpm: false,
  ignores: [
    '**/package.json',
  ],
}, {
  rules: {
    'antfu/no-top-level-await': 'off',
  },
})
