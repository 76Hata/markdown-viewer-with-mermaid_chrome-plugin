# Chrome拡張機能リリース手順書

## プロジェクト概要
- **拡張機能名**: Markdown Viewer with Mermaid
- **バージョン**: 1.0.0
- **説明**: Enhanced Markdown viewer with TOC, themes, search, and Mermaid diagram support

## 事前準備

### 1. 開発者アカウントの準備
1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセス
2. Googleアカウントでログイン
3. 初回の場合は開発者登録（$5の登録料が必要）

### 2. 拡張機能の最終確認
- [ ] manifest.json の内容確認
- [ ] 全ての必要ファイルが揃っている
- [ ] アイコンファイル（16x16, 48x48, 128x128px）の確認
- [ ] 動作テストの実施

## リリース準備

### 1. 配布用パッケージの作成
以下のファイル・フォルダを含むZIPファイルを作成：

```
markdown-viewer-with-mermaid.zip
├── manifest.json
├── content.js
├── css/
│   └── main.css
├── js/
│   ├── search-engine.js
│   ├── theme-manager.js
│   ├── toc-generator.js
│   └── toolbar.js
├── lib/
│   ├── marked.min.js
│   └── mermaid.min.js
└── icons/
    ├── mdvier-icon_16.png
    ├── mdvier-icon_48.png
    └── mdvier-icon_128.png
```

**除外するファイル・フォルダ:**
- doc/
- after_doc/
- test関連ファイル（*.html、test-*.js）
- README.md
- debug-test.html
- sample.md
- standalone-viewer.html
- styles.css（重複）
- viewer.html/viewer.js（不要）

### 2. ZIPファイル作成コマンド
```bash
# プロジェクトルートで実行
zip -r markdown-viewer-with-mermaid.zip \
  manifest.json \
  content.js \
  css/ \
  js/ \
  lib/ \
  icons/ \
  -x "*.DS_Store" "doc/*" "after_doc/*" "test*" "debug*" "sample*" "standalone*" "viewer.*" "styles.css" "README.md"
```

## Chrome Web Storeへの登録

### 1. 新しいアイテムの追加
1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にログイン
2. 「新しいアイテム」をクリック
3. 作成したZIPファイルをアップロード

### 2. ストア掲載情報の入力

#### 基本情報
- **名前**: Markdown Viewer with Mermaid
- **説明**: 
  ```
  Enhanced Markdown viewer with TOC, themes, search, and Mermaid diagram support
  
  Features:
  - Table of Contents (TOC) generation
  - Multiple themes (Light, Dark, GitHub, etc.)
  - Full-text search functionality
  - Mermaid diagram rendering
  - File protocol support for local .md files
  ```

#### カテゴリ
- **主カテゴリ**: 生産性
- **サブカテゴリ**: 開発者ツール

#### 言語とローカライゼーション
- **主言語**: 日本語
- **対応言語**: 日本語、英語

### 3. ストアアイコンとスクリーンショット

#### ストアアイコン
- **サイズ**: 128x128px
- **ファイル**: icons/mdvier-icon_128.png を使用

#### スクリーンショット（推奨）
以下のスクリーンショットを用意：
1. TOC機能のデモ
2. テーマ切り替えのデモ
3. 検索機能のデモ
4. Mermaidダイアグラムの表示例

### 4. プライバシー設定

#### 権限の説明
- **activeTab**: 現在のタブでMarkdownファイルを処理するため
- **storage**: ユーザーの設定（テーマ、検索履歴など）を保存するため
- **file:///***: ローカルのMarkdownファイルにアクセスするため

#### プライバシーポリシー
```
この拡張機能は以下の情報を収集・使用します：
- ユーザー設定（テーマ選択、検索履歴）をローカルストレージに保存
- 外部サーバーへのデータ送信は行いません
- 個人情報の収集は行いません
```

### 5. 配布設定
- **公開範囲**: 公開
- **料金**: 無料
- **地域制限**: なし

## 審査とリリース

### 1. 審査の提出
1. 全ての情報を入力後、「審査のために送信」をクリック
2. 審査には通常1-3日程度かかります

### 2. 審査中の注意事項
- manifest.jsonの変更は避ける
- 審査中は新しいバージョンのアップロードを控える

### 3. 審査完了後
- 承認されると自動的にストアに公開
- 拒否された場合は理由を確認し、修正後再提出

## リリース後の管理

### 1. 統計の確認
- インストール数
- ユーザーレビュー
- クラッシュレポート

### 2. アップデートの手順
1. manifest.jsonのversionを更新
2. 新しいZIPファイルを作成
3. Developer Dashboardから新バージョンをアップロード
4. 審査完了後、自動的に既存ユーザーに配信

### 3. サポート対応
- ユーザーレビューへの返信
- バグレポートの対応
- 機能改善の検討

## トラブルシューティング

### よくある審査拒否理由
1. **権限の過剰使用**: 必要最小限の権限のみ使用
2. **プライバシーポリシーの不備**: 明確な説明が必要
3. **機能の説明不足**: 詳細な説明文を記載
4. **アイコンの品質問題**: 高解像度で明確なアイコンを使用

### 緊急時の対応
- 重大なバグが発見された場合は即座に修正版をリリース
- 必要に応じて一時的に拡張機能を非公開にすることも可能

## チェックリスト

### リリース前
- [ ] 機能テスト完了
- [ ] manifest.json確認
- [ ] アイコンファイル準備完了
- [ ] ZIPファイル作成完了
- [ ] 開発者アカウント準備完了

### ストア登録時
- [ ] 基本情報入力完了
- [ ] 説明文記載完了
- [ ] カテゴリ選択完了
- [ ] スクリーンショット準備完了
- [ ] プライバシーポリシー記載完了
- [ ] 権限説明記載完了

### 審査提出後
- [ ] 審査状況の確認
- [ ] 必要に応じた修正対応
- [ ] リリース通知の準備

---

**作成日**: 2025年7月28日  
**対象バージョン**: Markdown Viewer with Mermaid v1.0.0