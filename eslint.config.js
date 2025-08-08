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
  // TypeScript configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        
        // Chrome Extension APIs
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
    rules: {
      // TypeScript-specific rules can be added here
      'no-unused-vars': 'off', // TypeScript handles this
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: 'warn',
      curly: 'error',
    },
  },
];
