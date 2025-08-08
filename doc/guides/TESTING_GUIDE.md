# 修正版ファイルアクセス権限チェック - 動作確認ガイド

## 修正内容

### 🔧 変更したファイル

1. **content.js** - `checkExtensionFileAccessPermission`関数を修正
   - `chrome.permissions.contains()` APIを使用してファイルアクセス権限をチェック
   - Manifest V3に対応した権限チェック方式に変更

2. **manifest.json** - permissions配列に"permissions"を追加
   - chrome.permissions APIを使用するために必要

### 📋 修正後の動作

- **ファイルアクセス権限がOFFの場合**: 「ローカルファイルでの使用について」ダイアログを表示
- **ファイルアクセス権限がONの場合**: 何もしない（ダイアログ表示なし）

## 🧪 動作確認手順

### Step 1: 拡張機能の読み込み

1. Chromeで `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトフォルダを選択

### Step 2: ファイルアクセス権限をOFFにしてテスト

1. **権限をOFFに設定**
   - `chrome://extensions/` で「Markdown Viewer with Mermaid」の詳細を開く
   - 「ファイルのURLへのアクセスを許可する」をOFFにする

2. **テスト実行**
   - `test-file-access-check.md` をChromeで開く
   - 開発者ツールのコンソールを開く
3. **確認項目**
   - [ ] コンソールに「❌ File access OFF - showing local file usage dialog」が表示される
   - [ ] 2秒後に黄色いダイアログが画面上部に表示される
   - [ ] ダイアログの内容が「ローカルファイルでの使用について」であることを確認
   - [ ] 「設定方法」ボタンをクリックするとモーダルが表示される
   - [ ] 「×」ボタンでダイアログを閉じることができる

### Step 3: ファイルアクセス権限をONにしてテスト

1. **権限をONに設定**
   - `chrome://extensions/` で「Markdown Viewer with Mermaid」の詳細を開く
   - 「ファイルのURLへのアクセスを許可する」をONにする

2. **テスト実行**
   - `test-file-access-check.md` をリロード
   - 開発者ツールのコンソールを開く
3. **確認項目**
   - [ ] コンソールに「✅ File access ON - doing nothing」が表示される
   - [ ] ダイアログが表示されない
   - [ ] マークダウンが正常に表示される

### Step 4: HTMLテストページでの確認

1. **テストページを開く**
   - `test-file-access-dialog.html` をChromeで開く

2. **テストボタンの動作確認**
   - [ ] 「権限チェック実行」ボタンで現在の権限状態を確認
   - [ ] 「ダイアログ表示テスト」ボタンで条件に応じたダイアログ表示
   - [ ] 「手動でダイアログ表示」ボタンで強制ダイアログ表示
   - [ ] 「完全初期化テスト」ボタンで実際の初期化プロセスをテスト

## 🔍 デバッグ情報

### コンソール出力の確認

正常に動作している場合、以下のようなログが出力されます：

**ファイルアクセスOFFの場合:**

```
=== FileAccessNotifier.init() ===
Markdown file loaded - checking file access permission
=== Checking extension file access permission ===
chrome.permissions.contains file access result: false
File access permission status: false
❌ File access OFF - showing local file usage dialog
=== FileAccessNotifier.showLocalFileUsageDialog() ===
⏰ Setting timer to show local file usage dialog in 2 seconds...
🚀 Showing local file usage dialog now
Creating local file usage dialog...
✅ Local file usage dialog created and displayed
```

**ファイルアクセスONの場合:**

```
=== FileAccessNotifier.init() ===
Markdown file loaded - checking file access permission
=== Checking extension file access permission ===
chrome.permissions.contains file access result: true
File access permission status: true
✅ File access ON - doing nothing
```

### トラブルシューティング

1. **chrome.permissions APIが使用できない場合**
   - manifest.jsonの"permissions"配列に"permissions"が含まれているか確認
   - 拡張機能を再読み込みしているか確認

2. **ダイアログが表示されない場合**
   - コンソールエラーがないか確認
   - SafeStorageに以前の設定が残っていないか確認
   - localStorage.clear()で設定をリセット

3. **権限チェックが正しく動作しない場合**
   - chrome.permissions APIが利用可能か確認
   - フォールバック処理が動作しているか確認

## ✅ テスト完了チェックリスト

- [ ] ファイルアクセス権限OFF時にダイアログが表示される
- [ ] ファイルアクセス権限ON時にダイアログが表示されない
- [ ] ダイアログの「設定方法」ボタンが動作する
- [ ] ダイアログの「×」ボタンで閉じることができる
- [ ] ダイアログを閉じると次回表示されない（記憶機能）
- [ ] コンソールログが正しく出力される
- [ ] HTMLテストページの全機能が動作する

---

**✅ 修正完了**: ファイルアクセス権限の正確なチェックと、それに応じた適切なダイアログ表示が実装されました。
