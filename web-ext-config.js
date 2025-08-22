// Web-ext設定ファイル
// Chrome拡張機能パッケージング最適化設定

module.exports = {
  // デフォルトソースディレクトリ
  sourceDir: './release',
  
  // 成果物出力ディレクトリ
  artifactsDir: './build',
  
  // 除外ファイル設定
  ignoreFiles: [
    // Node.js関連
    'node_modules/**',
    'package*.json',
    'npm-debug.log*',
    
    // 開発設定ファイル
    'eslint.config.js',
    'tsconfig.json',
    'typedoc.json',
    'jest.config.js',
    'jsconfig.json',
    'web-ext-config.js',
    
    // 文書ファイル
    'README.md',
    'CLAUDE.md',
    'PACKAGING.md',
    '*.md',
    
    // 開発用フォルダ
    'doc/**',
    'docs/**',
    'Diagram/**',
    'after_doc/**',
    'analysis-reports/**',
    'archive/**',
    'tests/**',
    'claude-workspace/**',
    'claude-extensions/**',
    'final-function-verification/**',
    'function-tests/**',
    'reports/**',
    
    // ビルド成果物
    'build/**',
    'dist/**',
    'coverage/**',
    'web-ext-artifacts/**',
    'release/**',
    
    // バックアップ・一時ファイル
    '*.backup',
    '.DS_Store',
    'temp_end.js',
    'chrome-extension.tar.gz',
    'exclude.txt',
    
    // Git・IDE設定
    '.git/**',
    '.github/**',
    '.gitignore',
    '.vscode/**',
    '.idea/**',
    
    // TypeScript定義（開発時のみ）
    'types/**',
    
    // その他
    'performance-test.html',
    'Chrome_Web_Store_Policy_Compliance_Report.md'
  ],
  
  // ビルド設定
  build: {
    overwriteDest: true
  },
  
  // 実行設定（開発用）
  run: {
    target: 'chromium'
  }
};