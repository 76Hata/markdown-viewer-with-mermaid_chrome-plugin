# MCP初期導入手順書

## 概要
この手順書では、SerenaとCipherのMCPサーバーをGitHubリポジトリから初期導入し、Claude Codeで利用可能にする手順を説明します。

## 前提条件

### 必要なソフトウェア
1. **Git**: バージョン管理システム
   - [Git for Windows](https://gitforwindows.org/) をインストール
   
2. **Python 3.11**: Serena用（注意：3.12は未サポート）
   - [Python公式サイト](https://www.python.org/downloads/) からPython 3.11.xをダウンロード
   - インストール時に「Add Python to PATH」を必ずチェック
   
3. **Node.js**: Cipher用
   - [Node.js公式サイト](https://nodejs.org/) からLTS版をダウンロード・インストール
   
4. **uv**: Python環境管理ツール（Serena用）
   ```powershell
   # PowerShell または Command Prompt で実行
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
   
5. **Claude Code**: 既にインストール済み想定

### 動作確認
```bash
# 各ツールのバージョン確認
git --version
python --version  # 3.11.x であることを確認
node --version
npm --version
uv --version
claude --version
```

## 導入手順

### Step 1: 作業ディレクトリの作成

```bash
# C:\mcpディレクトリを作成
mkdir C:\mcp
cd C:\mcp
```

### Step 2: Serena MCP Server のインストール

#### 2-1. Gitリポジトリのクローン
```bash
# Serenaの公式リポジトリをクローン（実際のURLは環境に応じて調整してください）
git clone https://github.com/oraios-ai/serena.git
cd serena
```

> **注意**: 上記はリポジトリの推定URLです。実際のURLは以下の方法で確認してください：
> - [GitHub](https://github.com)でSerena MCP Serverを検索
> - または既存の設定ファイルから確認

#### 2-2. Python環境のセットアップ
```bash
# Serenaディレクトリ内で実行
cd C:\mcp\serena

# 依存関係のインストール（uvが自動的に仮想環境を作成）
uv sync

# インストール確認
uv run serena --help
```

#### 2-3. Serena起動バッチファイルの作成
`C:\mcp\start_serena_mcp.bat`を作成：

```batch
@echo off
REM Serena MCP Server Auto-start Script
REM This script starts the Serena MCP server with proper error handling and logging

cd /d "C:\mcp\serena"
echo [%date% %time%] Starting Serena MCP Server... >> C:\mcp\serena_startup.log

REM Check if uv is installed
uv --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [%date% %time%] ERROR: uv is not installed or not in PATH >> C:\mcp\serena_startup.log
    exit /b 1
)

REM Start the MCP server
echo [%date% %time%] Executing: uv run serena-mcp-server >> C:\mcp\serena_startup.log
uv run serena-mcp-server

REM Log if the server stops unexpectedly
echo [%date% %time%] Serena MCP Server stopped >> C:\mcp\serena_startup.log
```

**バッチファイルの動作説明:**
- `cd /d "C:\mcp\serena"`: Serenaのディレクトリに移動
- `uv --version >nul 2>&1`: uvがインストールされているかチェック
- `uv run serena-mcp-server`: pyproject.tomlで定義されたserena-mcp-serverコマンドを実行
- ログ出力: 起動・停止時刻をC:\mcp\serena_startup.logに記録
- エラーハンドリング: uvが見つからない場合はエラーログを出力して終了

### Step 3: Cipher MCP Server のインストール

#### 3-1. Gitリポジトリのクローン
```bash
# Cipherの公式リポジトリをクローン（実際のURLは環境に応じて調整してください）
cd C:\mcp
git clone https://github.com/byterover/cipher-mcp-server.git
cd cipher-mcp-server
```

> **注意**: 上記はリポジトリの推定URLです。実際のURLは以下の方法で確認してください：
> - [GitHub](https://github.com)でCipher MCP Serverを検索
> - または@byterover/cipherパッケージの公式リポジトリを確認

#### 3-2. Node.js環境のセットアップ
```bash
# Cipher MCPサーバーディレクトリ内で実行
cd C:\mcp\cipher-mcp-server

# package.jsonがない場合は作成
# 以下の内容でpackage.jsonを作成してください
```

**package.json**の作成内容：
```json
{
  "dependencies": {
    "@byterover/cipher": "^0.2.0",
    "dotenv-cli": "^10.0.0"
  },
  "name": "cipher-mcp-server",
  "version": "1.0.0",
  "description": "Cipher MCP Server for Claude Code",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "mcp": "dotenv -- cipher --mode mcp --agent memAgent/cipher.yml"
  },
  "author": "",
  "license": "ISC",
  "type": "commonjs"
}
```

```bash
# 依存関係のインストール
npm install
```

#### 3-3. Cipher設定ファイルの準備
```bash
# memAgentディレクトリとconfigファイルを作成
mkdir memAgent
```

**memAgent/cipher.yml**を作成（メモリーエージェントの設定）：
```yaml
# Cipher Memory Agent Configuration
name: "cipher"
description: "Memory-powered AI agent for coding assistance"
version: "1.0.0"

# メモリー設定
memory:
  database: "data/cipher.db"
  max_entries: 10000
  retention_days: 30

# エージェント設定
agent:
  model: "gpt-3.5-turbo"
  temperature: 0.1
  max_tokens: 2048
```

```bash
# データディレクトリを作成
mkdir data
```

#### 3-4. Cipher起動バッチファイルの作成
`C:\mcp\cipher-mcp-server\start-cipher.bat`を作成：

```batch
@echo off
cd /d "C:\mcp\cipher-mcp-server"
npm run mcp
```

**バッチファイルの動作説明:**
- `cd /d "C:\mcp\cipher-mcp-server"`: Cipherのディレクトリに移動
- `npm run mcp`: package.jsonのmcpスクリプトを実行
  - 実際の実行内容: `dotenv -- cipher --mode mcp --agent memAgent/cipher.yml`
  - dotenv: 環境変数ファイル（.env）を読み込んで実行
  - cipher: Cipherメインコマンド
  - --mode mcp: MCPサーバーモードで起動
  - --agent memAgent/cipher.yml: メモリーエージェント設定ファイルを指定

### Step 4: Claude Codeへの接続設定

#### 4-1. MCPサーバーの追加
```bash
# Serena MCPサーバーを追加
claude mcp add serena "C:\mcp\start_serena_mcp.bat" -s local

# Cipher MCPサーバーを追加  
claude mcp add cipher "C:\mcp\cipher-mcp-server\start-cipher.bat" -s local

# MCP Gateway サーバーを追加（オプション）
claude mcp add-json mcp-gateway '{"type": "sse", "url": "http://10.10.0.1:8811/sse"}' -s local
```

#### 4-2. 接続状態の確認
```bash
# MCPサーバーの接続状態確認
claude mcp list
```

**期待される出力:**
```
Checking MCP server health...

cipher: C:\mcp\cipher-mcp-server\start-cipher.bat  - ✓ Connected
serena: C:\mcp\start_serena_mcp.bat  - ✓ Connected
mcp-gateway: http://10.10.0.1:8811/sse (SSE) - ✓ Connected
```

## 動作確認

### Claude Code内での確認
Claude Code起動後、以下のコマンドで各MCPサーバーの動作を確認：

1. **利用可能なMCPリソースの確認**
   ```
   /ListMcpResourcesTool
   ```

2. **Cipherの動作テスト**
   ```
   /mcp__cipher__ask_cipher "Hello, this is a connection test"
   ```

3. **Serenaの初期指示確認**
   ```
   /mcp__serena__initial_instructions
   ```

## トラブルシューティング

### よくある問題と解決策

#### 1. Pythonバージョンエラー
**エラー:** `requires-python = ">=3.11, <3.12"`
**解決策:** Python 3.11.xを使用してください。Python 3.12は現在未サポートです。

#### 2. uvがインストールされていない
**エラー:** `'uv' is not recognized as an internal or external command`
**解決策:** 
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### 3. Node.js依存関係エラー
**エラー:** `Cannot find module '@byterover/cipher'`
**解決策:** 
```bash
cd C:\mcp\cipher-mcp-server
npm install
```

#### 4. MCPサーバーが接続されない
**解決策:**
```bash
# MCPサーバーを削除して再追加
claude mcp remove serena -s local
claude mcp remove cipher -s local

# 再追加
claude mcp add serena "C:\mcp\start_serena_mcp.bat" -s local  
claude mcp add cipher "C:\mcp\cipher-mcp-server\start-cipher.bat" -s local
```

#### 5. ログファイルでのデバッグ
- **Serenaログ**: `C:\mcp\serena_startup.log`
- **手動実行確認**: 
  ```bash
  cd C:\mcp\serena
  uv run serena-mcp-server
  ```

## ディレクトリ構造
インストール完了後の`C:\mcp\`ディレクトリ構造：

```
C:\mcp\
├── serena\                          # Serena MCP Server
│   ├── src\serena\                  # Pythonソースコード
│   ├── pyproject.toml               # Python依存関係定義
│   ├── uv.lock                      # 依存関係ロックファイル
│   └── README.md                    # ドキュメント
├── cipher-mcp-server\               # Cipher MCP Server  
│   ├── memAgent\
│   │   └── cipher.yml               # エージェント設定
│   ├── data\                        # データベースディレクトリ
│   ├── package.json                 # Node.js依存関係定義
│   ├── node_modules\                # Node.js依存関係
│   └── start-cipher.bat             # 起動スクリプト
├── start_serena_mcp.bat             # Serena起動スクリプト
└── serena_startup.log               # Serena起動ログ
```

## 設定ファイルの場所
MCPサーバーの設定は以下のファイルに保存されます：
```
C:\Users\{ユーザー名}\.claude.json
```

---

**最終更新:** 2025年8月8日  
**動作確認済み環境:**
- Python 3.11.x
- Node.js 18.x+
- Claude Code latest
- Windows 10/11