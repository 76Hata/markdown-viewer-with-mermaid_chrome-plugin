# file://アクセス許可テスト

このファイルは、Chrome拡張機能の **file://アクセス許可通知機能** をテストするためのものです。

## テスト手順

### 1. file://アクセス許可を **OFF** にする
1. `chrome://extensions/` を開く
2. 「Markdown Viewer with Mermaid」を見つける
3. 「詳細」をクリック
4. **「ファイルのURLへのアクセスを許可する」を OFF にする**

### 2. このファイルを開く
- ブラウザでこのファイル (`test-file-access.md`) を開く
- または、任意の `.md` ファイルを file:// プロトコルで開く

### 3. 期待される動作
- ページ上部に **黄色い通知バー** が表示される
- 通知内容: 「📁 より快適に使用するために」
- 「設定方法」ボタンが表示される

### 4. 設定方法ボタンのテスト
- 「設定方法」ボタンをクリック
- **詳細な設定手順のモーダル** が表示される
- 手順が5ステップで表示される

### 5. 通知の非表示テスト
- 通知バーの「×」ボタンをクリック
- 通知が消える
- ページを再読み込みしても通知は表示されない（記憶機能）

## デバッグ情報

F12でDevToolsを開き、Consoleタブで以下のログを確認：

```
=== FileAccessChecker.checkFileAccess() ===
=== FileAccessNotifier.init() ===
🔔 About to initialize FileAccessNotifier...
```

## 注意点

- **GitHub Raw URLs** (`raw.githubusercontent.com`) では動作しません
- **sandboxed環境** では制限があります
- **ローカルファイル** (`file://`) での テストが推奨されます

---

_このファイルは `file:///C:/Develop/Portfolio/markdown-viewer-with-mermaid_chrome-plugin/test-file-access.md` として開いてください_
