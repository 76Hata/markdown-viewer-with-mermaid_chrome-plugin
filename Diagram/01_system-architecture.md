# システム全体のアーキテクチャ図 - Markdown Viewer with Mermaid Chrome拡張機能

```mermaid
graph TB
    subgraph "Chrome拡張機能コア"
        A[manifest.json<br/>拡張機能設定]
        B[background.js<br/>バックグラウンドサービスワーカー]
        C[popup.js<br/>ポップアップUI]
        D[popup.html<br/>ポップアップ画面]
    end
    
    subgraph "メインコンテンツ処理"
        E[content.js<br/>メインコンテンツスクリプト]
        F[main.css<br/>メインスタイルシート]
    end
    
    subgraph "機能モジュール"
        G[toolbar.js<br/>ツールバー管理]
        H[toc-generator.js<br/>目次生成エンジン]
        I[search-engine.js<br/>検索機能エンジン]
        J[theme-manager.js<br/>テーマ管理システム]
    end
    
    subgraph "外部ライブラリ"
        K[marked.min.js<br/>Markdownパーサー]
        L[mermaid.min.js<br/>図表描画ライブラリ]
        M[jspdf.umd.min.js<br/>PDF生成ライブラリ]
        N[html2canvas.min.js<br/>HTML→Canvas変換]
    end
    
    subgraph "Chrome API"
        O[Chrome Storage API<br/>設定保存]
        P[Chrome Notifications API<br/>通知機能]
        Q[Chrome Context Menus API<br/>右クリックメニュー]
        R[Chrome Tabs API<br/>タブ管理]
    end
    
    subgraph "ユーザーインターフェース"
        S[Markdownファイル表示<br/>レンダリング結果]
        T[ツールバー<br/>操作パネル]
        U[検索パネル<br/>検索インターフェース]
        V[目次パネル<br/>ナビゲーション]
        W[設定パネル<br/>環境設定]
    end
    
    %% 依存関係と連携
    A --> B
    A --> C
    A --> E
    C --> D
    
    E --> G
    E --> H
    E --> I
    E --> J
    E --> F
    
    E --> K
    E --> L
    E --> M
    E --> N
    
    B --> O
    B --> P
    B --> Q
    B --> R
    
    G --> T
    H --> V
    I --> U
    J --> S
    E --> S
    G --> W
    
    %% データフロー
    K --> E
    L --> S
    M --> G
    N --> G
    
    %% 設定管理
    O --> J
    O --> I
    O --> H
    O --> G
    
    %% スタイリング
    classDef coreModule fill:#e1f5fe
    classDef mainModule fill:#f3e5f5
    classDef featureModule fill:#e8f5e8
    classDef library fill:#fff3e0
    classDef api fill:#fce4ec
    classDef ui fill:#f1f8e9
    
    class A,B,C,D coreModule
    class E,F mainModule
    class G,H,I,J featureModule
    class K,L,M,N library
    class O,P,Q,R api
    class S,T,U,V,W ui
```

## アーキテクチャ概要

### 1. Chrome拡張機能コア
- **manifest.json**: 拡張機能の設定と権限定義
- **background.js**: インストール処理、通知管理、コンテキストメニュー管理
- **popup.js/popup.html**: ポップアップUIとファイルアクセス状態確認

### 2. メインコンテンツ処理
- **content.js**: Markdownファイル検出、初期化、各機能モジュールの統合
- **main.css**: 全体的なスタイリングとテーマベースの外観定義

### 3. 機能モジュール（プラグイン式設計）
- **toolbar.js**: フローティングツールバー、エクスポート機能、キーボードショートカット
- **toc-generator.js**: 見出し抽出、階層構造生成、スムーズスクロール
- **search-engine.js**: 正規表現検索、リアルタイム検索、ハイライト表示
- **theme-manager.js**: ライト/ダーク/セピアテーマ、カスタムCSS適用

### 4. 外部ライブラリ統合
- **marked**: Markdown→HTML変換
- **mermaid**: 図表レンダリング
- **jsPDF**: PDF生成
- **html2canvas**: スクリーンショット機能

### 5. Chrome API活用
- Storage API: ユーザー設定の永続化
- Notifications API: インストール/更新通知
- Context Menus API: 右クリックメニュー拡張
- Tabs API: 新しいタブでのガイド表示

### 6. ユーザーインターフェース
- モジュラー設計による柔軟なUI構成
- レスポンシブデザイン対応
- ドラッグ可能なパネル配置