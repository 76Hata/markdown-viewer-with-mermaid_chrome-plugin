# Markdown Viewer with Mermaid - Chrome Extension

## 概要
Chrome拡張機能として動作する高機能Markdownビューアー。Mermaid図表のレンダリング、目次自動生成、テーマ切り替え、検索機能、エクスポート機能を提供します。

## 主な機能
- **Markdownレンダリング**: marked.jsによる高速パース
- **Mermaid図表サポート**: フローチャート、シーケンス図など
- **自動目次生成**: 階層構造を持つ目次とスムーズスクロール
- **検索機能**: リアルタイム検索とハイライト表示
- **テーマ切り替え**: ライト、ダーク、セピアテーマ
- **エクスポート**: PDF/HTML形式での出力
- **レスポンシブ対応**: デスクトップ・モバイル両対応

## ファイル構成

### コア機能
```
├── manifest.json              # Chrome拡張機能設定
├── content.js                 # メインコンテンツスクリプト
├── background.js              # バックグラウンドスクリプト
├── popup.html/popup.js        # 拡張機能ポップアップ
└── setup-guide.html          # セットアップガイド
```

### スタイル・リソース
```
├── css/
│   └── main.css              # メインスタイルシート
├── icons/                    # アイコンファイル
├── lib/                      # 外部ライブラリ
│   ├── marked.min.js         # Markdownパーサー
│   ├── mermaid.min.js        # 図表レンダリング
│   ├── jspdf.umd.min.js      # PDF生成
│   └── html2canvas.min.js    # HTML→Canvas変換
└── file-access_off.png       # ファイルアクセス警告用画像
```

### JavaScript機能モジュール
```
├── js/
│   ├── toc-generator.js      # 目次生成機能
│   ├── search-engine.js      # 検索エンジン
│   ├── theme-manager.js      # テーマ管理
│   └── toolbar.js            # ツールバー機能
```

### ドキュメント・設定
```
├── doc/                      # 技術文書・ガイド
├── after_doc/               # プロジェクト完了文書
├── CLAUDE.md                # Claude Code設定
├── package.json             # 開発依存関係
├── tsconfig.json            # TypeScript設定
└── typedoc.json            # ドキュメント生成設定
```

## インストール・使用方法

### Chrome拡張機能として使用
1. `chrome://extensions/`を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」でフォルダを選択
4. ファイルアクセス権限を有効にする

### 開発環境セットアップ
```bash
# 依存関係のインストール
npm install

# ドキュメント生成
npm run docs
```

## 技術仕様
- **対応ブラウザ**: Chrome/Chromium系 (Manifest V3)
- **ファイル形式**: .md, .markdown, .mkd, .mdx
- **依存ライブラリ**: marked.js, mermaid.js, jsPDF, html2canvas
- **レスポンシブ**: CSS Grid/Flexbox対応

## ライセンス
ISC License

## 開発情報
- **バージョン**: 1.1.0
- **最終更新**: 2025年8月8日
- **開発者**: 76Hata