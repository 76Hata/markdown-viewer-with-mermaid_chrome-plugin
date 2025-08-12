# シーケンス図 - Markdownファイル読み込みから表示までの処理フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Browser as ブラウザ
    participant BG as background.js
    participant CS as content.js
    participant TM as ThemeManager
    participant TOC as TOCGenerator
    participant SE as SearchEngine
    participant TB as Toolbar
    participant Marked as Marked Library
    participant Mermaid as Mermaid Library
    participant Storage as Chrome Storage
    
    %% ファイル読み込み開始
    User->>Browser: Markdownファイル(.md)を開く
    Browser->>CS: content scriptを注入
    
    %% 初期化フェーズ
    CS->>CS: ライブラリ読み込み確認
    alt ライブラリ未読み込み
        CS->>CS: 100ms遅延後に再試行
    end
    
    CS->>CS: checkMarkdownFile()
    CS->>CS: Markdownファイル検出確認
    
    %% ファイルアクセス権限チェック
    CS->>BG: ファイルアクセス権限確認
    BG->>CS: 権限状態を返却
    
    alt 権限なし
        CS->>User: ファイルアクセス権限ダイアログ表示
        User->>Browser: 拡張機能設定で権限付与
        User->>CS: ページ再読み込み
    end
    
    %% テーママネージャー初期化
    CS->>TM: new ThemeManager()
    TM->>Storage: 保存されたテーマ設定を読み込み
    Storage->>TM: テーマ設定データ
    TM->>TM: システムテーマ検出
    TM->>TM: デフォルトテーマ適用
    
    %% Markdownコンテンツ処理
    CS->>CS: 元のHTMLコンテンツ取得
    CS->>Marked: markdown文字列をパース
    Marked->>CS: HTML文字列を返却
    
    %% Mermaid図表処理
    CS->>Mermaid: mermaid.initialize(config)
    CS->>CS: コード ブロック内のmermaid記法検出
    loop 各Mermaid図表に対して
        CS->>Mermaid: 図表レンダリング要求
        Mermaid->>CS: SVG図表を返却
        CS->>CS: HTMLに図表を埋め込み
    end
    
    %% HTMLコンテンツ置換
    CS->>Browser: document.bodyのHTML更新
    
    %% 機能モジュール初期化
    par 並行初期化
        CS->>TOC: new TOCGenerator()
        TOC->>TOC: 見出し要素を検索・抽出
        TOC->>TOC: 階層構造を構築
        TOC->>Browser: 目次パネルを生成・挿入
        
        CS->>SE: new SearchEngine()
        SE->>SE: 検索パネル生成
        SE->>SE: キーボードショートカット設定
        
        CS->>TB: new Toolbar()
        TB->>TB: ツールバーUI生成
        TB->>TB: ボタンイベント設定
        TB->>TB: ドラッグ機能初期化
        TB->>Storage: 保存された位置設定読み込み
    end
    
    %% テーマ適用とスタイリング
    TM->>TM: 現在のテーマに基づくCSS変数設定
    TM->>Mermaid: mermaidテーマ設定更新
    TM->>Browser: CSSスタイル適用
    
    %% イベントリスナー設定
    CS->>Browser: スクロールイベントリスナー設定
    TOC->>Browser: 目次クリックイベント設定
    SE->>Browser: 検索ショートカット設定
    TB->>Browser: ツールバーイベント設定
    
    %% 表示完了
    CS->>Browser: 処理完了、UI表示
    Browser->>User: Markdown表示完了
    
    %% ユーザー操作時の動的処理
    User->>TOC: 目次項目クリック
    TOC->>Browser: スムーズスクロール実行
    Browser->>TOC: スクロール位置更新通知
    TOC->>TOC: アクティブ見出しハイライト更新
    
    User->>SE: 検索ショートカット(Ctrl+F)
    SE->>SE: 検索パネル表示
    User->>SE: 検索クエリ入力
    SE->>SE: リアルタイム検索実行
    SE->>SE: 結果ハイライト表示
    SE->>Browser: 検索結果の表示更新
    
    User->>TB: テーマ切り替えボタンクリック
    TB->>TM: テーマ変更要求
    TM->>Storage: 新しいテーマ設定保存
    TM->>TM: 観察者への通知
    TM->>TOC: テーマ変更通知
    TM->>SE: テーマ変更通知
    TM->>TB: テーマ変更通知
    TM->>Browser: 新しいテーマ適用
    
    User->>TB: エクスポートボタンクリック
    TB->>TB: エクスポート処理実行
    TB->>User: ファイルダウンロード開始
```

## 処理フローの詳細説明

### 1. 初期化フェーズ (Initialization Phase)
- **ライブラリ検証**: 必要な外部ライブラリの読み込み確認
- **権限チェック**: ファイルアクセス権限の確認と必要に応じたダイアログ表示
- **環境準備**: テーマ設定の読み込みとシステム環境の検出

### 2. コンテンツ処理フェーズ (Content Processing Phase)
- **Markdown パース**: Marked ライブラリを使用したHTML変換
- **Mermaid レンダリング**: 図表の検出と SVG 変換
- **DOM 更新**: 処理済みコンテンツでページ内容を置換

### 3. 機能モジュール初期化フェーズ (Module Initialization Phase)
- **並行初期化**: 各機能モジュールの独立初期化
- **UI 構築**: ユーザーインターフェース要素の生成と配置
- **イベント設定**: ユーザー操作に対応するイベントリスナーの設定

### 4. 動的操作フェーズ (Dynamic Operation Phase)
- **リアルタイム応答**: ユーザー操作に対する即座の反応
- **状態管理**: 各モジュール間での状態同期
- **永続化**: ユーザー設定の Chrome Storage への保存

### 5. テーマ管理の観察者パターン
- **中央管理**: ThemeManager による一元的なテーマ制御
- **通知配信**: 全モジュールへの変更通知
- **一貫性確保**: UI 全体でのテーマ統一性維持