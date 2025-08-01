# Markdown Viewer with Mermaid 🚀

Chrome拡張機能のテストファイルです。正常に表示されていれば、この文章は美しくレンダリングされたMarkdownとして表示されます。

## 基本的なMarkdown機能

- **太字のテキスト**
- *斜体のテキスト* 
- `インラインコード`
- ~~取り消し線~~

### コードブロック

```javascript
function greetUser(name) {
    console.log(`Hello, ${name}! Welcome to Markdown Viewer!`);
    return `Greeting sent to ${name}`;
}

greetUser("World");
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print([fibonacci(i) for i in range(10)])
```

## Mermaidダイアグラムのテスト

### フローチャート

```mermaid
graph TD
    A[ユーザーがファイルを開く] --> B{拡張子は.md?}
    B -->|Yes| C[Markdownとして解析]
    B -->|No| D[通常のテキスト表示]
    C --> E[Mermaid図を検出]
    E --> F[図を描画]
    F --> G[レンダリング完了]
    D --> H[処理終了]
    G --> H
```

### シーケンス図

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant E as Chrome拡張
    participant P as Marked.js
    participant M as Mermaid.js
    
    U->>E: .mdファイルを開く
    E->>P: Markdown解析開始
    P->>E: HTML変換完了
    E->>M: Mermaid図描画要求
    M->>E: SVG図生成完了
    E->>U: レンダリング表示
```

### ガントチャート

```mermaid
gantt
    title プロジェクト進行状況
    dateFormat  YYYY-MM-DD
    section 開発フェーズ
    要件定義    :done, req, 2024-01-01, 2024-01-15
    設計       :done, design, 2024-01-10, 2024-01-25
    実装       :active, impl, 2024-01-20, 2024-02-10
    テスト     :test, after impl, 15d
    section デプロイ
    本番環境準備 :deploy, after test, 5d
```

## 表の表示テスト

| 機能 | 状態 | 優先度 | 備考 |
|------|------|--------|------|
| Markdown解析 | ✅ 完了 | 高 | marked.js使用 |
| Mermaid描画 | ✅ 完了 | 高 | mermaid.js使用 |
| スタイリング | ✅ 完了 | 中 | CSS適用済み |
| ファイル検出 | ✅ 完了 | 高 | 拡張子判定 |

## 引用とリンク

> **成功の秘訣**  
> このMarkdown拡張機能が正常に動作していれば、
> あなたは美しくレンダリングされたドキュメントを見ているはずです！

詳細については[GitHub](https://github.com)を参照してください。

## チェックリスト

- [x] Markdownの基本機能
- [x] Mermaid図の描画
- [x] コードシンタックス
- [x] 表の表示
- [x] 引用文の表示
- [ ] 更なる機能拡張

---

**拡張機能が正常に動作していることを確認できました！** 🎉