# MCPサーバー接続方法

## 概要

Claude CodeでMCP（Model Context Protocol）サーバーを接続し、cipher、serena、mcp-gatewayの3つのMCPサーバーを利用可能にする手順をまとめます。

## 前提条件

- Claude Codeがインストール済み
- uvがインストール済み
- MCPサーバーファイルが`C:\mcp\`に配置済み

## MCPサーバーの場所
```
C:\mcp\
├── cipher-mcp-server\          # Cipherメモリーエージェント
│   ├── start-cipher.bat
│   └── ...
├── serena\                     # Serenaコーディングエージェント
│   ├── src\
│   ├── pyproject.toml
│   └── ...
└── start_serena_mcp.bat        # Serena起動スクリプト
```

## 接続手順

### 1. Cipher MCPサーバーの接続（stdio方式）
```bash
claude mcp add cipher "C:\mcp\cipher-mcp-server\start-cipher.bat" -s local
```

### 2. Serena MCPサーバーの接続（stdio方式）
```bash
claude mcp add serena "C:\mcp\start_serena_mcp.bat" -s local
```

### 3. MCP Gatewayサーバーの接続（SSE方式）
```bash
claude mcp add-json mcp-gateway '{"type": "sse", "url": "http://10.10.0.1:8811/sse"}' -s local
```

## 接続状態の確認方法

### 1. 基本的な状態確認
```bash
claude mcp list
```

**期待される出力：**
```
Checking MCP server health...

cipher: C:\mcp\cipher-mcp-server\start-cipher.bat  - ✓ Connected
serena: C:\mcp\start_serena_mcp.bat  - ✓ Connected
mcp-gateway: http://10.10.0.1:8811/sse (SSE) - ✓ Connected
```

### 2. 詳細情報の確認

個別のMCPサーバー情報を確認：

```bash
claude mcp get cipher
claude mcp get serena
claude mcp get mcp-gateway
```

### 3. Claude Code内での確認方法

Claude Code起動後、以下のコマンドで動作確認：

#### 利用可能なMCPリソースの確認

```
/ListMcpResourcesTool
```

#### Cipherの動作テスト
```
/mcp__cipher__ask_cipher "Hello, test message"
```

#### Serenaの初期指示の表示
```
/mcp__serena__initial_instructions
```

#### MCP Gatewayの動作確認

```
/ListMcpResourcesTool
```

※MCP Gatewayが提供するリソースを確認できます

## トラブルシューティング

### MCPサーバーが接続されない場合

1. **uvのインストール確認**

   ```bash
   uv --version
   ```

2. **MCPサーバーの再追加**
   ```bash
   # 既存設定を削除
   claude mcp remove cipher -s local
   claude mcp remove serena -s local
   claude mcp remove mcp-gateway -s local
   # 再追加
   claude mcp add cipher "C:\mcp\cipher-mcp-server\start-cipher.bat" -s local
   claude mcp add serena "C:\mcp\start_serena_mcp.bat" -s local
   claude mcp add-json mcp-gateway '{"type": "sse", "url": "http://10.10.0.1:8811/sse"}' -s local
   ```

3. **Claude Codeの再起動**
   - Claude Codeを完全に終了
   - 再起動後に`claude mcp list`で確認

### よくある問題と解決方法

#### 1. Serenaが「Connected」だがリソースが表示されない
- これは正常な状態です
- SerenaはプロジェクトをActivateした後にツールが利用可能になります
- `/mcp__serena__initial_instructions`で初期指示が表示されれば正常

#### 2. Cipherの認証エラー
- CipherはOpenAI APIキーが必要な場合があります
- 設定ファイルでAPIキーを確認してください

#### 3. ネットワーク接続の問題（MCP Gateway）
- MCP Gateway（`http://10.10.0.1:8811`）が起動していることを確認
- ネットワーク接続確認：`curl http://10.10.0.1:8811/sse`
- ファイアウォール設定の確認

#### 4. パスの問題
- Windowsではバックスラッシュ（`\`）を使用
- パスにスペースが含まれる場合は引用符で囲む

## 設定ファイルの場所

MCPサーバーの設定は以下のファイルに保存されます：

```
C:\Users\{ユーザー名}\.claude.json
```

## Serenaの使用方法

Serenaを使用する際は、最初にプロジェクトをActivateしてください：

```
"Activate the project C:\Develop\Portfolio\markdown-viewer-with-mermaid_chrome-plugin"
```

## 参考情報
- [Serena MCP Server Documentation](C:\mcp\serena\README.md)
- [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)

---

**最終更新：** 2025年8月8日  
**動作確認済みバージョン：** Claude Code latest, uv latest
