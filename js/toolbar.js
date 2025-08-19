/**
 * @fileoverview ツールバークラス - Markdown Viewerのメインツールバー機能を提供
 *
 * このファイルは、Chrome拡張機能「Markdown Viewer with Mermaid」のツールバー管理を実装します。
 * 検索、テーマ切り替え、印刷、エクスポート、設定などの機能へのアクセスを提供します。
 *
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 */

/**
 * ツールバークラス
 * Markdownビューアーのメインツールバーインターフェースを作成・管理します
 *
 * @class Toolbar
 * @description このクラスは以下の機能を提供します：
 * - フローティングツールバーの作成と配置
 * - 検索機能へのアクセス
 * - テーマ切り替え機能
 * - 印刷機能
 * - エクスポート機能（HTML）
 * - 設定パネルへのアクセス
 * - ツールバーのドラッグ移動
 * - キーボードショートカット
 *
 * @example
 * // ツールバーを初期化
 * const toolbar = new Toolbar(document.body);
 *
 * // 特定のコンテナにツールバーを作成
 * const toolbar = new Toolbar(document.getElementById('content'));
 *
 * @author 76Hata
 * @since 1.0.0
 */
class Toolbar {
  /**
   * Toolbarクラスのコンストラクタ
   *
   * @constructor
   * @param {Element} container - ツールバーを配置するコンテナ要素
   * @description ツールバーインスタンスを初期化します。
   *              各種プロパティを設定し、init()メソッドを呼び出します。
   * @since 1.0.0
   */
  constructor(container) {
    /** @type {Element} ツールバーを配置するコンテナ要素 */
    this.container = container || document.body;

    /** @type {HTMLElement|null} ツールバーのDOM要素 */
    this.toolbarElement = null;

    /** @type {ThemeManager|null} テーマ管理インスタンス */
    this.themeManager = null;

    /** @type {SearchEngine|null} 検索エンジンインスタンス */
    this.searchEngine = null;

    /** @type {TOCGenerator|null} 目次生成インスタンス */
    this.tocGenerator = null;

    this.init();
  }

  /**
   * ツールバーの初期化処理
   *
   * @method init
   * @description ツールバーの初期化を行います。以下の順序で処理を実行します：
   *              1. コンテナ要素の存在確認
   *              2. ツールバー要素の作成
   *              3. イベントバインディング
   *              4. 関連コンポーネントの初期化
   * @returns {void} 戻り値なし
   * @since 1.0.0
   */
  init() {
    // DOM要素の存在確認
    if (!this.container) {
      console.error('Toolbar container not found');
      return;
    }

    this.createToolbar();
    this.bindEvents();
    this.initializeComponents();
  }

  createToolbar() {
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'main-toolbar';
    this.toolbarElement.title = 'ドラッグで移動可能';
    
    // Create elements safely without innerHTML
    const dragHandle = document.createElement('div');
    dragHandle.className = 'toolbar-drag-handle';
    dragHandle.title = 'ツールバーをドラッグして移動';
    dragHandle.textContent = '⋮⋮';
    
    const searchBtn = document.createElement('button');
    searchBtn.className = 'toolbar-btn';
    searchBtn.id = 'search-btn';
    searchBtn.title = '検索 (Ctrl+F)';
    searchBtn.textContent = '🔍';
    
    const themeSelectorContainer = document.createElement('div');
    themeSelectorContainer.className = 'theme-selector-container';
    
    const printBtn = document.createElement('button');
    printBtn.className = 'toolbar-btn';
    printBtn.id = 'print-btn';
    printBtn.title = '印刷 (Ctrl+Shift+P)';
    printBtn.textContent = '🖨️';
    
    const exportSelector = document.createElement('div');
    exportSelector.className = 'export-selector';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'toolbar-btn';
    exportBtn.id = 'export-btn';
    exportBtn.title = 'HTMLエクスポート';
    exportBtn.textContent = '📤';
    exportSelector.appendChild(exportBtn);
    
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'toolbar-btn';
    settingsBtn.id = 'settings-btn';
    settingsBtn.title = '設定';
    settingsBtn.textContent = '⚙️';
    
    const hideBtn = document.createElement('button');
    hideBtn.className = 'toolbar-btn';
    hideBtn.id = 'hide-toolbar-btn';
    hideBtn.title = 'ツールバーを隠す (F11)';
    hideBtn.textContent = '✕';
    
    // Append all elements
    this.toolbarElement.appendChild(dragHandle);
    this.toolbarElement.appendChild(searchBtn);
    this.toolbarElement.appendChild(themeSelectorContainer);
    this.toolbarElement.appendChild(printBtn);
    this.toolbarElement.appendChild(exportSelector);
    this.toolbarElement.appendChild(settingsBtn);
    this.toolbarElement.appendChild(hideBtn);

    this.container.appendChild(this.toolbarElement);
    this.createShowButton();
    this.makeDraggable(this.toolbarElement);
    this.restoreToolbarPosition();
  }

  initializeComponents() {
    try {
      // Theme Manager
      if (typeof ThemeManager !== 'undefined') {
        this.themeManager = new ThemeManager();
      } else {
        console.warn('ThemeManager not available');
      }

      // Theme Selector
      const themeContainer = this.toolbarElement?.querySelector(
        '.theme-selector-container'
      );
      if (themeContainer) {
        this.createThemeSelector(themeContainer);
        // テーマセレクター作成後にイベントをバインド
        setTimeout(() => {
          this.bindThemeEvents();
        }, 50);
      }

      // Search Engine (using fixed version)
      if (typeof SearchEngine !== 'undefined') {
        this.searchEngine = new SearchEngine();
      } else {
        console.warn('SearchEngine not available');
      }

      // TOC Generator (if headings exist)
      setTimeout(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        console.log(`Found ${headings.length} headings for TOC`);

        if (headings.length > 0 && typeof TOCGenerator !== 'undefined') {
          try {
            this.tocGenerator = new TOCGenerator();
            console.log('✅ TOC Generator initialized');
          } catch (error) {
            console.error('❌ TOC Generator initialization failed:', error);
          }
        } else {
          console.warn(
            'TOC Generator disabled: no headings or class not available'
          );
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }

  createThemeSelector(container) {
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    
    // Create theme selector button safely
    const themeSelectorBtn = document.createElement('button');
    themeSelectorBtn.className = 'toolbar-btn theme-selector-button';
    themeSelectorBtn.title = 'テーマを選択';
    themeSelectorBtn.textContent = '🎨 ';
    
    const themeNameSpan = document.createElement('span');
    themeNameSpan.className = 'theme-name';
    themeNameSpan.textContent = 'Light';
    themeSelectorBtn.appendChild(themeNameSpan);
    
    // Create dropdown
    const themeDropdown = document.createElement('div');
    themeDropdown.className = 'theme-dropdown';
    themeDropdown.style.display = 'none';
    
    const themeOptions = document.createElement('div');
    themeOptions.className = 'theme-options';
    
    // Create theme options
    const themes = [
      { key: 'light', label: 'Light', preview: 'light-preview' },
      { key: 'dark', label: 'Dark', preview: 'dark-preview' },
      { key: 'sepia', label: 'Sepia', preview: 'sepia-preview' }
    ];
    
    themes.forEach(theme => {
      const themeOption = document.createElement('div');
      themeOption.className = 'theme-option';
      themeOption.dataset.theme = theme.key;
      
      const themePreview = document.createElement('div');
      themePreview.className = `theme-preview ${theme.preview}`;
      
      const previewText = document.createElement('div');
      previewText.className = 'preview-text';
      previewText.textContent = 'Aa';
      themePreview.appendChild(previewText);
      
      const themeLabel = document.createElement('span');
      themeLabel.className = 'theme-label';
      themeLabel.textContent = theme.label;
      
      themeOption.appendChild(themePreview);
      themeOption.appendChild(themeLabel);
      themeOptions.appendChild(themeOption);
    });
    
    themeDropdown.appendChild(themeOptions);
    themeSelector.appendChild(themeSelectorBtn);
    themeSelector.appendChild(themeDropdown);

    container.appendChild(themeSelector);
  }

  /**
   * ツールバーのイベントリスナーをバインド
   *
   * @method bindEvents
   * @description ツールバーの各ボタンおよびキーボードショートカットのイベントハンドラーを設定します：
   * - 検索ボタン: 検索パネルを表示
   * - 印刷ボタン: 印刷ダイアログを開く
   * - エクスポートセレクター: 形式選択とエクスポート実行
   * - 設定ボタン: 設定パネルを開く
   * - 非表示ボタン: ツールバーを隠す
   * - キーボードショートカット: 各種操作の高速実行
   *
   * @example
   * // イベントリスナーのバインド例
   * this.bindEvents();
   *
   * // 設定されるキーボードショートカット：
   * // - Ctrl/Cmd + Shift + P → 印刷実行
   * // - Ctrl/Cmd + T → 目次トグル
   * // - F11 → ツールバー表示/非表示
   * // - Escape → ツールバー表示（非表示時のみ）
   *
   * @since 1.0.0
   */
  bindEvents() {
    // 検索ボタンのクリックイベントハンドラー
    const searchBtn = this.toolbarElement.querySelector('#search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        console.log('Search button clicked');
        if (this.searchEngine) {
          this.searchEngine.show();
        } else {
          console.warn('Search Engine not available');
        }
      });
    }

    // 印刷ボタンのクリックイベントハンドラー
    const printBtn = this.toolbarElement.querySelector('#print-btn');
    printBtn.addEventListener('click', () => {
      this.handlePrint();
    });

    // エクスポートセレクターのイベントバインディング
    // エクスポートボタンのイベントリスナーを設定
    this.bindExportEvents();

    // 設定ボタンのクリックイベントハンドラー
    const settingsBtn = this.toolbarElement.querySelector('#settings-btn');
    settingsBtn.addEventListener('click', () => {
      this.openSettings();
    });

    // ツールバー非表示ボタンのクリックイベントハンドラー
    const hideBtn = this.toolbarElement.querySelector('#hide-toolbar-btn');
    hideBtn.addEventListener('click', () => {
      this.hideToolbar();
    });

    // テーマセレクターのイベントは作成後に別途バインドされます

    // ドキュメント全体のキーボードショートカットハンドラー
    document.addEventListener('keydown', e => {
      // Ctrl/Cmd + Shift の組み合わせショートカット
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key) {
          case 'P': // Ctrl+Shift+P: 印刷実行
            e.preventDefault();
            this.handlePrint();
            break;
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd の単体ショートカット
        switch (e.key) {
          case 't': // Ctrl+T: 目次トグル
            e.preventDefault();
            this.toggleTOC();
            break;
        }
      } else if (e.key === 'F11') {
        // F11: ツールバー表示/非表示切り替え
        e.preventDefault();
        this.toggleToolbar();
      } else if (e.key === 'Escape' && this.isToolbarHidden()) {
        // Escape: ツールバー表示（非表示時のみ有効）
        e.preventDefault();
        this.showToolbar();
      }
    });
  }

  bindThemeEvents() {
    const themeSelector = this.toolbarElement.querySelector('.theme-selector');
    if (!themeSelector) {
      console.warn('Theme selector not found');
      return;
    }

    const button = themeSelector.querySelector('.theme-selector-button');
    const dropdown = themeSelector.querySelector('.theme-dropdown');

    if (!button || !dropdown) {
      console.warn('Theme selector components not found');
      return;
    }

    button.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleThemeDropdown();
    });

    dropdown.addEventListener('click', e => {
      if (e.target.closest('.theme-option')) {
        const themeKey = e.target.closest('.theme-option').dataset.theme;
        this.selectTheme(themeKey);
      }

      // 自動切り替えボタンのイベントハンドラを削除
    });

    document.addEventListener('click', e => {
      if (!themeSelector.contains(e.target)) {
        this.closeThemeDropdown();
      }
    });

    // Theme change observer
    this.themeManager.addObserver((event, data) => {
      if (event === 'themeChanged') {
        this.updateThemeDisplay(data.theme);
      }
    });
  }

  toggleThemeDropdown() {
    const dropdown = this.toolbarElement.querySelector('.theme-dropdown');
    const isVisible = dropdown.style.display !== 'none';
    dropdown.style.display = isVisible ? 'none' : 'block';
  }

  closeThemeDropdown() {
    const dropdown = this.toolbarElement.querySelector('.theme-dropdown');
    dropdown.style.display = 'none';
  }

  async selectTheme(themeKey) {
    if (this.themeManager) {
      await this.themeManager.applyTheme(themeKey);
      this.closeThemeDropdown();
    }
  }

  // toggleAutoTheme関数を削除

  updateThemeDisplay(themeName) {
    const themeNameElement = this.toolbarElement.querySelector('.theme-name');
    const themeNames = {
      light: 'Light',
      dark: 'Dark',
      sepia: 'Sepia',
    };

    themeNameElement.textContent = themeNames[themeName] || themeName;

    // Update active state
    this.toolbarElement.querySelectorAll('.theme-option').forEach(option => {
      option.classList.toggle('active', option.dataset.theme === themeName);
    });

    // 自動切り替えボタンの更新コードを削除
  }

  // エクスポートボタンのイベントリスナーを設定
  bindExportEvents() {
    const exportBtn = this.toolbarElement.querySelector('#export-btn');
    if (!exportBtn) {
      console.warn('Export button not found');
      return;
    }

    exportBtn.addEventListener('click', e => {
      e.stopPropagation();
      console.log('Export button clicked - executing HTML export');
      this.exportAsHTML();
    });
  }

  // ドロップダウン関連メソッドを削除（直接エクスポートに変更）

  toggleTOC() {
    if (!this.tocGenerator) {
      return;
    }

    const tocPanel = document.querySelector('.toc-panel');
    if (tocPanel) {
      const isVisible = tocPanel.style.display !== 'none';
      tocPanel.style.display = isVisible ? 'none' : 'block';

      // Update content margin
      const content =
        document.querySelector('#markdown-content') || document.body;
      if (isVisible) {
        content.style.marginLeft = '';
      } else {
        content.style.marginLeft = 'calc(250px + 20px)';
      }
    }
  }

  handlePrint() {
    // サンドボックス環境の検出
    const isSandboxed = this.detectSandboxEnvironment();

    if (isSandboxed) {
      // サンドボックス環境では直接エラーメッセージを表示
      console.log('Print blocked in sandbox environment');
      this.showPrintErrorToast();
      return;
    }

    try {
      window.print();
      console.log('Print dialog opened');

      // コンソールエラーを監視（短時間）
      this.monitorPrintErrors();
    } catch (error) {
      console.error('Print failed:', error);
      this.showPrintErrorToast();
    }
  }

  safePrint() {
    // サンドボックス環境の検出
    const isSandboxed = this.detectSandboxEnvironment();

    if (isSandboxed) {
      // サンドボックス環境では直接エラーメッセージを表示
      this.showPrintErrorToast();
      return;
    }

    try {
      // 通常環境では印刷を試行
      window.print();

      // コンソールエラーを監視（短時間）
      this.monitorPrintErrors();
    } catch (error) {
      console.warn('Print function error:', error);
      this.showPrintErrorToast();
    }
  }

  detectSandboxEnvironment() {
    // 既知のサンドボックス環境をチェック
    return (
      location.hostname.includes('raw.githubusercontent.com') ||
      location.hostname.includes('githubusercontent.com') ||
      document.documentElement.hasAttribute('sandbox') ||
      (window.parent !== window &&
        window.parent.location.hostname !== location.hostname)
    );
  }

  monitorPrintErrors() {
    const originalConsoleError = console.error;
    let errorDetected = false;

    // コンソールエラーを一時的に監視
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (
        errorMessage.includes('print') ||
        errorMessage.includes('sandboxed') ||
        errorMessage.includes('allow-modals') ||
        errorMessage.includes('Blocked') ||
        errorMessage.includes('Ignored call')
      ) {
        errorDetected = true;
      }
      originalConsoleError.apply(console, args);
    };

    // 500ms後にチェック
    setTimeout(() => {
      console.error = originalConsoleError;
      if (errorDetected) {
        this.showPrintErrorToast();
      }
    }, 500);
  }

  downloadPrintableVersion() {
    const printContent = document.getElementById('markdown-content').innerHTML;
    const currentTitle = document.title || 'markdown-document';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Print - ${currentTitle}</title>
    <style>
        body { 
            font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 { 
            margin-top: 1.5em; 
            margin-bottom: 0.5em; 
            font-weight: 600;
        }
        h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        code { 
            background: #f6f8fa; 
            padding: 2px 4px; 
            border-radius: 3px; 
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 85%;
        }
        pre { 
            background: #f6f8fa; 
            padding: 16px; 
            border-radius: 6px; 
            overflow-x: auto;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 85%;
        }
        pre code {
            background: transparent;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #dfe2e5;
            margin: 0;
            padding-left: 16px;
            color: #6a737d;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        th, td {
            border: 1px solid #dfe2e5;
            padding: 8px 12px;
            text-align: left;
        }
        th {
            background-color: #f6f8fa;
            font-weight: 600;
        }
        ul, ol {
            padding-left: 2em;
        }
        a {
            color: #0366d6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        @media print {
            body { 
                font-size: 12pt; 
                line-height: 1.4;
            }
            h1 { font-size: 18pt; }
            h2 { font-size: 16pt; }
            h3 { font-size: 14pt; }
            h4 { font-size: 13pt; }
            h5, h6 { font-size: 12pt; }
            pre, code {
                font-size: 10pt;
            }
        }
        .print-header {
            text-align: center;
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 2px solid #eee;
        }
        .print-footer {
            margin-top: 3em;
            padding-top: 1em;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>Markdown Document</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Source: ${location.href}</p>
    </div>
    
    ${printContent}
    
    <div class="print-footer">
        <p>Generated by Markdown Viewer with Mermaid Extension</p>
    </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `markdown-document-${timestamp}.html`;
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), TIMEOUTS.VERY_LONG_DELAY);

    // Show success message
    this.showDownloadSuccess();
  }

  showDownloadSuccess() {
    const message = document.createElement('div');
    message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 350px;
        `;
    message.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 10px;">✅</span>
                <div>
                    <strong>ダウンロード完了！</strong><br>
                    <small>HTMLファイルをダウンロードしました。ブラウザで開いて印刷できます。</small>
                </div>
            </div>
        `;
    document.body.appendChild(message);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 5000);
  }

  showPrintFallback() {
    const message = document.createElement('div');
    message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #ccc;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
    message.innerHTML = `
            <h3>印刷機能について</h3>
            <p>この環境では印刷機能が制限されています。</p>
            <p>以下の方法をお試しください：</p>
            <ul style="text-align: left;">
                <li>ブラウザの印刷機能を使用</li>
                <li>ページを別のタブで開いてから印刷</li>
                <li>コンテンツをコピー&ペーストして印刷</li>
            </ul>
            <button class="fallback-close-btn" style="
                background: #2196f3; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 5px; 
                cursor: pointer;
                margin-top: 10px;
            ">閉じる</button>
        `;
    document.body.appendChild(message);

    // 閉じるボタンのイベントリスナーを追加
    const fallbackCloseBtn = message.querySelector('.fallback-close-btn');
    if (fallbackCloseBtn) {
      fallbackCloseBtn.addEventListener('click', () => {
        message.remove();
      });
    }

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 10000);
  }

  showPrintErrorToast() {
    // 既存のトーストがあれば削除
    const existingToast = document.querySelector('.print-error-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'print-error-toast';
    toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">⚠️</div>
                <div class="toast-message">
                    <strong>印刷機能について</strong><br>
                    この画面はこのボタンでは印刷できません。<br>
                    ブラウザの印刷機能をご利用ください。
                </div>
                <button class="toast-close">×</button>
            </div>
        `;

    // スタイルを設定
    toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10010;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideInRight 0.3s ease;
        `;

    // コンテンツのスタイル
    const content = toast.querySelector('.toast-content');
    content.style.cssText = `
            display: flex;
            align-items: flex-start;
            padding: 16px;
            gap: 12px;
        `;

    // アイコンのスタイル
    const icon = toast.querySelector('.toast-icon');
    icon.style.cssText = `
            font-size: 20px;
            flex-shrink: 0;
        `;

    // メッセージのスタイル
    const message = toast.querySelector('.toast-message');
    message.style.cssText = `
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            color: #856404;
        `;

    // 閉じるボタンのスタイル
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #856404;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            flex-shrink: 0;
        `;

    // CSSアニメーションを追加
    if (!document.querySelector('#toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .toast-close:hover {
                    background: rgba(0,0,0,0.1) !important;
                }
            `;
      document.head.appendChild(style);
    }

    // 閉じるボタンのイベントリスナーを追加
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    document.body.appendChild(toast);

    // 8秒後に自動で消す
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
          toast.remove();
        }, 300);
      }
    }, 8000);
  }

  addPrintStyles() {
    const printStyles = `
            @media print {
                .main-toolbar,
                .toc-panel,
                .search-panel {
                    display: none !important;
                }
                
                body {
                    margin: 0 !important;
                    padding: 20px !important;
                    font-size: 12pt !important;
                    line-height: 1.4 !important;
                }
                
                h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid;
                }
                
                pre, blockquote {
                    page-break-inside: avoid;
                }
                
                .mermaid {
                    page-break-inside: avoid;
                    max-width: 100% !important;
                }
                
                a {
                    text-decoration: none !important;
                    color: inherit !important;
                }
                
                a[href^="http"]:after {
                    content: " (" attr(href) ")";
                    font-size: 10pt;
                    color: #666;
                }
            }
        `;

    const existingPrintStyle = document.getElementById('print-styles');
    if (!existingPrintStyle) {
      const style = document.createElement('style');
      style.id = 'print-styles';
      style.textContent = printStyles;
      document.head.appendChild(style);
    }
  }

  openSettings() {
    // Create settings modal
    const modal = this.createSettingsModal();
    document.body.appendChild(modal);
  }

  createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>設定</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-section">
                            <h4>検索設定</h4>
                            <div class="setting-item">
                                <label>ハイライト色:</label>
                                <div class="color-selection-grid">
                                    <div class="color-option" data-color="#ffff00" style="background-color: #ffff00;" title="黄色（デフォルト）"></div>
                                    <div class="color-option" data-color="#ff0000" style="background-color: #ff0000;" title="赤色"></div>
                                    <div class="color-option" data-color="#00ff00" style="background-color: #00ff00;" title="緑色"></div>
                                    <div class="color-option" data-color="#0000ff" style="background-color: #0000ff;" title="青色"></div>
                                    <div class="color-option" data-color="#ff00ff" style="background-color: #ff00ff;" title="マゼンタ"></div>
                                    <div class="color-option" data-color="#00ffff" style="background-color: #00ffff;" title="シアン"></div>
                                    <div class="color-option" data-color="#ffa500" style="background-color: #ffa500;" title="オレンジ"></div>
                                    <div class="color-option" data-color="#800080" style="background-color: #800080;" title="紫色"></div>
                                </div>
                                <input type="hidden" id="setting-highlight-color" value="#ffff00">
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4>キーボードショートカット</h4>
                            <div class="setting-item">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr><td>F11</td><td>ツールバー表示/非表示</td></tr>
                                    <tr><td>Ctrl+F</td><td>検索パネル表示</td></tr>
                                    <tr><td>Ctrl+T</td><td>目次表示切り替え</td></tr>
                                    <tr><td>Ctrl+Shift+P</td><td>印刷</td></tr>
                                    <tr><td>Esc</td><td>パネルを閉じる</td></tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        `;

    // Color selection events with immediate application
    modal.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', () => {
        // Remove previous selection
        modal
          .querySelectorAll('.color-option')
          .forEach(opt => opt.classList.remove('selected'));
        // Select current option
        option.classList.add('selected');
        // Update hidden input
        const hiddenInput = modal.querySelector('#setting-highlight-color');
        hiddenInput.value = option.dataset.color;

        // Apply immediately
        this.applyHighlightColor(option.dataset.color);
      });
    });

    // Set initial selection
    const defaultColor = '#ffff00';
    const defaultOption = modal.querySelector(`[data-color="${defaultColor}"]`);
    if (defaultOption) {
      defaultOption.classList.add('selected');
    }

    // Modal events
    modal.addEventListener('click', e => {
      if (
        e.target.classList.contains('modal-overlay') ||
        e.target.classList.contains('modal-close')
      ) {
        modal.remove();
      }
    });

    return modal;
  }

  applyHighlightColor(color) {
    // Remove existing highlight style
    const existingStyle = document.getElementById('custom-highlight-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Apply new highlight style
    const style = document.createElement('style');
    style.id = 'custom-highlight-style';
    style.textContent = `.search-highlight { background-color: ${color} !important; }`;
    document.head.appendChild(style);

    console.log('Highlight color applied:', color);
  }

  disableTOCButton() {
    const tocBtn = this.toolbarElement?.querySelector('#toggle-toc-btn');
    if (tocBtn) {
      tocBtn.disabled = true;
      tocBtn.style.opacity = '0.5';
      tocBtn.title = '目次生成不可（見出しがありません）';
    }
  }

  createShowButton() {
    this.showButtonElement = document.createElement('button');
    this.showButtonElement.className = 'toolbar-show-btn';
    this.showButtonElement.innerHTML = '📋';
    this.showButtonElement.title =
      'ツールバーを表示 (F11 または Esc) - ドラッグで移動可能';
    this.showButtonElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: var(--toolbar-bg);
            border: 1px solid var(--toolbar-border);
            border-radius: 8px;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1002;
            box-shadow: 0 4px 12px var(--shadow);
            cursor: move;
            font-size: 18px;
            user-select: none;
        `;

    this.showButtonElement.addEventListener('click', _e => {
      // ドラッグ操作でない場合のみツールバーを表示
      if (!this.isDragging) {
        this.showToolbar();
      }
    });

    this.makeDraggable(this.showButtonElement);
    this.container.appendChild(this.showButtonElement);
  }

  makeDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    const isToolbar = element === this.toolbarElement;

    // ツールバーの場合はドラッグハンドルまたはツールバー自体でドラッグ開始
    const dragTrigger = isToolbar ? element : element;

    dragTrigger.addEventListener('mousedown', e => {
      // ツールバーの場合、ボタンクリックは無視
      if (
        isToolbar &&
        (e.target.tagName === 'BUTTON' || e.target.closest('button'))
      ) {
        return;
      }

      e.preventDefault();
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    const handleMouseMove = e => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // 5px以上移動したらドラッグとみなす
      if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        isDragging = true;
        this.isDragging = true;
      }

      if (isDragging) {
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;
        const newLeft = Math.max(
          0,
          Math.min(window.innerWidth - elementWidth, startLeft + deltaX)
        );
        const newTop = Math.max(
          0,
          Math.min(window.innerHeight - elementHeight, startTop + deltaY)
        );

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
        element.style.right = 'auto';

        // 位置を保存
        if (isToolbar) {
          this.saveToolbarPosition(newLeft, newTop);
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // ドラッグ終了後、少し遅らせてクリックフラグをクリア
      setTimeout(() => {
        this.isDragging = false;
      }, 100);
    };
  }

  saveToolbarPosition(left, top) {
    if (window.SafeStorage) {
      window.SafeStorage.setItem(
        'toolbar-position',
        JSON.stringify({ left, top })
      );
    }
  }

  restoreToolbarPosition() {
    if (window.SafeStorage) {
      window.SafeStorage.getItem('toolbar-position', saved => {
        this.applyToolbarPosition(saved);
      });
    } else {
      this.applyToolbarPosition(null);
    }
  }

  applyToolbarPosition(saved) {
    if (saved) {
      try {
        const { left, top } = JSON.parse(saved);
        this.toolbarElement.style.left = `${left}px`;
        this.toolbarElement.style.top = `${top}px`;
        this.toolbarElement.style.right = 'auto';
      } catch (e) {
        console.warn('Failed to restore toolbar position:', e);
      }
    }
  }

  hideToolbar() {
    // ツールバーの位置を表示ボタンに反映（右端に合わせる）
    const _toolbarRect = this.toolbarElement.getBoundingClientRect();
    const showButtonWidth = 50; // 表示ボタンの幅

    if (this.toolbarElement.style.left && this.toolbarElement.style.top) {
      // ツールバーの右端から表示ボタンの幅を引いて位置調整
      const toolbarLeft = parseInt(this.toolbarElement.style.left);
      const toolbarWidth = this.toolbarElement.offsetWidth;
      const showButtonLeft = toolbarLeft + toolbarWidth - showButtonWidth;

      this.showButtonElement.style.left = `${showButtonLeft}px`;
      this.showButtonElement.style.top = this.toolbarElement.style.top;
      this.showButtonElement.style.right = 'auto';
    }

    this.toolbarElement.style.display = 'none';
    this.showButtonElement.style.display = 'flex';
    this.hideToolbarHint();
  }

  showToolbar() {
    // 表示ボタンの位置からツールバーの位置を計算（右端に合わせる）
    if (this.showButtonElement.style.left && this.showButtonElement.style.top) {
      const showButtonLeft = parseInt(this.showButtonElement.style.left);
      const showButtonWidth = 50; // 表示ボタンの幅

      // ツールバーが表示された後に幅を取得するため、一時的に表示
      this.toolbarElement.style.display = 'flex';
      this.toolbarElement.style.visibility = 'hidden';

      const toolbarWidth = this.toolbarElement.offsetWidth;

      // ツールバーの左端位置を計算（表示ボタンの右端がツールバーの右端になるように）
      const toolbarLeft = showButtonLeft + showButtonWidth - toolbarWidth;

      this.toolbarElement.style.left = `${toolbarLeft}px`;
      this.toolbarElement.style.top = this.showButtonElement.style.top;
      this.toolbarElement.style.right = 'auto';
      this.toolbarElement.style.visibility = 'visible';

      // 新しい位置を保存
      this.saveToolbarPosition(
        toolbarLeft,
        parseInt(this.showButtonElement.style.top)
      );
    } else {
      this.toolbarElement.style.display = 'flex';
    }

    this.showButtonElement.style.display = 'none';
    this.hideToolbarHint();
  }

  toggleToolbar() {
    if (this.isToolbarHidden()) {
      this.showToolbar();
    } else {
      this.hideToolbar();
    }
  }

  isToolbarHidden() {
    return this.toolbarElement.style.display === 'none';
  }

  showToolbarHint() {
    const hint = document.createElement('div');
    hint.id = 'toolbar-hint';
    hint.innerHTML =
      '📌 ツールバーが隠れています。<kbd>F11</kbd> または <kbd>Esc</kbd> で表示';
    hint.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
            opacity: 0.9;
            font-family: inherit;
        `;

    // 既存のヒントを削除
    this.hideToolbarHint();

    document.body.appendChild(hint);

    // 5秒後に自動的に隠す
    setTimeout(() => {
      this.hideToolbarHint();
    }, 5000);
  }

  hideToolbarHint() {
    const hint = document.getElementById('toolbar-hint');
    if (hint) {
      hint.remove();
    }
  }

  destroy() {
    if (this.toolbarElement) {
      this.toolbarElement.remove();
    }

    if (this.themeManager) {
      this.themeManager.destroy();
    }

    if (this.searchEngine) {
      this.searchEngine.destroy();
    }

    if (this.tocGenerator) {
      this.tocGenerator.destroy();
    }

    document.body.style.paddingTop = '';
  }

  exportAsHTML() {
    try {
      console.log('HTML Export attempted');

      // サンドボックス環境の検出
      const isSandboxed = this.detectSandboxEnvironment();

      if (isSandboxed) {
        console.log('HTML export blocked in sandbox environment');
        this.showExportErrorMessage();
        return;
      }

      // HTML生成とダウンロード
      const htmlContent = this.generateCompleteHTML();
      this.downloadHTMLFile(htmlContent);
      this.showExportSuccessMessage();
    } catch (error) {
      console.error('HTML export failed:', error);
      this.showExportErrorMessage();
    }
  }

  // PDFエクスポート機能を削除しました
  // コメントアウトされたコードはコード簡素化のため削除

  // 以下のメソッドは、PDF関連の大量コードを削除しました:
  // - exportAsPDF()
  // - generatePDF()
  // - loadPDFLibraries()
  // - generateImageBasedPDF()
  // - generateDirectPDF()
  // - addElementToPDF()
  // - addTextToPDF()
  // - getTextHeight()
  // - prepareElementsForPDF()
  // - renderOptimizedPDF()
  // - renderSafePDF()
  // - fallbackToPrintDialog()
  // - applyPrintStyles()
  // - removePrintStyles()
  // - showPDFGeneratingMessage()
  // - showPDFDirectSuccessMessage()
  // - showPDFSuccessMessage()
  // - removePDFMessages()
  // - showPDFErrorMessage()

  // 重複した旧showExportSuccessMessageメソッドを削除しました

  /**
   * 完全なHTMLファイルを生成する
   * @returns {string} HTMLコンテンツ
   */
  generateCompleteHTML() {
    const markdownContent = document.getElementById('markdown-content');
    if (!markdownContent) {
      throw new Error('Markdown content not found');
    }

    // ページタイトルを取得
    const title = document.title || 'Markdown Document';

    // 現在のスタイルを取得
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch {
          // CORSエラーやアクセスできないスタイルシートをスキップ
          return '';
        }
      })
      .join('\n');

    // HTMLテンプレートを生成
    const htmlTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* リセットスタイル */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* Markdownコンテンツのスタイル */
        ${styles}
        
        /* エクスポート用追加スタイル */
        .markdown-content {
            max-width: none;
        }
        
        /* ツールバーや他のUI要素を非表示 */
        .toolbar, .toc-panel, .search-panel {
            display: none !important;
        }
        
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="markdown-content">
        ${markdownContent.innerHTML}
    </div>
    
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
        <p>エクスポート日時: ${new Date().toLocaleString('ja-JP')}</p>
        <p>Generated by Markdown Viewer with Mermaid Chrome Extension</p>
    </footer>
</body>
</html>`;

    return htmlTemplate;
  }

  /**
   * HTMLファイルをダウンロードする
   * @param {string} htmlContent HTMLコンテンツ
   */
  downloadHTMLFile(htmlContent) {
    try {
      // Blobを作成
      const blob = new Blob([htmlContent], {
        type: 'text/html;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);

      // ダウンロードリンクを作成
      const link = document.createElement('a');
      link.href = url;

      // ファイル名を生成（タイトル + タイムスタンプ）
      const timestamp = new Date()
        .toISOString()
        .slice(0, SIZES.ANIMATION_OFFSET)
        .replace(/:/g, '-');
      const title = document.title || 'markdown-document';
      const filename = `${title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}-${timestamp}.html`;

      link.download = filename;
      link.style.display = 'none';

      // ダウンロードを実行
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`HTMLファイルをダウンロードしました: ${filename}`);
    } catch (error) {
      console.error('HTMLファイルのダウンロードに失敗しました:', error);
      throw error;
    }
  }

  // === PDF関連コードを完全削除しました ===
  showExportSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 350px;
        `;
    message.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 10px;">✅</span>
                <div>
                    <strong>HTMLエクスポート完了！</strong><br>
                    <small>ファイルをダウンロードしました。</small>
                </div>
            </div>
        `;
    document.body.appendChild(message);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  showExportErrorMessage() {
    // 既存のトーストがあれば削除
    const existingToast = document.querySelector('.export-error-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // 印刷エラーと完全に同じスタイル
    const toast = document.createElement('div');
    toast.className = 'export-error-toast';
    toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">⚠️</div>
                <div class="toast-message">
                    <strong>エクスポート機能について</strong><br>
                    この環境ではエクスポート機能を利用できません。<br>
                    ブラウザの印刷機能をご利用ください。
                </div>
                <button class="toast-close">×</button>
            </div>
        `;

    // スタイルを設定 - 印刷エラーと完全に同じ
    toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10010;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideInRight 0.3s ease;
        `;

    // コンテンツのスタイル
    const content = toast.querySelector('.toast-content');
    content.style.cssText = `
            display: flex;
            align-items: flex-start;
            padding: 16px;
            gap: 12px;
        `;

    // アイコンのスタイル
    const icon = toast.querySelector('.toast-icon');
    icon.style.cssText = `
            font-size: 20px;
            flex-shrink: 0;
        `;

    // メッセージのスタイル
    const message = toast.querySelector('.toast-message');
    message.style.cssText = `
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            color: #856404;
        `;

    // 閉じるボタンのスタイル
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #856404;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            flex-shrink: 0;
        `;

    // CSSアニメーションを追加
    if (!document.querySelector('#toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .toast-close:hover {
                    background: rgba(0,0,0,0.1) !important;
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 閉じるボタンのイベントリスナー
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    // ホバー効果
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.backgroundColor = 'rgba(0,0,0,0.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.backgroundColor = 'transparent';
    });

    // 5秒後に自動で閉じる
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }
}

// Ensure class is available globally
window.Toolbar = Toolbar;
