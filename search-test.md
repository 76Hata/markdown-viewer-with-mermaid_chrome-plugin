# Mermaid図表テスト（修正版）

> **修正内容**: シーケンス図とガントチャート図の表示問題を修正
> - Mermaid初期化設定を強化
> - デバッグログを改善
> - エラーハンドリングを追加

## 1. フローチャート（動作確認済み）

```mermaid
flowchart TD
    A[開始] --> B{条件分岐}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
    C --> E[終了]
    D --> E[終了]
```

## 2. シーケンス図テスト

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hi Alice
    Bob->>Charlie: How are you?
    Charlie-->>Bob: I'm fine, thanks!
    Note over Alice,Charlie: 3者間の会話
    Alice->>Charlie: Nice to meet you!
    Charlie-->>Alice: Nice to meet you too!
```

## 3. ガントチャートテスト

```mermaid
gantt
    title プロジェクトスケジュール
    dateFormat  YYYY-MM-DD
    section 設計フェーズ
    要件定義           :2024-01-01, 5d
    基本設計           :2024-01-06, 7d
    詳細設計           :2024-01-13, 10d
    section 開発フェーズ
    実装               :2024-01-23, 20d
    単体テスト         :2024-02-12, 5d
    結合テスト         :2024-02-17, 7d
    section リリース
    本番デプロイ       :milestone, 2024-02-24, 0d
```

## 4. 検索機能テスト

このテキストは検索対象になります。検索キーワード「テスト」で検索してみてください。

### 検索確認項目

1. 通常テキストの「テスト」は検索される ✓
2. Mermaid図表内の「テスト」は検索されない ✓
3. 検索ハイライト機能が正常動作 ✓

## 5. 追加のMermaidサンプル

### クラス図

```mermaid
classDiagram
    class User {
        -id: int
        -name: string
        -email: string
        +login()
        +logout()
    }
    
    class Order {
        -orderId: int
        -orderDate: date
        +createOrder()
        +cancelOrder()
    }
    
    User ||--o{ Order : places
```

### パイチャート

```mermaid
pie title ブラウザシェア
    "Chrome" : 65
    "Safari" : 20
    "Firefox" : 10
    "Others" : 5
```