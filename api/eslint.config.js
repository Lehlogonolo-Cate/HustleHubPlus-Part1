const js = require('@eslint/js');
const security = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'coverage/', 'logs/'] },
  js.configs.recommended,
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^(req|res|next)$' }],
      'no-console': 'off',
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error'
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.jest } }
  }
];
