module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Line length
  printWidth: 80,
  
  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'avoid',
  
  // End of line
  endOfLine: 'lf',
  
  // Embedded languages
  embeddedLanguageFormatting: 'auto',
  
  // HTML
  htmlWhitespaceSensitivity: 'css',
  
  // Override for specific files
  overrides: [
    {
      files: ['*.md', '*.markdown'],
      options: {
        printWidth: 100,
        proseWrap: 'preserve'
      }
    },
    {
      files: ['*.json'],
      options: {
        printWidth: 120
      }
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    }
  ]
};