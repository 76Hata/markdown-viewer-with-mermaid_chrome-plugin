# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that enhances Markdown file viewing with advanced features including:
- Table of Contents (TOC) generation with navigation
- Multiple themes (light/dark/sepia) with automatic switching
- Advanced search functionality with regex support
- Mermaid diagram rendering
- Print optimization
- File access permission management
- Export functionality (HTML/PDF)

## Architecture

### Core Files
- `content.js` - Main content script (2000+ lines) that initializes the markdown viewer
- `background.js` - Service worker handling installation, notifications, and context menus
- `popup.js` - Extension popup interface for settings and testing

### Modular Components (`js/` directory)
- `toolbar.js` - Main toolbar UI with all interactive controls
- `theme-manager.js` - Theme switching and CSS variable management
- `search-engine.js` - Search functionality with highlighting
- `toc-generator.js` - Table of contents generation and navigation

### Styling

- `css/main.css` - Comprehensive CSS with CSS variables for theming

### External Libraries (`lib/` directory)

- `marked.min.js` - Markdown parsing
- `mermaid.min.js` - Diagram rendering
- `jspdf.umd.min.js` - PDF export functionality
- `html2canvas.min.js` - HTML to canvas conversion

## Development Commands

### Testing the Extension
1. Load extension in Chrome: Navigate to `chrome://extensions/`, enable Developer mode, click "Load unpacked" and select this directory
2. Test with markdown files: Open any `.md` file in Chrome to see the enhanced viewer
3. Debug mode: Open browser console to see detailed logging

### File Access Setup (Critical for Local Files)
The extension requires "Allow access to file URLs" permission in Chrome extensions settings to work with local markdown files.

### Key Classes and Their Responsibilities

#### `Toolbar` (toolbar.js)
- Creates floating toolbar with drag functionality
- Manages all UI controls (search, themes, print, export, settings)
- Coordinates between other component classes
- Handles keyboard shortcuts

#### `ThemeManager` (theme-manager.js)
- Manages three built-in themes: light, dark, sepia
- Applies CSS variables for consistent theming
- Persists theme preferences using Chrome Storage API
- Re-renders Mermaid diagrams when theme changes

#### `SearchEngine` (search-engine.js)
- Provides real-time search with highlighting
- Supports regex patterns and case sensitivity options
- Navigation between search results
- Integrates with the main toolbar

#### `TOCGenerator` (toc-generator.js)
- Automatically detects headings (h1-h6) in markdown content
- Creates collapsible navigation panel
- Provides active section highlighting during scroll
- Smooth scrolling to sections

### Content Script Flow (content.js)

1. **File Detection**: Checks if current URL is a markdown file
2. **Content Extraction**: Gets original markdown content from DOM or via fetch for GitHub URLs
3. **Sandbox Detection**: Handles restricted environments (GitHub raw URLs)
4. **Markdown Rendering**: Uses `marked.js` with custom renderer for Mermaid diagrams
5. **Enhanced Features**: Initializes toolbar and component classes
6. **File Access Notifications**: Shows setup guidance when file access is disabled

### File Access System

The extension includes a comprehensive file access permission system:

- `FileAccessChecker` - Detects file access permissions
- `FileAccessNotifier` - Shows setup guidance dialogs
- `SafeStorage` - Fallback storage for sandboxed environments

### Export Functionality
- HTML export with embedded CSS and complete styling
- Multiple fallback methods for different environments (Blob, Data URL, clipboard)
- Sandbox environment detection and appropriate handling

## Common Development Tasks

### Adding New Themes
1. Add theme configuration in `ThemeManager.registerDefaultThemes()`
2. Define CSS variables in the theme config
3. Add theme preview in `toolbar.js` theme selector
4. Update CSS with theme-specific selectors if needed

### Modifying Toolbar
- Edit `toolbar.js` `createToolbar()` method for HTML structure
- Add event handlers in `bindEvents()` method
- Update CSS in `main.css` under "TOOLBAR STYLES" section

### Debugging Issues
- Check browser console for detailed logging
- Verify file access permissions for local files
- Test in different environments (local files, GitHub raw URLs, regular websites)
- Use the popup interface debug functions for testing

### Testing
- Load `test-enhanced.html` for comprehensive feature testing
- Use console command `runMarkdownViewerTests()` for automated testing
- Test file access behavior with local markdown files

## Key Implementation Notes

### Sandboxed Environment Handling

The extension detects and adapts to sandboxed environments (like GitHub raw URLs) where some APIs are restricted.

### Performance Considerations

- Lazy initialization of components
- Efficient DOM querying with caching
- Throttled scroll events for TOC updates
- Memory cleanup on component destruction

### Error Handling

Comprehensive error handling throughout:

- Graceful degradation when APIs are unavailable
- Fallback storage methods
- User-friendly error messages
- Console logging for debugging

### Security
- CSP-compliant code (no eval, inline scripts properly handled)
- Safe HTML generation with proper escaping
- Secure storage of user preferences
- File access permission validation

## 大前提

### claude codeターミナル(コンソール、プロンプト)について

- 出力メッセージは原則日本語で出力すること

### 資料、レポート、ドキュメントについて

- ドキュメントはすべてdocフォルダに格納すること
- 作成者の名前は『76Hata』にすること。

### 不明な技術や仕様について

- 不明瞭やうまくいかない技術や仕様などがあればすぐにネットで調査すること。

### 設計書について

- コード作成前には必ず『基本設計書』『詳細設計書』『テーブル仕様書』『インターフェース定義書』『API設計書』『画面仕様書』のうち必要なドキュメントを作成すること。
- 設計書類はdocフォルダ下にdesignフォルダを作成しそこに格納すること。
- 必要であればUML図も描画して下さい。UML図作成時にはmermaid形式で描画すること。
- コードの作成、修正、リファクタリングを行った場合は必ずドキュメントに反映すること。

### 画面設計について

- 常にUI/UXに考慮しユーザの使いやすさを第一にデザインすること

### ファイル、Git操作について

- 原則としてプロジェクトルートフォルダ以外に影響を与えるファイル操作は行わないこと。行いたい場合はたとえ「--dangerously-skip-permissions」オプションが付いてても必ず確認すること。
- 指示がない限り勝手なgit操作は行わないこと。

### コードの作成、修正、リファクタリングについて
- コードには適切な量のコメントをつけること。
- コメントはTypeDocのフォーマット形式で記述すること。

### テストについて
- 可能な限りの手法を用いてしっかりとしたテストを必ず実施すること。
- テスト結果は必ずレポートとして残すこと。
- 可能な限り最終確認時以外は人の手によるテストを依頼しないで解決すること。

## タスク実行の4段階フロー

### 1. 要件定義

- `.claude_workflow/complete.md`が存在すれば参照
- 目的の明確化、現状把握、成功基準の設定
- `.claude_workflow/requirements.md`に文書化
- **必須確認**: 「要件定義フェーズが完了しました。設計フェーズに進んでよろしいですか？」

### 2. 設計
- **必ず`.claude_workflow/requirements.md`を読み込んでから開始**
- アプローチ検討、実施手順決定、問題点の特定
- `.claude_workflow/design.md`に文書化
- **必須確認**: 「設計フェーズが完了しました。タスク化フェーズに進んでよろしいですか？」

### 3. タスク化
- **必ず`.claude_workflow/design.md`を読み込んでから開始**
- タスクを実行可能な単位に分解、優先順位設定
- `.claude_workflow/tasks.md`に文書化
- **必須確認**: 「タスク化フェーズが完了しました。実行フェーズに進んでよろしいですか？」

### 4. 実行
- **必ず`.claude_workflow/tasks.md`を読み込んでから開始**
- タスクを順次実行、進捗を`.claude_workflow/tasks.md`に更新
- 各タスク完了時に報告

## 実行ルール

### ファイル操作

- 新規タスク開始時: 既存ファイルの**内容を全て削除して白紙から書き直す**
- ファイル編集前に必ず現在の内容を確認

### フェーズ管理
- 各段階開始時: 「前段階のmdファイルを読み込みました」と報告
- 各段階の最後に、期待通りの結果になっているか確認
- 要件定義なしにいきなり実装を始めない

### 実行方針
- 段階的に進める: 一度に全てを変更せず、小さな変更を積み重ねる
- 複数のタスクを同時並行で進めない
- エラーは解決してから次へ進む
- エラーを無視して次のステップに進まない
- 指示にない機能を勝手に追加しない

## 厳守事項

以下のルールを厳守して下さい。1.ルートフォルダに対して影響のあるLINUXコマンド操作は絶対に行わない。2.プロジェクトのカレントフォルダより上の階層に影響がある操作を行うときは確認を促す。3.現在利用中のリポジトリへのgit操作は一切禁止4.以下のコマンドは絶対に利用禁止

- rm -rf \*
- rm -rf /\*
- mkfs.ext4 /dev/sdX
- dd if=/dev/zero of=/dev/sdX
- reboot
- shutdown
- yes > /dev/sda
- mv /bin /bin_old
- chown -R
- chmod -R
- kill -9 1
- mkfs
- dd
