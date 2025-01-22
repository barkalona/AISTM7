module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  plugins: ['jest'],
  rules: {
    'node/exports-style': ['error', 'module.exports'],
    'node/file-extension-in-import': ['error', 'always'],
    'node/prefer-global/buffer': ['error', 'always'],
    'node/prefer-global/console': ['error', 'always'],
    'node/prefer-global/process': ['error', 'always'],
    'node/prefer-global/url-search-params': ['error', 'always'],
    'node/prefer-global/url': ['error', 'always'],
    'node/prefer-promises/dns': 'error',
    'node/prefer-promises/fs': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-process-exit': 'off',
    'node/no-unpublished-require': ['error', {
      allowModules: ['supertest']
    }]
  },
  overrides: [
    {
      files: ['tests/**/*.js', 'tests/**/*.ts'],
      rules: {
        'node/no-unpublished-require': 'off'
      }
    }
  ],
  settings: {
    jest: {
      version: 29
    }
  }
};