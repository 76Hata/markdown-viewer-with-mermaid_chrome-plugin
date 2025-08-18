/**
 * @fileoverview テーマ管理クラス - Markdown Viewerのテーマ切り替え機能を提供
 *
 * このファイルは、Chrome拡張機能「Markdown Viewer with Mermaid」のテーマ管理機能を実装します。
 * ライト、ダーク、セピアテーマの切り替えとカスタムCSSの適用を行います。
 *
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 */

/**
 * テーマ管理クラス
 * Markdownビューアーのテーマ切り替えとCSS変数の管理を行います
 *
 * @class ThemeManager
 * @description このクラスは以下の機能を提供します：
 * - 複数のテーマ（ライト、ダーク、セピア）の管理
 * - テーマ設定の永続化
 * - カスタムCSSSの適用
 * - Mermaid図表のテーマ連携
 * - テーマ変更時の観察者パターン実装
 *
 * @example
 * // テーママネージャーを初期化
 * const themeManager = new ThemeManager();
 *
 * // ダークテーマに切り替え
 * await themeManager.applyTheme('dark');
 *
 * // カスタムCSSを適用
 * await themeManager.setCustomCSS('body { font-size: 18px; }');
 *
 * @author 76Hata
 * @since 1.0.0
 */
class ThemeManager {
  /**
   * ThemeManagerクラスのコンストラクタ
   *
   * @constructor
   * @description テーママネージャーの初期化を行います。
   *              テーママップ、現在のテーマ、カスタムCSS、システムテーマクエリ、
   *              観察者セットを初期化し、init()メソッドを呼び出します。
   *
   * @example
   * const themeManager = new ThemeManager();
   *
   * @since 1.0.0
   */
  constructor() {
    /** @type {Map<string, Object>} テーマ情報のマップ */
    this.themes = new Map();

    /** @type {string} 現在適用中のテーマ名 */
    this.currentTheme = 'light';

    /** @type {string} カスタムCSS文字列 */
    this.customCSS = '';

    /** @type {MediaQueryList|null} システムダークテーマ検出用クエリ */
    this.systemThemeQuery = null;

    /** @type {Set<Function>} テーマ変更観察者のセット */
    this.observers = new Set();

    this.init();
  }

  /**
   * テーママネージャーの初期化処理
   *
   * @method init
   * @async
   * @description テーママネージャーの初期化を行います。以下の順序で処理を実行します：
   *              1. 設定の読み込み
   *              2. デフォルトテーマの登録
   *              3. システムテーマ検出の設定
   *              4. 現在のテーマを適用
   *
   * @returns {Promise<void>} 初期化完了のPromise
   *
   * @example
   * const themeManager = new ThemeManager();
   * // init()はコンストラクタで自動的に呼び出されます
   *
   * @throws {Error} 初期化中にエラーが発生した場合
   * @since 1.0.0
   */
  async init() {
    await this.loadSettings();
    this.registerDefaultThemes();
    this.setupSystemThemeDetection();
    this.applyTheme(this.currentTheme);
  }

  /**
   * テーマ設定をストレージから読み込む
   *
   * @method loadSettings
   * @async
   * @description Chrome同期ストレージ、SafeStorage、またはデフォルト値から
   *              テーマ設定とカスタムCSSを読み込みます。
   *              優先順位: Chrome Storage → SafeStorage → デフォルト値
   * @returns {Promise<void>} 設定読み込み完了のPromise
   * @since 1.0.0
   *
   * @example
   * // 設定を手動で再読み込み
   * await themeManager.loadSettings();
   */
  async loadSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        /** @type {Object} Chrome同期ストレージから取得した設定 */
        const result = await chrome.storage.sync.get(['theme', 'customCSS']);
        this.currentTheme = result.theme || 'light';
        this.customCSS = result.customCSS || '';
      } else if (window.SafeStorage) {
        window.SafeStorage.getItem('markdown-viewer-theme', theme => {
          this.currentTheme = theme || 'light';
        });
        window.SafeStorage.getItem('markdown-viewer-custom-css', customCSS => {
          this.customCSS = customCSS || '';
        });
      } else {
        this.currentTheme = 'light';
        this.customCSS = '';
      }
    } catch (error) {
      console.warn('Failed to load theme settings:', error);
    }
  }

  registerDefaultThemes() {
    this.registerTheme('light', {
      name: 'Light',
      variables: {
        '--bg-color': '#ffffff',
        '--text-color': '#24292e',
        '--heading-color': '#1f2328',
        '--link-color': '#0969da',
        '--border-color': '#d1d9e0',
        '--code-bg': '#f6f8fa',
        '--blockquote-border': '#d1d9e0',
        '--table-border': '#d1d9e0',
        '--table-header-bg': '#f6f8fa',
        '--toc-bg-color': '#f8f9fa',
        '--toc-border-color': '#e1e4e8',
        '--toc-header-bg': '#ffffff',
        '--toc-text-color': '#24292e',
        '--toc-link-color': '#0366d6',
        '--toc-hover-bg': '#f1f3f4',
        '--toc-active-bg': '#0366d6',
        '--toc-active-color': '#ffffff',
      },
      mermaidTheme: 'default',
    });

    this.registerTheme('dark', {
      name: 'Dark',
      variables: {
        '--bg-color': '#0d1117',
        '--text-color': '#e6edf3',
        '--heading-color': '#f0f6fc',
        '--link-color': '#2f81f7',
        '--border-color': '#30363d',
        '--code-bg': '#161b22',
        '--blockquote-border': '#30363d',
        '--table-border': '#30363d',
        '--table-header-bg': '#161b22',
        '--toc-bg-color': '#1a1a1a',
        '--toc-border-color': '#30363d',
        '--toc-header-bg': '#21262d',
        '--toc-text-color': '#c9d1d9',
        '--toc-link-color': '#58a6ff',
        '--toc-hover-bg': '#30363d',
        '--toc-active-bg': '#0969da',
        '--toc-active-color': '#ffffff',
      },
      mermaidTheme: 'dark',
    });

    this.registerTheme('sepia', {
      name: 'Sepia',
      variables: {
        '--bg-color': '#f7f3e9',
        '--text-color': '#3c3c3c',
        '--heading-color': '#2c2c2c',
        '--link-color': '#8b4513',
        '--border-color': '#d4c5a9',
        '--code-bg': '#f0ead6',
        '--blockquote-border': '#d4c5a9',
        '--table-border': '#d4c5a9',
        '--table-header-bg': '#f0ead6',
        '--toc-bg-color': '#f0ead6',
        '--toc-border-color': '#d4c5a9',
        '--toc-header-bg': '#f7f3e9',
        '--toc-text-color': '#3c3c3c',
        '--toc-link-color': '#8b4513',
        '--toc-hover-bg': '#e8dcc0',
        '--toc-active-bg': '#8b4513',
        '--toc-active-color': '#ffffff',
      },
      mermaidTheme: 'base',
    });
  }

  registerTheme(name, config) {
    this.themes.set(name, {
      name: config.name || name,
      variables: config.variables || {},
      mermaidTheme: config.mermaidTheme || 'default',
      customCSS: config.customCSS || '',
      ...config,
    });
  }

  setupSystemThemeDetection() {
    // システムテーマ検出機能を削除
  }

  async applyTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }

    this.applyCSSVariables(theme.variables);
    this.applyCustomCSS(theme.customCSS);
    await this.applyMermaidTheme(theme.mermaidTheme);

    document.documentElement.setAttribute('data-theme', themeName);

    this.currentTheme = themeName;
    await this.saveSettings();

    this.notifyObservers('themeChanged', { theme: themeName, config: theme });
  }

  applyCSSVariables(variables) {
    const root = document.documentElement;

    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  applyCustomCSS(css) {
    const existingStyle = document.getElementById('theme-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (css) {
      const style = document.createElement('style');
      style.id = 'theme-custom-css';
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  async applyMermaidTheme(mermaidTheme) {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
        },
      });

      await this.rerenderMermaidDiagrams();
    }
  }

  async rerenderMermaidDiagrams() {
    const mermaidElements = document.querySelectorAll('.mermaid');

    for (const element of mermaidElements) {
      try {
        let originalCode = element.dataset.mermaidCode || element.textContent;

        // エンコードされたコードをデコード
        if (originalCode && element.dataset.mermaidCode) {
          try {
            originalCode = decodeURIComponent(element.dataset.mermaidCode);
          } catch (decodeError) {
            console.warn(
              'Failed to decode mermaid code, using as-is:',
              decodeError
            );
            originalCode = element.dataset.mermaidCode;
          }
        }

        if (originalCode && originalCode.trim()) {
          const { svg } = await mermaid.render(
            `mermaid-${Date.now()}`,
            originalCode.trim()
          );
          element.innerHTML = svg;
        }
      } catch (error) {
        console.error('Failed to re-render mermaid diagram:', error);
        console.error(
          'Original code was:',
          element.dataset.mermaidCode || element.textContent
        );
      }
    }
  }

  // detectSystemTheme関数を削除

  getAvailableThemes() {
    return Array.from(this.themes.entries()).map(([key, theme]) => ({
      key,
      name: theme.name,
      preview: this.generateThemePreview(theme),
    }));
  }

  generateThemePreview(theme) {
    return {
      backgroundColor: theme.variables['--bg-color'],
      textColor: theme.variables['--text-color'],
      headingColor: theme.variables['--heading-color'],
      linkColor: theme.variables['--link-color'],
    };
  }

  async setCustomCSS(css) {
    this.customCSS = css;
    this.applyCustomCSS(css);
    await this.saveSettings();
  }

  async saveSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({
          theme: this.currentTheme,
          customCSS: this.customCSS,
        });
      } else if (window.SafeStorage) {
        window.SafeStorage.setItem('markdown-viewer-theme', this.currentTheme);
        window.SafeStorage.setItem(
          'markdown-viewer-custom-css',
          this.customCSS
        );
      }
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  }

  addObserver(callback) {
    this.observers.add(callback);
  }

  removeObserver(callback) {
    this.observers.delete(callback);
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Observer callback error:', error);
      }
    });
  }

  destroy() {
    if (this.systemThemeQuery) {
      this.systemThemeQuery.removeEventListener(
        'change',
        this.handleSystemThemeChange
      );
    }

    this.observers.clear();
  }
}

// Ensure class is available globally
window.ThemeManager = ThemeManager;
