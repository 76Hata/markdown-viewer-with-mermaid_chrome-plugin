module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',

        // Chrome Extension APIs
        chrome: 'readonly',
        browser: 'readonly',

        // Libraries loaded via manifest
        marked: 'readonly',
        mermaid: 'readonly',
        jsPDF: 'readonly',
        html2canvas: 'readonly',

        // Custom classes
        TOCGenerator: 'readonly',
        SearchEngine: 'readonly',
        ThemeManager: 'readonly',
        Toolbar: 'readonly',
      },
    },
    rules: {
      // JavaScript rules
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: 'warn',
      curly: 'error',
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      'no-console': 'off', // Allow console in Chrome extension for debugging
    },
  },
  {
    ignores: [
      'node_modules/',
      'lib/',
      '*.min.js',
      'build/',
      'dist/',
      'docs/',
      'coverage/',
      '*-test.md',
      '*-debug.md',
    ],
  },
];
import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: "./tsconfig.json", // tsconfigが必要
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules // 推奨ルールを展開
    }
  }
];
