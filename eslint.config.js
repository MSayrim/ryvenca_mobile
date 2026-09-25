// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*'],
  },
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    languageOptions: { globals: { jest: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly' } },
  },
]);
