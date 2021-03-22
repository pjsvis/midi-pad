module.exports = {
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/typescript',
    'plugin:import/warnings',
    'prettier'
  ],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true,
    jest: true,
    es6: true
  },
  root: true,
  rules: {
    'import/prefer-default-export': 2,
    semi: ['error', 'never'],
    'prettier/prettier': [
      2,
      {
        arrowParens: 'avoid',
        bracketSpacing: true,
        endOfLine: 'lf',
        printWidth: 80,
        semi: false,
        singleQuote: true,
        svelteBracketNewLine: true,
        svelteSortOrder: 'scripts-styles-markup',
        svelteStrictMode: true,
        tabWidth: 2,
        useTabs: false
      }
    ]
  },
  plugins: ['html', 'prettier', 'svelte3'],
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3'
    }
  ]
}