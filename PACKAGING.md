# Chrome拡張機能パッケージング手順

## 重要事項：Chrome Web Store申請用パッケージング

この拡張機能をChrome Web Storeに申請する際は、開発用ファイルを除外した最適化されたパッケージを作成する必要があります。

### ⚠️ 問題背景

Chrome Web Storeで「Manifest V3 を使用したアイテムにリモートでホストされるコードが含まれています」というエラーが発生する原因：

1. **パッケージサイズ問題**：
   - 元のパッケージ：63ファイル（4.4MB）
   - 最適化後：23ファイル（1.16MB）

2. **不要ファイル包含**：
   - 開発用フォルダ：`doc/`, `docs/`, `Diagram/`, `after_doc/`
   - 設定ファイル：`eslint.config.js`, `CLAUDE.md`, `README.md`
   - バックアップファイル：`*.backup`, `.DS_Store`

## パッケージング方法

### 🎯 推奨方法（Chrome Web Store申請用）

```bash
# 最適化されたクリーンパッケージを作成
npm run package:chrome
```

このコマンドは以下を実行します：
1. 開発用ファイルを除外
2. 必要最小限のファイルのみをパッケージング
3. Chrome Web Store審査に最適化

### 📁 パッケージに含まれるファイル

**必須ファイル**：
- `manifest.json` - 拡張機能設定
- `background.js` - サービスワーカー
- `content.js` - コンテンツスクリプト
- `popup.html`, `popup.js` - ポップアップUI

**リソースフォルダ**：
- `css/` - スタイルファイル
- `icons/` - アイコン画像
- `js/` - JavaScriptモジュール（バックアップファイル除く）
- `lib/` - 外部ライブラリ（marked, mermaid, html2canvas, jspdf）

### 🚫 除外されるファイル・フォルダ

**開発用フォルダ**：
- `doc/`, `docs/`, `Diagram/`, `after_doc/`
- `analysis-reports/`, `archive/`, `tests/`
- `claude-workspace/`, `claude-extensions/`
- `final-function-verification/`, `function-tests/`, `reports/`
- `node_modules/`, `coverage/`, `build/`, `dist/`

**設定・文書ファイル**：
- `package.json`, `package-lock.json`
- `eslint.config.js`, `tsconfig.json`, `typedoc.json`
- `jest.config.js`, `jsconfig.json`
- `CLAUDE.md`, `README.md`, `PACKAGING.md`
- `Chrome_Web_Store_Policy_Compliance_Report.md`

**バックアップ・一時ファイル**：
- `*.backup`, `.DS_Store`
- `temp_end.js`, `chrome-extension.tar.gz`
- `types/`フォルダ（TypeScript定義）

## 利用可能なコマンド

### 基本コマンド

```bash
# Chrome Web Store申請用（推奨）
npm run package:chrome

# レガシー方式（開発用ファイル含む）
npm run package:legacy

# 手動クリーンパッケージ作成
npm run package:clean
```

### デバッグ・開発用

```bash
# 開発サーバー起動（Chrome）
npm run dev

# 開発サーバー起動（Firefox）
npm run start-firefox

# 一時ファイル削除
npm run clean
```

## トラブルシューティング

### パッケージサイズが大きい場合

```bash
# 作成されたパッケージの内容確認
unzip -l build/markdown_viewer_with_mermaid-*.zip

# 不要ファイルが含まれている場合はクリーンパッケージを使用
npm run package:clean
```

### ファイルが不足している場合

`release/`フォルダの内容を確認し、必要なファイルがコピーされているかチェックしてください：

```bash
# Windowsの場合
dir release
dir release\js
dir release\lib

# Unix系の場合
ls -la release/
ls -la release/js/
ls -la release/lib/
```

## 継続的な品質管理

### 定期チェック項目

1. **パッケージサイズ**：1.5MB以下を維持
2. **ファイル数**：30ファイル以下を維持
3. **不要ファイル混入**：定期的にパッケージ内容をレビュー

### 更新時の注意事項

新しいファイルやフォルダを追加した場合：

1. `package.json`の除外リストを更新
2. `copy-essential-files`スクリプトにコピー対象を追加
3. パッケージング後のファイル数・サイズを確認

---

**最終更新**: 2025年8月22日  
**パッケージ最適化実施日**: 2025年8月22日