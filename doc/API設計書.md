# Chrome拡張機能「Markdown Viewer with Mermaid」API設計書

## 1. 拡張機能API構造

### 1.1 Manifest.json設計
```json
{
  "manifest_version": 3,
  "name": "Markdown Viewer with Mermaid Enhanced",
  "version": "2.0.0",
  "description": "Advanced Markdown viewer with Mermaid diagrams, TOC, themes, and search",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "file:///*"
  ],
  "content_scripts": [
    {
      "matches": ["file://*.md", "file://*.markdown"],
      "js": [
        "lib/marked.min.js",
        "lib/mermaid.min.js",
        "src/core/markdown-engine.js",
        "src/core/mermaid-engine.js",
        "src/core/theme-manager.js",
        "src/core/toc-generator.js",
        "src/core/search-engine.js",
        "src/core/export-manager.js",
        "src/ui/components/toolbar.js",
        "src/ui/components/toc-panel.js",
        "src/ui/components/search-panel.js",
        "src/ui/components/theme-selector.js",
        "content.js"
      ],
      "css": [
        "styles/main.css",
        "styles/themes.css",
        "styles/components.css"
      ],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],
  "action": {
    "default_popup": "src/ui/popup/popup.html",
    "default_title": "Markdown Viewer Settings"
  },
  "options_page": "src/ui/options/options.html",
  "background": {
    "service_worker": "background.js"
  },
  "web_accessible_resources": [
    {
      "resources": ["assets/*", "styles/*"],
      "matches": ["file://*/*"]
    }
  ]
}
```

### 1.2 Chrome Storage API設計

#### 1.2.1 設定データ構造
```javascript
// chrome.storage.sync に保存される設定
const StorageSchema = {
  // テーマ設定
  theme: {
    current: 'light',           // 現在のテーマ
    autoDetect: true,           // システムテーマ自動検出
    customCSS: '',              // カスタムCSS
    fontSize: 'medium',         // フォントサイズ (small, medium, large, xlarge)
    fontFamily: 'system'        // フォントファミリー
  },
  
  // 目次設定
  toc: {
    enabled: true,              // 目次表示の有効/無効
    position: 'left',           // 表示位置 (left, right, top)
    width: '250px',             // パネル幅
    maxDepth: 6,                // 最大見出しレベル
    minDepth: 1,                // 最小見出しレベル
    includeNumbers: true,       // 番号付きかどうか
    autoCollapse: false,        // 自動折りたたみ
    smoothScroll: true          // スムーススクロール
  },
  
  // 検索設定
  search: {
    caseSensitive: false,       // 大文字小文字の区別
    regexEnabled: false,        // 正規表現の有効化
    highlightColor: '#ffff00',  // ハイライト色
    maxResults: 100,            // 最大検索結果数
    searchHistory: []           // 検索履歴
  },
  
  // Mermaid設定
  mermaid: {
    theme: 'default',           // Mermaidテーマ
    interactive: true,          // インタラクティブ機能
    maxWidth: '100%',           // 最大幅
    backgroundColor: 'transparent', // 背景色
    fontSize: '16px'            // フォントサイズ
  },
  
  // エクスポート設定
  export: {
    includeCSS: true,           // CSS埋め込み
    includeMermaid: true,       // Mermaid図の埋め込み
    pageSize: 'A4',             // ページサイズ
    margin: '20mm'              // マージン
  },
  
  // 編集設定
  editor: {
    enabled: true,              // 編集機能の有効/無効
    autoSave: false,            // 自動保存
    saveInterval: 30000,        // 自動保存間隔（ミリ秒）
    backupEnabled: true,        // バックアップ機能
    confirmBeforeSave: true     // 保存前確認
  },
  
  // ファイル管理設定
  fileManager: {
    defaultSaveMode: 'overwrite', // デフォルト保存モード
    backupCount: 5,             // バックアップ保持数
    backupLocation: 'local'     // バックアップ場所
  },
  
  // UI設定
  ui: {
    toolbarPosition: 'top',     // ツールバー位置
    showLineNumbers: false,     // 行番号表示
    wordWrap: true,             // 単語折り返し
    compactMode: false          // コンパクトモード
  },
  
  // 高度な設定
  advanced: {
    enableDebug: false,         // デバッグモード
    performanceMode: false,     // パフォーマンスモード
    experimentalFeatures: false // 実験的機能
  }
};
```

#### 1.2.2 Storage API ラッパークラス
```javascript
/**
 * Chrome Storage API のラッパークラス
 */
class StorageManager {
  constructor() {
    this.cache = new Map();
    this.listeners = new Set();
  }
  
  /**
   * 設定値の取得
   * @param {string|string[]} keys - 取得するキー
   * @returns {Promise<any>} 設定値
   */
  async get(keys) {
    try {
      const result = await chrome.storage.sync.get(keys);
      
      // デフォルト値とマージ
      if (typeof keys === 'string') {
        return this.mergeWithDefaults(keys, result[keys]);
      } else if (Array.isArray(keys)) {
        const merged = {};
        keys.forEach(key => {
          merged[key] = this.mergeWithDefaults(key, result[key]);
        });
        return merged;
      } else {
        // 全設定取得
        const merged = {};
        Object.keys(StorageSchema).forEach(key => {
          merged[key] = this.mergeWithDefaults(key, result[key]);
        });
        return merged;
      }
    } catch (error) {
      console.error('Storage get error:', error);
      return this.getDefaults(keys);
    }
  }
  
  /**
   * 設定値の保存
   * @param {Object} items - 保存する設定
   * @returns {Promise<void>}
   */
  async set(items) {
    try {
      // バリデーション
      const validatedItems = this.validateSettings(items);
      
      await chrome.storage.sync.set(validatedItems);
      
      // キャッシュ更新
      Object.entries(validatedItems).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
      
      // リスナーに通知
      this.notifyListeners('changed', validatedItems);
      
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }
  
  /**
   * 設定値の削除
   * @param {string|string[]} keys - 削除するキー
   * @returns {Promise<void>}
   */
  async remove(keys) {
    try {
      await chrome.storage.sync.remove(keys);
      
      // キャッシュから削除
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => this.cache.delete(key));
      
      this.notifyListeners('removed', keys);
      
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }
  
  /**
   * 全設定のクリア
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await chrome.storage.sync.clear();
      this.cache.clear();
      this.notifyListeners('cleared');
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }
  
  /**
   * デフォルト値とのマージ
   * @param {string} key - 設定キー
   * @param {any} value - 現在の値
   * @returns {any} マージされた値
   */
  mergeWithDefaults(key, value) {
    const defaultValue = StorageSchema[key];
    if (!defaultValue) return value;
    
    if (typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
      return { ...defaultValue, ...value };
    }
    
    return value !== undefined ? value : defaultValue;
  }
  
  /**
   * デフォルト値の取得
   * @param {string|string[]} keys - キー
   * @returns {any} デフォルト値
   */
  getDefaults(keys) {
    if (typeof keys === 'string') {
      return StorageSchema[keys];
    } else if (Array.isArray(keys)) {
      const defaults = {};
      keys.forEach(key => {
        defaults[key] = StorageSchema[key];
      });
      return defaults;
    } else {
      return { ...StorageSchema };
    }
  }
  
  /**
   * 設定値のバリデーション
   * @param {Object} items - 設定項目
   * @returns {Object} バリデーション済み設定
   */
  validateSettings(items) {
    const validated = {};
    
    Object.entries(items).forEach(([key, value]) => {
      const schema = StorageSchema[key];
      if (!schema) {
        console.warn(`Unknown setting key: ${key}`);
        return;
      }
      
      validated[key] = this.validateValue(key, value, schema);
    });
    
    return validated;
  }
  
  /**
   * 値のバリデーション
   * @param {string} key - 設定キー
   * @param {any} value - 値
   * @param {any} schema - スキーマ
   * @returns {any} バリデーション済み値
   */
  validateValue(key, value, schema) {
    // 型チェック
    if (typeof value !== typeof schema) {
      console.warn(`Type mismatch for ${key}: expected ${typeof schema}, got ${typeof value}`);
      return schema;
    }
    
    // 特定の値の範囲チェック
    switch (key) {
      case 'theme.fontSize':
        if (!['small', 'medium', 'large', 'xlarge'].includes(value.fontSize)) {
          value.fontSize = 'medium';
        }
        break;
        
      case 'toc.position':
        if (!['left', 'right', 'top'].includes(value.position)) {
          value.position = 'left';
        }
        break;
        
      case 'toc.maxDepth':
        if (value.maxDepth < 1 || value.maxDepth > 6) {
          value.maxDepth = 6;
        }
        break;
    }
    
    return value;
  }
  
  /**
   * 変更リスナーの追加
   * @param {Function} callback - コールバック関数
   */
  addListener(callback) {
    this.listeners.add(callback);
  }
  
  /**
   * 変更リスナーの削除
   * @param {Function} callback - コールバック関数
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  
  /**
   * リスナーへの通知
   * @param {string} event - イベント名
   * @param {any} data - データ
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Storage listener error:', error);
      }
    });
  }
}
```

### 1.3 メッセージパッシングAPI

#### 1.3.1 メッセージ型定義
```javascript
/**
 * 拡張機能内メッセージの型定義
 */
const MessageTypes = {
  // 設定関連
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
  
  // テーマ関連
  THEME_CHANGE: 'theme:change',
  THEME_LIST: 'theme:list',
  THEME_CUSTOM_CSS: 'theme:customCSS',
  
  // 目次関連
  TOC_GENERATE: 'toc:generate',
  TOC_NAVIGATE: 'toc:navigate',
  TOC_TOGGLE: 'toc:toggle',
  
  // 検索関連
  SEARCH_EXECUTE: 'search:execute',
  SEARCH_NAVIGATE: 'search:navigate',
  SEARCH_CLEAR: 'search:clear',
  
  // エクスポート関連
  EXPORT_PDF: 'export:pdf',
  EXPORT_HTML: 'export:html',
  EXPORT_MARKDOWN: 'export:markdown',
  
  // Mermaid関連
  MERMAID_RENDER: 'mermaid:render',
  MERMAID_EDIT: 'mermaid:edit',
  MERMAID_SAVE: 'mermaid:save',
  
  // 編集関連
  EDITOR_OPEN: 'editor:open',
  EDITOR_SAVE: 'editor:save',
  EDITOR_CLOSE: 'editor:close',
  
  // ファイル管理関連
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:saveAs',
  FILE_BACKUP: 'file:backup',
  
  // UI関連
  UI_TOGGLE_PANEL: 'ui:togglePanel',
  UI_RESIZE: 'ui:resize',
  UI_FULLSCREEN: 'ui:fullscreen',
  
  // システム関連
  SYSTEM_INFO: 'system:info',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_DEBUG: 'system:debug'
};

/**
 * メッセージ構造の定義
 */
const MessageSchema = {
  type: 'string',      // メッセージタイプ
  payload: 'object',   // ペイロード
  requestId: 'string', // リクエストID（レスポンス用）
  timestamp: 'number', // タイムスタンプ
  source: 'string'     // 送信元
};
```

#### 1.3.2 メッセージハンドラークラス
```javascript
/**
 * メッセージハンドリングクラス
 */
class MessageHandler {
  constructor() {
    this.handlers = new Map();
    this.pendingRequests = new Map();
    this.init();
  }
  
  /**
   * 初期化
   */
  init() {
    // Chrome runtime メッセージリスナー
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 非同期レスポンス
    });
    
    // デフォルトハンドラーの登録
    this.registerDefaultHandlers();
  }
  
  /**
   * メッセージハンドラーの登録
   * @param {string} type - メッセージタイプ
   * @param {Function} handler - ハンドラー関数
   */
  register(type, handler) {
    this.handlers.set(type, handler);
  }
  
  /**
   * メッセージの送信
   * @param {string} type - メッセージタイプ
   * @param {Object} payload - ペイロード
   * @param {Object} options - オプション
   * @returns {Promise<any>} レスポンス
   */
  async send(type, payload = {}, options = {}) {
    const message = {
      type,
      payload,
      requestId: this.generateRequestId(),
      timestamp: Date.now(),
      source: options.source || 'content'
    };
    
    try {
      if (options.tabId) {
        // 特定のタブに送信
        return await chrome.tabs.sendMessage(options.tabId, message);
      } else {
        // ランタイムに送信
        return await chrome.runtime.sendMessage(message);
      }
    } catch (error) {
      console.error('Message send error:', error);
      throw error;
    }
  }
  
  /**
   * メッセージの処理
   * @param {Object} message - メッセージ
   * @param {Object} sender - 送信者情報
   * @param {Function} sendResponse - レスポンス関数
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      // メッセージバリデーション
      if (!this.validateMessage(message)) {
        sendResponse({ error: 'Invalid message format' });
        return;
      }
      
      const handler = this.handlers.get(message.type);
      if (!handler) {
        sendResponse({ error: `Unknown message type: ${message.type}` });
        return;
      }
      
      // ハンドラー実行
      const result = await handler(message.payload, sender);
      sendResponse({ success: true, data: result });
      
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ 
        error: error.message,
        stack: error.stack 
      });
    }
  }
  
  /**
   * メッセージのバリデーション
   * @param {Object} message - メッセージ
   * @returns {boolean} バリデーション結果
   */
  validateMessage(message) {
    return (
      message &&
      typeof message.type === 'string' &&
      message.payload !== undefined &&
      typeof message.timestamp === 'number'
    );
  }
  
  /**
   * リクエストIDの生成
   * @returns {string} リクエストID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * デフォルトハンドラーの登録
   */
  registerDefaultHandlers() {
    // 設定取得
    this.register(MessageTypes.SETTINGS_GET, async (payload) => {
      const storage = new StorageManager();
      return await storage.get(payload.keys);
    });
    
    // 設定保存
    this.register(MessageTypes.SETTINGS_SET, async (payload) => {
      const storage = new StorageManager();
      await storage.set(payload.settings);
      return { success: true };
    });
    
    // テーマ変更
    this.register(MessageTypes.THEME_CHANGE, async (payload) => {
      const themeManager = window.themeManager;
      if (themeManager) {
        await themeManager.applyTheme(payload.theme);
        return { success: true };
      }
      throw new Error('ThemeManager not available');
    });
    
    // 目次生成
    this.register(MessageTypes.TOC_GENERATE, async (payload) => {
      const tocGenerator = window.tocGenerator;
      if (tocGenerator) {
        tocGenerator.init();
        return { success: true };
      }
      throw new Error('TOCGenerator not available');
    });
    
    // 検索実行
    this.register(MessageTypes.SEARCH_EXECUTE, async (payload) => {
      const searchEngine = window.searchEngine;
      if (searchEngine) {
        const results = searchEngine.search(payload.query, payload.options);
        return { results };
      }
      throw new Error('SearchEngine not available');
    });
    
    // PDF エクスポート
    this.register(MessageTypes.EXPORT_PDF, async (payload) => {
      const exportManager = window.exportManager;
      if (exportManager) {
        const pdfBlob = await exportManager.exportToPDF(payload.options);
        return { success: true, size: pdfBlob.size };
      }
      throw new Error('ExportManager not available');
    });
  }
}
```

### 1.4 Content Script API

#### 1.4.1 メインコンテンツスクリプト
```javascript
/**
 * メインコンテンツスクリプト
 */
class MarkdownViewerApp {
  constructor() {
    this.components = new Map();
    this.messageHandler = new MessageHandler();
    this.storageManager = new StorageManager();
    this.isInitialized = false;
  }
  
  /**
   * アプリケーションの初期化
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing Markdown Viewer App...');
      
      // 設定の読み込み
      const settings = await this.storageManager.get();
      
      // コアコンポーネントの初期化
      await this.initializeComponents(settings);
      
      // UIの構築
      this.buildUI();
      
      // イベントリスナーの設定
      this.setupEventListeners();
      
      // グローバル変数の設定（他のスクリプトからアクセス可能）
      this.exposeGlobalAPI();
      
      this.isInitialized = true;
      console.log('Markdown Viewer App initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showErrorMessage(error);
    }
  }
  
  /**
   * コンポーネントの初期化
   * @param {Object} settings - 設定
   */
  async initializeComponents(settings) {
    // Markdown エンジン
    this.components.set('markdownEngine', new MarkdownEngine({
      gfm: true,
      breaks: false,
      sanitize: false
    }));
    
    // Mermaid エンジン
    this.components.set('mermaidEngine', new MermaidEngine({
      theme: settings.mermaid.theme,
      interactive: settings.mermaid.interactive
    }));
    
    // テーママネージャー
    this.components.set('themeManager', new ThemeManager());
    await this.components.get('themeManager').init();
    
    // 目次ジェネレーター
    if (settings.toc.enabled) {
      this.components.set('tocGenerator', new TOCGenerator(settings.toc));
    }
    
    // 検索エンジン
    this.components.set('searchEngine', new SearchEngine(document.body));
    
    // エクスポートマネージャー
    this.components.set('exportManager', new ExportManager(settings.export));
  }
  
  /**
   * UIの構築
   */
  buildUI() {
    // ツールバーの作成
    const toolbar = new Toolbar(document.body);
    this.components.set('toolbar', toolbar);
    
    // 目次パネルの作成
    const tocGenerator = this.components.get('tocGenerator');
    if (tocGenerator) {
      const tocPanel = new TOCPanel(document.body, tocGenerator.headings);
      this.components.set('tocPanel', tocPanel);
    }
    
    // 検索パネルの作成
    const searchPanel = new SearchPanel(document.body);
    this.components.set('searchPanel', searchPanel);
    
    // テーマセレクターの作成
    const themeSelector = new ThemeSelector(
      toolbar.container.querySelector('.theme-selector-container'),
      this.components.get('themeManager')
    );
    this.components.set('themeSelector', themeSelector);
  }
  
  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // ストレージ変更の監視
    this.storageManager.addListener((event, data) => {
      this.handleSettingsChange(event, data);
    });
    
    // ウィンドウリサイズの監視
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });
    
    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcut(e);
    });
    
    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  /**
   * グローバルAPIの公開
   */
  exposeGlobalAPI() {
    // 各コンポーネントをグローバルに公開
    this.components.forEach((component, name) => {
      window[name] = component;
    });
    
    // アプリケーション本体も公開
    window.markdownViewerApp = this;
  }
  
  /**
   * 設定変更の処理
   * @param {string} event - イベント名
   * @param {Object} data - データ
   */
  async handleSettingsChange(event, data) {
    if (event === 'changed') {
      // 各コンポーネントに設定変更を通知
      for (const [name, component] of this.components) {
        if (typeof component.updateSettings === 'function') {
          await component.updateSettings(data);
        }
      }
    }
  }
  
  /**
   * ウィンドウリサイズの処理
   */
  handleWindowResize() {
    // レスポンシブ対応
    const tocPanel = this.components.get('tocPanel');
    if (tocPanel) {
      tocPanel.handleResize();
    }
    
    // Mermaid図の再描画
    const mermaidEngine = this.components.get('mermaidEngine');
    if (mermaidEngine) {
      mermaidEngine.handleResize();
    }
  }
  
  /**
   * キーボードショートカットの処理
   * @param {KeyboardEvent} e - キーボードイベント
   */
  handleKeyboardShortcut(e) {
    const shortcuts = {
      // Ctrl+F: 検索
      'ctrl+f': () => {
        e.preventDefault();
        this.components.get('searchPanel')?.show();
      },
      
      // Ctrl+T: テーマ切り替え
      'ctrl+t': () => {
        e.preventDefault();
        this.components.get('themeSelector')?.toggleDropdown();
      },
      
      // Ctrl+O: 目次切り替え
      'ctrl+o': () => {
        e.preventDefault();
        this.components.get('tocPanel')?.toggle();
      },
      
      // Ctrl+P: PDF出力
      'ctrl+p': () => {
        e.preventDefault();
        this.components.get('exportManager')?.exportToPDF();
      }
    };
    
    const key = this.getShortcutKey(e);
    const handler = shortcuts[key];
    if (handler) {
      handler();
    }
  }
  
  /**
   * ショートカットキーの取得
   * @param {KeyboardEvent} e - キーボードイベント
   * @returns {string} ショートカットキー
   */
  getShortcutKey(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }
  
  /**
   * エラーメッセージの表示
   * @param {Error} error - エラー
   */
  showErrorMessage(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'markdown-viewer-error';
    errorDiv.innerHTML = `
      <h2>エラーが発生しました</h2>
      <p>${error.message}</p>
      <details>
        <summary>詳細情報</summary>
        <pre>${error.stack}</pre>
      </details>
    `;
    
    document.body.insertBefore(errorDiv, document.body.firstChild);
  }
  
  /**
   * クリーンアップ処理
   */
  cleanup() {
    // 各コンポーネントの破棄
    this.components.forEach((component) => {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    // イベントリスナーの削除
    this.storageManager.removeListener(this.handleSettingsChange);
  }
}

// アプリケーションの起動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MarkdownViewerApp().init();
  });
} else {
  new MarkdownViewerApp().init();
}
```

### 1.5 Background Script API

#### 1.5.1 サービスワーカー
```javascript
/**
 * Background Service Worker
 */
class BackgroundService {
  constructor() {
    this.messageHandler = new MessageHandler();
    this.init();
  }
  
  /**
   * 初期化
   */
  init() {
    console.log('Background service worker started');
    
    // インストール時の処理
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });
    
    // 起動時の処理
    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });
    
    // タブ更新の監視
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
    
    // メッセージハンドラーの登録
    this.registerMessageHandlers();
  }
  
  /**
   * インストール時の処理
   * @param {Object} details - インストール詳細
   */
  async handleInstall(details) {
    if (details.reason === 'install') {
      console.log('Extension installed');
      
      // デフォルト設定の初期化
      await this.initializeDefaultSettings();
      
      // ウェルカムページの表示
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
      });
      
    } else if (details.reason === 'update') {
      console.log('Extension updated');
      
      // 設定の移行処理
      await this.migrateSettings(details.previousVersion);
    }
  }
  
  /**
   * 起動時の処理
   */
  handleStartup() {
    console.log('Extension startup');
  }
  
  /**
   * タブ更新の処理
   * @param {number} tabId - タブID
   * @param {Object} changeInfo - 変更情報
   * @param {Object} tab - タブ情報
   */
  handleTabUpdate(tabId, changeInfo, tab) {
    // Markdownファイルの検出
    if (changeInfo.status === 'complete' && tab.url) {
      const isMarkdownFile = /\.(md|markdown)$/i.test(tab.url);
      
      if (isMarkdownFile) {
        // アイコンの更新
        chrome.action.setIcon({
          tabId: tabId,
          path: {
            16: 'icons/icon-16-active.png',
            32: 'icons/icon-32-active.png',
            48: 'icons/icon-48-active.png',
            128: 'icons/icon-128-active.png'
          }
        });
        
        // バッジの設定
        chrome.action.setBadgeText({
          tabId: tabId,
          text: 'MD'
        });
        
        chrome.action.setBadgeBackgroundColor({
          tabId: tabId,
          color: '#4CAF50'
        });
      }
    }
  }
  
  /**
   * デフォルト設定の初期化
   */
  async initializeDefaultSettings() {
    const storage = new StorageManager();
    const currentSettings = await storage.get();
    
    // 未設定の項目にデフォルト値を設定
    const defaultSettings = storage.getDefaults();
    const mergedSettings = {};
    
    Object.keys(defaultSettings).forEach(key => {
      if (!currentSettings[key]) {
        mergedSettings[key] = defaultSettings[key];
      }
    });
    
    if (Object.keys(mergedSettings).length > 0) {
      await storage.set(mergedSettings);
    }
  }
  
  /**
   * 設定の移行処理
   * @param {string} previousVersion - 前のバージョン
   */
  async migrateSettings(previousVersion) {
    console.log(`Migrating settings from version ${previousVersion}`);
    
    const storage = new StorageManager();
    const currentSettings = await storage.get();
    
    // バージョン別の移行処理
    if (this.compareVersions(previousVersion, '2.0.0') < 0) {
      // v2.0.0未満からの移行
      await this.migrateFromV1(currentSettings);
    }
  }
  
  /**
   * v1からの移行処理
   * @param {Object} settings - 現在の設定
   */
  async migrateFromV1(settings) {
    const storage = new StorageManager();
    const migrations = {};
    
    // 古い設定キーを新しいキーに移行
    if (settings.darkMode !== undefined) {
      migrations.theme = {
        current: settings.darkMode ? 'dark' : 'light',
        autoDetect: false
      };
      await storage.remove('darkMode');
    }
    
    if (settings.showTOC !== undefined) {
      migrations.toc = {
        enabled: settings.showTOC,
        position: 'left'
      };
      await storage.remove('showTOC');
    }
    
    if (Object.keys(migrations).length > 0) {
      await storage.set(migrations);
    }
  }
  
  /**
   * バージョン比較
   * @param {string} version1 - バージョン1
   * @param {string} version2 - バージョン2
   * @returns {number} 比較結果 (-1, 0, 1)
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }
  
  /**
   * メッセージハンドラーの登録
   */
  registerMessageHandlers() {
    // システム情報の取得
    this.messageHandler.register(MessageTypes.SYSTEM_INFO, async () => {
      return {
        version: chrome.runtime.getManifest().version,
        platform: await chrome.runtime.getPlatformInfo(),
        browserInfo: navigator.userAgent
      };
    });
    
    // エラー報告
    this.messageHandler.register(MessageTypes.SYSTEM_ERROR, async (payload) => {
      console.error('Error reported from content script:', payload);
      
      // エラーログの保存（必要に応じて）
      // await this.saveErrorLog(payload);
      
      return { success: true };
    });
  }
}

// サービスワーカーの起動
new BackgroundService();
```

---

**作成日**: 2025年1月28日  
**バージョン**: 1.0  
**作成者**: Kiro AI Assistant