module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // JavaScript/TypeScript rules
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-console': ['warn', { 
      'allow': ['warn', 'error'] 
    }],
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'warn',
    'prefer-arrow-callback': 'warn',
    'prefer-template': 'warn',
    
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // Chrome Extension specific
    'no-undef': 'off' // Chrome APIs are global
  },
  globals: {
    // Chrome Extension APIs
    'chrome': 'readonly',
    'browser': 'readonly',
    
    // Libraries loaded via manifest
    'marked': 'readonly',
    'mermaid': 'readonly',
    'jsPDF': 'readonly',
    'html2canvas': 'readonly',
    
    // Custom classes
    'TOCGenerator': 'readonly',
    'SearchEngine': 'readonly',
    'ThemeManager': 'readonly',
    'Toolbar': 'readonly'
  },
  ignorePatterns: [
    'node_modules/',
    'lib/',
    '*.min.js',
    'build/',
    'dist/',
    'docs/',
    'coverage/'
  ],
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    },
    {
      files: ['background.js', 'content.js'],
      rules: {
        'no-console': 'off' // Allow console in extension scripts for debugging
      }
    }
  ]
};