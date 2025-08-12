# Markdown Viewer with Mermaid - API Documentation

**作成者**: 76Hata  
**バージョン**: 1.1.0  
**作成日**: 2025-08-02

## 概要

Chrome拡張機能「Markdown Viewer with Mermaid」のAPIドキュメントです。本拡張機能は、Markdownファイルの表示を強化し、目次生成、テーマ切り替え、検索機能、エクスポート機能などを提供します。

## アーキテクチャ

### ファイル構成

```
Chrome拡張機能ルート/
├── content.js          # メインコンテンツスクリプト
├── background.js       # バックグラウンドサービスワーカー
├── popup.js           # 拡張機能ポップアップスクリプト
├── js/
│   ├── theme-manager.js    # テーマ管理クラス
│   ├── toolbar.js         # ツールバー管理クラス
│   ├── search-engine.js   # 検索エンジンクラス
│   └── toc-generator.js   # 目次生成クラス
├── css/
│   └── main.css          # メインスタイルシート
└── lib/                  # 外部ライブラリ
```

## クラス・モジュール詳細

### 1. ThemeManager クラス

**ファイル**: `js/theme-manager.js`

Markdownビューアーのテーマ切り替えとCSS変数の管理を行います。

#### 主要メソッド

| メソッド名 | 説明 | パラメータ | 戻り値 |
|-----------|------|----------|--------|
| `constructor()` | テーママネージャーを初期化 | なし | なし |
| `init()` | 非同期初期化処理 | なし | `Promise<void>` |
| `applyTheme(themeName)` | 指定されたテーマを適用 | `string` themeName | `Promise<void>` |
| `registerTheme(name, config)` | 新しいテーマを登録 | `string` name, `Object` config | `void` |
| `setCustomCSS(css)` | カスタムCSSを適用 | `string` css | `Promise<void>` |

#### 使用例

```javascript
// テーママネージャーを初期化
const themeManager = new ThemeManager();

// ダークテーマに切り替え
await themeManager.applyTheme('dark');

// カスタムCSSを適用
await themeManager.setCustomCSS('body { font-size: 18px; }');
```

### 2. Toolbar クラス

**ファイル**: `js/toolbar.js`

Markdownビューアーのメインツールバーインターフェースを作成・管理します。

#### 主要メソッド

| メソッド名 | 説明 | パラメータ | 戻り値 |
|-----------|------|----------|--------|
| `constructor(container)` | ツールバーを初期化 | `HTMLElement` container | なし |
| `init()` | ツールバーの初期化処理 | なし | `void` |
| `createToolbar()` | ツールバーのDOM要素を作成 | なし | `void` |
| `bindEvents()` | イベントハンドラーをバインド | なし | `void` |
| `handlePrint()` | 印刷処理を実行 | なし | `void` |

#### 使用例

```javascript
// ツールバーを初期化
const toolbar = new Toolbar(document.body);

// 特定のコンテナにツールバーを作成
const toolbar = new Toolbar(document.getElementById('content'));
```

### 3. SearchEngine クラス

**ファイル**: `js/search-engine.js`

Markdownコンテンツ内の高度な検索機能を提供します（DOM破壊を防ぐ完全安全版）。

#### 主要メソッド

| メソッド名 | 説明 | パラメータ | 戻り値 |
|-----------|------|----------|--------|
| `constructor(container)` | 検索エンジンを初期化 | `HTMLElement` container | なし |
| `show()` | 検索パネルを表示 | なし | `void` |
| `hide()` | 検索パネルを非表示 | なし | `void` |
| `search(query, options)` | 検索を実行 | `string` query, `Object` options | `void` |
| `clearHighlights()` | ハイライトをクリア | なし | `void` |

#### 使用例

```javascript
// 検索エンジンを初期化
const searchEngine = new SearchEngine();

// 検索パネルを表示
searchEngine.show();

// プログラムから検索を実行
searchEngine.search('検索語', {regex: true, caseSensitive: false});
```

### 4. TOCGenerator クラス

**ファイル**: `js/toc-generator.js`

Markdownの見出しから目次を自動生成し、ナビゲーション機能を提供します。

#### 主要メソッド

| メソッド名 | 説明 | パラメータ | 戻り値 |
|-----------|------|----------|--------|
| `constructor(options)` | 目次生成器を初期化 | `Object` options | なし |
| `generateTOC()` | 目次を生成 | なし | `void` |
| `updateActiveItem()` | アクティブアイテムを更新 | なし | `void` |
| `scrollToHeading(id)` | 指定の見出しにスクロール | `string` id | `void` |

#### 使用例

```javascript
// 目次生成器を初期化
const tocGenerator = new TOCGenerator();

// オプション付きで初期化
const tocGenerator = new TOCGenerator({
    maxDepth: 4,
    includeNumbers: true
});
```

### 5. SafeStorage ユーティリティ

**ファイル**: `content.js`

サンドボックス環境でも動作する安全なストレージアクセスを提供します。

#### 主要メソッド

| メソッド名 | 説明 | パラメータ | 戻り値 |
|-----------|------|----------|--------|
| `setItem(key, value)` | データを安全に保存 | `string` key, `*` value | `void` |
| `getItem(key, callback)` | データを安全に取得 | `string` key, `function` callback | `void` |

#### 使用例

```javascript
// データを保存する
SafeStorage.setItem('my-key', 'my-value');

// データを取得する
SafeStorage.getItem('my-key', function(value) {
    console.log('取得した値:', value);
});
```

### 6. FileAccessNotifier ユーティリティ

**ファイル**: `content.js`

ファイルアクセス権限の管理とダイアログ表示を行います。

#### 主要メソッド

| メソッド名 | 説明 | パラメータ | 戻り値 |
|-----------|------|----------|--------|
| `init()` | ファイルアクセス通知の初期化 | なし | `void` |
| `checkExtensionFileAccessPermission(callback)` | ファイルアクセス権限をチェック | `function` callback | `void` |
| `showLocalFileUsageDialog()` | ローカルファイル使用ダイアログを表示 | なし | `void` |

## イベントとライフサイクル

### 拡張機能ライフサイクル

1. **拡張機能読み込み**: `background.js` のサービスワーカーが起動
2. **Markdownファイル検出**: `content.js` がMarkdownファイルを検出
3. **コンポーネント初期化**: 各クラス（ThemeManager, Toolbar等）が初期化
4. **UI構築**: ツールバー、目次パネル等のUIが構築
5. **イベントバインド**: ユーザーインタラクションのイベントハンドラーが設定

### 主要イベント

- `chrome.runtime.onInstalled`: 拡張機能インストール時
- `DOMContentLoaded`: コンテンツスクリプト実行時
- `scroll`: 目次のアクティブアイテム更新
- `keydown`: キーボードショートカット処理

## 設定とカスタマイズ

### テーマカスタマイズ

新しいテーマを追加する場合：

```javascript
themeManager.registerTheme('custom', {
    name: 'Custom Theme',
    variables: {
        '--bg-color': '#f0f0f0',
        '--text-color': '#333333',
        // その他のCSS変数...
    },
    mermaidTheme: 'base'
});
```

### 検索オプション

```javascript
const searchOptions = {
    regex: false,           // 正規表現を使用するか
    caseSensitive: false,   // 大文字小文字を区別するか
    wholeWord: false       // 完全一致検索するか
};
```

## セキュリティとパフォーマンス

### セキュリティ対策

- CSP準拠のコード実装
- 安全なHTML生成とエスケープ処理
- ファイルアクセス権限の適切な検証
- セキュアなデータストレージ

### パフォーマンス最適化

- 遅延初期化によるロード時間短縮
- 効率的なDOM操作とクエリの最適化
- スクロールイベントのスロットリング
- メモリリークの防止

## トラブルシューティング

### よくある問題

1. **ファイルアクセス権限エラー**
   - Chrome拡張機能設定で「ファイルのURLへのアクセスを許可する」を有効化

2. **テーマが適用されない**
   - コンソールでThemeManagerの初期化を確認
   - CSS変数の設定を確認

3. **目次が表示されない**
   - 見出し要素（h1-h6）が存在するか確認
   - TOCGeneratorの初期化を確認

### デバッグ情報

各コンポーネントは詳細なコンソールログを出力します：

```javascript
// コンソールで確認できる情報
console.log('=== Markdown Viewer: Enhanced content script loaded ===');
console.log('=== ThemeManager initialized ===');
console.log('=== SearchEngine initialized ===');
```

## ライセンスと貢献

本APIドキュメントは、Chrome拡張機能「Markdown Viewer with Mermaid」のソースコードと合わせて使用してください。

**作成者**: 76Hata  
**最終更新**: 2025-01-28