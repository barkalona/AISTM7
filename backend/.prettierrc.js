module.exports = {
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.{js,jsx,ts,tsx}',
      options: {
        parser: 'babel'
      }
    },
    {
      files: '*.json',
      options: {
        parser: 'json'
      }
    }
  ]
};