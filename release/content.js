/**
 * @fileoverview Enhanced Markdown Viewer with Mermaid Chrome Extension - Content Script
 *
 * このファイルは、Chrome拡張機能「Markdown Viewer with Mermaid」のメインコンテンツスクリプトです。
 * Markdownファイルを読み込み、拡張機能の各種機能を提供します。
 *
 * 主な機能:
 * - Markdownファイルの検出と解析
 * - Mermaid図表の描画
 * - 目次（TOC）の自動生成
 * - テーマ切り替え機能
 * - 検索機能
 * - 印刷最適化
 * - ファイルアクセス権限チェック
 * - エクスポート機能（HTML）
 *
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires marked - Markdownパーサーライブラリ
 * @requires mermaid - 図表描画ライブラリ
 * @requires html2canvas - HTML to Canvas変換ライブラリ
 *
 * @example
 * // このスクリプトは自動的に実行され、Markdownファイルを検出すると
 * // enhanced markdown viewerを初期化します
 *
 * @see {@link https://github.com/76Hata/markdown-viewer-with-mermaid} プロジェクトリポジトリ
 */
(function () {
  'use strict';

  // Markdown Viewer enhanced content script loaded

  // Check for sandboxed environment and GitHub Raw URLs
  try {
    /** @type {boolean} サンドボックス環境の検出フラグ */
    const _isSandboxed =
      window.parent !== window.self &&
      window.location !== window.parent.location;
    /** @type {boolean} GitHub Raw URLの検出フラグ */
    const _isGitHubRaw = location.hostname.includes(
      'raw.githubusercontent.com'
    );
  } catch (error) {
    // Sandbox detection failed - continue normal execution
    console.warn('Sandbox detection failed:', error);
  }

  // Wait for marked library to load if needed
  if (typeof marked === 'undefined') {
    setTimeout(() => {
      initializeMarkdownViewer();
    }, window.TIMEOUTS ? window.TIMEOUTS.SHORT_DELAY : window.SIZES?.MEDIUM || 100);
    return;
  }

  /**
   * ファイルアクセス権限チェッカー
   * Chrome拡張機能のファイルアクセス権限を確認するためのユーティリティオブジェクト
   *
   * @namespace FileAccessChecker
   * @description Chrome拡張機能の「ファイルのURLへのアクセスを許可する」設定を
   *              確認し、ローカルファイルへのアクセス可能性を判定します。
   *
   * @author 76Hata
   * @since 1.0.0
   */
  const FileAccessChecker = {
    /**
     * ファイルアクセス権限をチェックする
     * Chrome拡張機能のファイルアクセス設定を確認し、コンソールに結果を出力します。
     *
     * @method checkFileAccess
     * @memberof FileAccessChecker
     * @description この関数は開発者がファイルアクセス権限の状態を確認するために使用します。
     *              主にデバッグ用途で使用します。
     *
     * @returns {void} 戻り値はありません。結果はコンソールに出力されます。
     *
     * @example
     * // ファイルアクセス権限をチェックする
     * FileAccessChecker.checkFileAccess();
     *
     * @see {@link FileAccessChecker.needsFileAccess} ファイルアクセス必要性の判定
     */
    checkFileAccess: function () {
      console.log('=== FileAccessChecker.checkFileAccess() ===');
      try {
        console.log('chrome object exists:', typeof chrome !== 'undefined');
        console.log(
          'chrome.extension exists:',
          typeof chrome !== 'undefined' && !!chrome.extension
        );
        console.log(
          'chrome.extension.isAllowedFileSchemeAccess exists:',
          typeof chrome !== 'undefined' &&
            !!chrome.extension &&
            !!chrome.extension.isAllowedFileSchemeAccess
        );

        if (
          typeof chrome !== 'undefined' &&
          chrome.extension &&
          chrome.extension.isAllowedFileSchemeAccess
        ) {
          const hasAccess = chrome.extension.isAllowedFileSchemeAccess();
          console.log(
            'chrome.extension.isAllowedFileSchemeAccess() result:',
            hasAccess
          );
          return hasAccess;
        }

        // For Manifest V3, try alternative detection method
        // If we can access the current file:// URL without restrictions, we likely have access
        if (location.protocol === 'file:') {
          console.log(
            'Trying alternative file access detection for Manifest V3...'
          );
          try {
            // If we're running on a file:// protocol and the extension is working,
            // we likely have file access permission
            const hasManifestAccess =
              typeof chrome !== 'undefined' &&
              chrome.runtime &&
              chrome.runtime.getManifest;
            if (hasManifestAccess) {
              console.log(
                'Extension APIs available on file:// - assuming file access is ON'
              );
              return true;
            }
          } catch (e) {
            console.log('Alternative detection failed:', e.message);
          }
        }

        // For non-file protocols or when we can't determine, return true to avoid showing unnecessary dialog
        if (location.protocol !== 'file:') {
          console.log(
            'Non-file protocol - returning true (no file access needed)'
          );
          return true;
        }

        // For file protocol when we can't determine, be conservative and return false
        console.log(
          'Cannot determine file access status - returning false to be safe'
        );
        return false;
      } catch (e) {
        console.warn('Could not check file access permission:', e.message);
        return false;
      }
    },

    isFileProtocol: function () {
      const isFile = location.protocol === 'file:';
      console.log('=== FileAccessChecker.isFileProtocol() ===', isFile);
      return isFile;
    },

    needsFileAccess: function () {
      const isFile = this.isFileProtocol();
      const hasAccess = this.checkFileAccess();
      const needs = isFile && !hasAccess;
      console.log('=== FileAccessChecker.needsFileAccess() ===');
      console.log('  isFileProtocol:', isFile);
      console.log('  checkFileAccess:', hasAccess);
      console.log('  needsFileAccess:', needs);

      // Extra logging for debugging
      if (isFile && typeof chrome === 'undefined') {
        console.log('⚠️ file:// protocol detected but Chrome APIs unavailable');
        console.log('💡 This suggests a sandboxed or restricted environment');
      }

      return needs;
    },
  };
  
  // FileAccessCheckerをwindowに割り当て（TypeScript型チェックのため）
  (window /** @type {any} */ ).FileAccessChecker = FileAccessChecker;

  /**
   * セーフストレージユーティリティ
   * サンドボックス環境でも動作する安全なストレージアクセスを提供します
   *
   * @namespace SafeStorage
   * @description Chrome拡張機能の環境とサンドボックス環境の両方で動作する
   *              汎用的なストレージアクセス機能を提供します。
   *              Chrome Storage APIが利用可能な場合はそれを使用し、
   *              利用できない場合はlocalStorageにフォールバックします。
   *
   * @author 76Hata
   * @since 1.0.0
   *
   * @example
   * // データを保存する
   * SafeStorage.setItem('my-key', 'my-value');
   *
   * // データを取得する
   * SafeStorage.getItem('my-key', function(value) {
   *     console.log('取得した値:', value);
   * });
   */
  const SafeStorage = {
    /**
     * データを安全にストレージに保存する
     *
     * @method setItem
     * @memberof SafeStorage
     * @description Chrome Storage APIが利用可能な場合はchrome.storage.localを使用し、
     *              利用できない場合はlocalStorageにフォールバックしてデータを保存します。
     *
     * @param {string} key - 保存するデータのキー
     * @param {*} value - 保存するデータの値（文字列、数値、オブジェクトなど）
     *
     * @returns {void} 戻り値はありません
     *
     * @example
     * // 文字列を保存
     * SafeStorage.setItem('user-theme', 'dark');
     *
     * // オブジェクトを保存
     * SafeStorage.setItem('user-settings', {theme: 'dark', fontSize: 16});
     *
     * @throws {Error} ストレージアクセスに失敗した場合（コンソールに警告が出力されます）
     */
    setItem: function (key, value) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ [key]: value });
        } else {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('Storage not available:', e.message);
      }
    },

    /**
     * データを安全にストレージから取得する
     *
     * @method getItem
     * @memberof SafeStorage
     * @description Chrome Storage APIが利用可能な場合はchrome.storage.localから取得し、
     *              利用できない場合はlocalStorageから取得してコールバック関数で結果を返します。
     *
     * @param {string} key - 取得するデータのキー
     * @param {function} callback - データ取得完了時に呼び出されるコールバック関数
     * @param {*} callback.value - 取得されたデータの値（存在しない場合はnull）
     *
     * @returns {void} 戻り値はありません。結果はコールバック関数で返されます。
     *
     * @example
     * // 保存されたテーマを取得
     * SafeStorage.getItem('user-theme', function(theme) {
     *     if (theme) {
     *         console.log('現在のテーマ:', theme);
     *         applyTheme(theme);
     *     } else {
     *         console.log('テーマが設定されていません');
     *     }
     * });
     *
     * // オブジェクトデータを取得
     * SafeStorage.getItem('user-settings', function(settings) {
     *     if (settings) {
     *         console.log('ユーザー設定:', settings);
     *     }
     * });
     *
     * @throws {Error} ストレージアクセスに失敗した場合（コンソールに警告が出力されます）
     */
    getItem: function (key, callback) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get([key], result => {
            callback(result[key] || null);
          });
        } else {
          callback(localStorage.getItem(key));
        }
      } catch (e) {
        console.warn('Storage not available:', e.message);
        callback(null);
      }
    },
  };
  
  // SafeStorageをwindowに割り当て（TypeScript型チェックのため）
  (window /** @type {any} */ ).SafeStorage = SafeStorage;

  /**
   * Markdownファイルかどうかを判定する関数
   *
   * @function isMarkdownFile
   * @description 現在のページがMarkdownファイルかどうかを判定します。
   *              プロトコル（file:, http:, https:）とファイル拡張子をチェックし、
   *              両方の条件を満たす場合にtrueを返します。
   * @returns {boolean} Markdownファイルの場合true、そうでなければfalse
   * @since 1.0.0
   *
   * @example
   * // 現在のページがMarkdownファイルかチェック
   * if (isMarkdownFile()) {
   *     console.log('Markdownファイルです');
   * }
   */
  function isMarkdownFile() {
    /** @type {string} 現在のパス名（小文字変換済み） */
    const pathname = location.pathname.toLowerCase();
    /** @type {string} 現在のプロトコル */
    const protocol = location.protocol;
    /** @type {boolean} 有効なプロトコルかどうか */
    const isValidProtocol =
      protocol === 'file:' || protocol === 'http:' || protocol === 'https:';
    /** @type {boolean} Markdown拡張子かどうか */
    const isMd =
      pathname.endsWith('.md') ||
      pathname.endsWith('.mkd') ||
      pathname.endsWith('.mdx') ||
      pathname.endsWith('.markdown');
    console.log('=== isMarkdownFile() check ===');
    console.log('Pathname:', pathname);
    console.log('Protocol:', protocol);
    console.log('Is valid protocol:', isValidProtocol);
    console.log('Is markdown extension:', isMd);
    /** @type {boolean} 最終判定結果 */
    const result = isValidProtocol && isMd;
    console.log('Final result:', result);
    return result;
  }

  /**
   * GitHub Raw URLかどうかを判定する関数
   *
   * @function isGitHubRawURL
   * @description 現在のURLがGitHubのrawファイルURLかどうかを判定します。
   *              raw.githubusercontent.comドメインまたはgithub.com/rawパスをチェックします。
   * @returns {boolean} GitHub Raw URLの場合true、そうでなければfalse
   * @since 1.0.0
   *
   * @example
   * // GitHub Raw URLかチェック
   * if (isGitHubRawURL()) {
   *     console.log('GitHub Raw URLです');
   * }
   */
  function isGitHubRawURL() {
    return (
      location.hostname.includes('raw.githubusercontent.com') ||
      (location.hostname.includes('github.com') &&
        location.pathname.includes('/raw/'))
    );
  }

  /**
   * サンドボックス環境の制限をチェックする関数
   *
   * @function checkSandboxRestrictions
   * @description サンドボックス環境でスクリプト実行が制限されているかをチェックします。
   *              Chrome APIの利用可能性を確認し、制限がある場合に適切に対応します。
   * @returns {boolean} サンドボックス制限がある場合true、ない場合false
   * @since 1.0.0
   *
   * @example
   * // サンドボックス制限をチェック
   * if (checkSandboxRestrictions()) {
   *     console.log('サンドボックス制限があります');
   * }
   */
  function checkSandboxRestrictions() {
    try {
      // Check if we can access chrome APIs
      if (typeof chrome === 'undefined') {
        console.log('⚠️ Chrome APIs not available - may be sandboxed');
        return true;
      }

      // Check if this is a GitHub Raw URL (typically sandboxed)
      if (location.hostname.includes('raw.githubusercontent.com')) {
        console.log('⚠️ GitHub Raw URL detected - sandboxed environment');
        return true;
      }

      // Try to detect sandbox restrictions
      // Removed eval test for Google Store compliance
      // Use alternative methods to detect sandbox environment

      return false;
    } catch (e) {
      console.log('⚠️ Error checking sandbox restrictions:', e.message);
      return true; // Assume sandboxed if we can't check
    }
  }

  // Function to initialize the markdown viewer
  function initializeMarkdownViewer() {
    const isMarkdown = isMarkdownFile();
    console.log('=== Markdown file check result:', isMarkdown, '===');

    if (!isMarkdown) {
      console.log('❌ Not a markdown file, exiting content script');
      return false;
    }

    // Check for sandbox restrictions
    const isSandboxed = checkSandboxRestrictions();
    if (isSandboxed) {
      console.log('⚠️ Sandboxed environment detected');
      console.log(
        '📝 Note: Use local file:// URLs to test file access notifications'
      );
      console.log('🔄 Content script functionality may be limited');
      // Continue anyway, but with limited functionality
    }

    console.log('✅ Markdown file detected, starting enhanced viewer...');
    return true;
  }

  // Ensure document is ready before checking
  function startWhenReady() {
    if (document.readyState === 'loading') {
      console.log('⏳ Document still loading, waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded fired, starting initialization...');
        startWhenReady();
      });
      return;
    }

    if (!initializeMarkdownViewer()) {
      return;
    }

    // Continue with initialization...
    console.log('🚀 Starting markdown viewer initialization...');
    proceedWithInitialization();
  }

  function proceedWithInitialization() {
    initViewer();
  }

  // 元のコンテンツを取得
  function getOriginalContent() {
    let content = '';

    // file:// プロトコルの場合は通常通り
    if (location.protocol === 'file:') {
      content = document.body.textContent || document.body.innerText || '';
    }
    // http/https の場合は、Markdownの生ファイルかチェック
    else if (location.protocol === 'http:' || location.protocol === 'https:') {
      // Content-Typeをチェック（可能な場合）
      const contentType = document.contentType || '';
      console.log('Content-Type:', contentType);

      // プレーンテキストまたはMarkdownとして扱われている場合
      if (
        contentType.includes('text/plain') ||
        contentType.includes('text/markdown') ||
        (document.body.children.length === 1 &&
          document.body.children[0].tagName === 'PRE')
      ) {
        content = document.body.textContent || document.body.innerText || '';
      }
      // raw.githubusercontent.com のような生ファイルの場合
      else if (
        location.hostname.includes('raw.githubusercontent.com') ||
        location.pathname.includes('/raw/')
      ) {
        content = document.body.textContent || document.body.innerText || '';
      } else {
        // HTMLとしてレンダリングされている場合、既存のHTMLを保持
        console.log('Content appears to be HTML, not raw markdown');
        return '';
      }
    }

    console.log('Original content length:', content.length);
    return content;
  }

  // fetchを使ってMarkdownコンテンツを取得する代替方法
  async function fetchMarkdownContent(url) {
    try {
      console.log('Fetching markdown content from:', url);
      console.log('Current origin:', location.origin);
      console.log('Target URL:', url);

      // fetchを詳細ログ付きで実行
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // CORS明示
        cache: 'no-cache',
        headers: {
          Accept: 'text/plain, text/markdown, */*',
        },
      });

      console.log('Fetch response status:', response.status);
      console.log('Fetch response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      console.log('Fetched content length:', content.length);
      console.log('First 100 chars:', content.substring(0, window.SIZES?.MEDIUM || 100));
      return content;
    } catch (error) {
      console.error('Failed to fetch markdown content:', error);
      console.error('Error details:', error.name, error.message);
      throw error;
    }
  }

  // Chrome拡張機能のAPIを使ったfetch
  async function fetchWithExtension(url) {
    return new Promise((resolve, reject) => {
      console.log('Attempting extension-based fetch for:', url);

      // XMLHttpRequestを使用（拡張機能の権限で実行）
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'text/plain, text/markdown, */*');

      xhr.onload = function () {
        if (xhr.status >= (window.SIZES?.LARGE || 200) && xhr.status < (window.TIMEOUTS?.STANDARD_DELAY || 300)) {
          console.log('XHR succeeded with status:', xhr.status);
          console.log('Response length:', xhr.responseText.length);
          resolve(xhr.responseText);
        } else {
          reject(new Error(`XHR failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = function () {
        reject(new Error('XHR network error'));
      };

      xhr.ontimeout = function () {
        reject(new Error('XHR timeout'));
      };

      xhr.timeout = window.TIMEOUTS?.MAX_TIMEOUT || 10000; // 10秒タイムアウト
      xhr.send();
    });
  }

  // 外部スクリプトとCSSを動的に読み込む
  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log(`Script loaded: ${src}`);
        resolve();
      };
      script.onerror = error => {
        console.error(`Script load failed: ${src}`, error);
        reject(error);
      };
      // Chrome拡張機能では document.head ではなく document.documentElement に追加
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function _loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  // 拡張機能のベースURLを取得
  function _getExtensionBaseURL() {
    return chrome.runtime ? chrome.runtime.getURL('') : '';
  }

  // Markdownレンダリング
  function renderMarkdown(content) {
    console.log('Starting markdown rendering...');

    // ライブラリチェック
    if (typeof marked === 'undefined') {
      throw new Error('marked library is not loaded');
    }

    // Mermaidの初期化
    if (typeof mermaid !== 'undefined') {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          logLevel: 'error',
          // シーケンス図の設定
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: true,
            bottomMarginAdj: 1,
            useMaxWidth: true,
            rightAngles: false,
            showSequenceNumbers: false,
            wrap: true,
          },
          // ガントチャートの設定
          gantt: {
            titleTopMargin: 25,
            barHeight: 20,
            fontsize: 11,
            sidePadding: 75,
            leftPadding: 75,
            gridLineStartPadding: 35,
            fontSize: 11,
            fontFamily: 'inherit',
            numberSectionStyles: 4,
            axisFormat: '%Y-%m-%d',
            useMaxWidth: true,
          },
          // フローチャートの設定
          flowchart: {
            diagramPadding: 8,
            htmlLabels: true,
            curve: 'basis',
            useMaxWidth: true,
          },
          // パイチャートの設定
          pie: {
            useMaxWidth: true,
          },
          // クラス図の設定
          class: {
            useMaxWidth: true,
          },
          // ER図の設定
          er: {
            useMaxWidth: true,
          },
        });
        console.log('Mermaid initialized successfully');
      } catch (initError) {
        console.error('Mermaid initialization error:', initError);
      }
    }

    // カスタムレンダラー
    const renderer = new marked.Renderer();
    let mermaidCounter = 0;

    renderer.code = function (code, language) {
      if (language === 'mermaid') {
        const id = `mermaid-${mermaidCounter++}`;
        return `<div class="mermaid" id="${id}" data-mermaid-code="${encodeURIComponent(code)}">${code}</div>`;
      }
      // HTMLエスケープ関数
      const escapeHtml = text => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      return `<pre><code class="language-${language || ''}">${escapeHtml(code)}</code></pre>`;
    };

    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: false,
      mangle: false,
      headerIds: false,
    });

    // HTMLに変換
    const html = marked.parse(content);
    console.log('Markdown parsed, HTML length:', html.length);

    return html;
  }

  /**
   * ライブラリ管理システム（Chrome拡張機能最適化版）
   * Mermaidはmanifest.jsonで読み込み、動的読み込みエラーを解決
   */
  const LibraryLoader = {
    mermaidInitialized: false,
    exportLibrariesLoaded: false,

    /**
     * Mermaidライブラリの初期化（manifest.jsonで読み込み済み）
     * @returns {Promise<boolean>} 初期化成功時true
     */
    async initializeMermaid() {
      // Mermaidは既にmanifest.jsonで読み込まれているはず
      if (typeof mermaid === 'undefined') {
        console.error('❌ Mermaid library not loaded in manifest.json');
        this.showFileAccessGuide();
        return false;
      }

      if (this.mermaidInitialized) {
        console.log('✅ Mermaid already initialized');
        return true;
      }

      try {
        console.log('🔄 Initializing Mermaid library...');
        console.log('📊 Mermaid version:', mermaid.version || 'Unknown');

        // Mermaidの初期設定
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          htmlLabels: false,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: false,
          },
          sequence: {
            useMaxWidth: true,
            diagramMarginX: 10,
            diagramMarginY: 10,
          },
        });

        this.mermaidInitialized = true;
        console.log('✅ Mermaid initialized successfully');
        return true;
      } catch (error) {
        console.error('❌ Mermaid initialization error:', error);
        return false;
      }
    },

    /**
     * ファイルアクセス権限ガイドを表示
     */
    showFileAccessGuide() {
      if (location.protocol === 'file:') {
        console.group('🔧 Chrome拡張機能設定ガイド');
        console.log('❌ Mermaidライブラリが読み込まれていません');
        console.log('💡 解決方法:');
        console.log('1. chrome://extensions を開く');
        console.log('2. "Markdown Viewer with Mermaid" を見つける');
        console.log('3. "詳細" をクリック');
        console.log('4. "ファイルのURLへのアクセスを許可する" を有効にする');
        console.log('5. ページを再読み込みする');
        console.groupEnd();
      }
    },

    /**
     * エクスポート関連ライブラリ（html2canvas）を動的に読み込む
     * @returns {Promise<boolean>} 読み込み成功時true
     */
    async loadExportLibraries() {
      if (this.exportLibrariesLoaded) {
        return true;
      }

      try {
        console.log('🔄 Loading HTML export library...');
        const loadScript = src => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(src);
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };

        await loadScript('lib/html2canvas.min.js');

        console.log('✅ HTML export library loaded successfully');
        this.exportLibrariesLoaded = true;
        return true;
      } catch (error) {
        console.error('❌ HTML export library loading error:', error);
        return false;
      }
    },
  };

  // LibraryLoaderをグローバルに公開（他のモジュールから利用可能）
  window.LibraryLoader = LibraryLoader;

  // Mermaid図の描画
  async function renderMermaidDiagrams() {
    // Mermaidが必要かチェック
    const mermaidElements = document.querySelectorAll('.mermaid');
    if (mermaidElements.length === 0) {
      console.log('No Mermaid diagrams found, skipping library load');
      return;
    }

    console.log(
      `🎯 Found ${mermaidElements.length} Mermaid diagram(s) to render`
    );

    // Mermaidライブラリを初期化
    try {
      const initialized = await LibraryLoader.initializeMermaid();
      if (!initialized || typeof mermaid === 'undefined') {
        const errorMessage =
          'Mermaid library not available - initialization failed';
        console.error('❌', errorMessage);

        // Mermaid図を全て代替表示に置き換え
        mermaidElements.forEach((element, _index) => {
          element.innerHTML = `
                        <div style="
                            border: 2px dashed #ff6b6b;
                            padding: 20px;
                            margin: 10px 0;
                            background-color: #fff5f5;
                            border-radius: 8px;
                            font-family: 'Courier New', monospace;
                        ">
                            <h4 style="color: #d63031; margin-top: 0;">🚫 Mermaid Library Error</h4>
                            <p style="color: #2d3436; margin: 10px 0;">
                                Failed to load Mermaid library for diagram rendering.
                            </p>
                            <details style="margin: 10px 0;">
                                <summary style="cursor: pointer; color: #0984e3;">Show Raw Code</summary>
                                <pre style="
                                    background: #f8f9fa;
                                    padding: 10px;
                                    margin: 5px 0;
                                    border-radius: 4px;
                                    overflow-x: auto;
                                    color: #2d3436;
                                ">${element.dataset.mermaidCode ? decodeURIComponent(element.dataset.mermaidCode) : element.textContent}</pre>
                            </details>
                            <p style="font-size: 12px; color: #636e72; margin-bottom: 0;">
                                Try: Enable "Allow access to file URLs" in extension settings
                            </p>
                        </div>
                    `;
        });
        return;
      }
    } catch (error) {
      console.error('❌ Mermaid loading failed with error:', error);

      // エラー時の代替表示
      mermaidElements.forEach((element, _index) => {
        element.innerHTML = `
                    <div style="
                        border: 2px solid #e17055;
                        padding: 15px;
                        margin: 10px 0;
                        background-color: #fdf2f2;
                        border-radius: 6px;
                    ">
                        <h4 style="color: #e17055; margin-top: 0;">⚠️ Mermaid Loading Error</h4>
                        <p style="color: #2d3436;">Error: ${error.message || 'Unknown error'}</p>
                        <details>
                            <summary style="cursor: pointer;">Raw Diagram Code</summary>
                            <pre style="background: #f1f2f6; padding: 8px; border-radius: 4px; overflow-x: auto;">${element.dataset.mermaidCode ? decodeURIComponent(element.dataset.mermaidCode) : element.textContent}</pre>
                        </details>
                    </div>
                `;
      });
      return;
    }

    // Mermaidを再初期化（新しいバージョンでは必要な場合がある）
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        logLevel: 'error',
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 10,
          actorMargin: 50,
          useMaxWidth: true,
          mirrorActors: true,
          showSequenceNumbers: false,
          wrap: true,
        },
        gantt: {
          useMaxWidth: true,
          fontSize: 11,
          fontFamily: 'inherit',
          sidePadding: 50,
        },
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
        },
        er: {
          useMaxWidth: true,
          fontSize: 12,
        },
        pie: {
          useMaxWidth: true,
        },
      });
    } catch (initError) {
      console.warn('Mermaid re-initialization warning:', initError);
    }

    console.log(`Found ${mermaidElements.length} mermaid elements`);
    console.log('Mermaid version:', mermaid.version || 'Version unknown');

    for (let i = 0; i < mermaidElements.length; i++) {
      const element = mermaidElements[i];
      try {
        // data-mermaid-code属性から取得、なければtextContentを使用
        let graphDefinition;
        if (element.dataset.mermaidCode) {
          try {
            graphDefinition = decodeURIComponent(element.dataset.mermaidCode);
          } catch (decodeError) {
            console.warn(
              `Failed to decode mermaid code for element ${i}, using textContent:`,
              decodeError
            );
            graphDefinition = element.textContent.trim();
          }
        } else {
          graphDefinition = element.textContent.trim();
          // 後で再描画に使えるよう保存
          element.dataset.mermaidCode = encodeURIComponent(graphDefinition);
        }

        console.log(
          `Rendering mermaid ${i}:`,
          graphDefinition.substring(0, window.SIZES?.SMALL || 50)
        );

        // 図表タイプを検出
        const diagramType = graphDefinition.split('\n')[0].trim();
        console.log(`Diagram type detected: ${diagramType}`);

        const { svg } = await mermaid.render(
          `graph-${Date.now()}-${i}`,
          graphDefinition
        );
        element.innerHTML = svg;

        console.log(`Mermaid ${i} (${diagramType}) rendered successfully`);
      } catch (error) {
        console.error(`Mermaid ${i} rendering error:`, error);
        console.error(
          'Graph definition:',
          element.dataset.mermaidCode || element.textContent
        );
        element.innerHTML = `<pre style="color: red; background: #ffe6e6; padding: 10px; border-radius: 5px;">
Mermaidエラー: ${error.message}

図表タイプ: ${(element.textContent || '').trim().split('\n')[0]}

元のコード:
${element.dataset.mermaidCode ? decodeURIComponent(element.dataset.mermaidCode) : element.textContent}
</pre>`;
      }
    }
  }

  // Enhanced features initialization
  function initializeEnhancedFeatures(originalContent) {
    try {
      console.log('Initializing enhanced features...');

      // Store original content for reference
      document.body.dataset.originalMarkdown = originalContent;

      // Check if classes are available (should be loaded via manifest)
      console.log('Class availability check:');
      console.log('Toolbar:', typeof window.Toolbar);
      console.log('SearchEngine:', typeof window.SearchEngine);
      console.log('ThemeManager:', typeof window.ThemeManager);
      console.log('TOCGenerator:', typeof window.TOCGenerator);

      // Retry mechanism for sandboxed environments
      let toolbarInitAttempts = 0;
      const maxToolbarAttempts = 3;

      const initToolbar = () => {
        if (typeof window.Toolbar !== 'undefined') {
          try {
            // Check if we're in a sandboxed environment
            if (location.hostname.includes('raw.githubusercontent.com')) {
              console.log(
                '⚠️ Running in sandboxed environment - some features may be limited'
              );
            }

            console.log('Creating Toolbar instance...');
            window.markdownViewerToolbar = new window.Toolbar();

            // CSSの確認
            const cssLinks = document.querySelectorAll(
              'link[rel="stylesheet"]'
            );
            console.log('CSS links found:', cssLinks.length);

            // ツールバー要素の確認と強制修正
            const toolbarElement = document.querySelector('.main-toolbar');
            console.log('Toolbar element found:', !!toolbarElement);
            if (toolbarElement) {
              console.log(
                'Toolbar visible:',
                getComputedStyle(toolbarElement).display !== 'none'
              );

              // 強制的に見える位置に配置
              toolbarElement.style.cssText = `
                                position: fixed !important;
                                top: 20px !important;
                                right: 20px !important;
                                background: #f8f9fa !important;
                                border: 1px solid #e1e4e8 !important;
                                border-radius: 8px !important;
                                display: flex !important;
                                align-items: center !important;
                                padding: 0 15px !important;
                                gap: 10px !important;
                                z-index: ${window.SIZES?.MAX_TOC_ITEMS || 1000} !important;
                                height: ${window.LAYOUT?.TOOLBAR_HEIGHT || 50}px !important;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                            `;

              // エクスポートボタンを強制追加
              const exportBtn =
                toolbarElement.querySelector('#export-html-btn');
              if (exportBtn) {
                exportBtn.style.cssText = `
                                    background: #fff !important;
                                    border: 1px solid #d1d9e0 !important;
                                    border-radius: 6px !important;
                                    padding: 8px 12px !important;
                                    cursor: pointer !important;
                                    font-size: 14px !important;
                                    display: flex !important;
                                    align-items: center !important;
                                `;
                console.log('Export button styled');

                // 直接イベントリスナーを追加（サンドボックス用）
                exportBtn.addEventListener('click', () => {
                  console.log('Export button clicked - direct handler');
                  createDirectHTMLExport();
                });
              }

              console.log('Toolbar forced visible and styled');
            }

            console.log('✅ Enhanced features initialized successfully');
          } catch (error) {
            console.error('❌ Error creating Toolbar:', error);
            // Fallback: show basic message instead of full toolbar
            showBasicFallback();
          }
        } else {
          toolbarInitAttempts++;
          if (toolbarInitAttempts < maxToolbarAttempts) {
            console.log(
              `Toolbar class not yet available, retry ${toolbarInitAttempts}/${maxToolbarAttempts}`
            );
            setTimeout(initToolbar, window.TIMEOUTS?.LONG_DELAY || 500);
          } else {
            console.error(
              '❌ Toolbar class not available after retries - check manifest.json'
            );
            showBasicFallback();
          }
        }
      };

      initToolbar();
    } catch (error) {
      console.error('Failed to initialize enhanced features:', error);
    }
  }

  // Basic fallback for sandboxed environments
  function showBasicFallback() {
    const fallbackNotice = document.createElement('div');
    fallbackNotice.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            color: #1976d2;
            z-index: ${window.SIZES?.MAX_TOC_ITEMS || 1000};
            max-width: ${window.PRINT?.PDF_MARGIN || 300}px;
        `;
    fallbackNotice.innerHTML = `
            <strong>Markdown Viewer Active</strong><br>
            <small>Enhanced features limited in this environment</small><br>
            <button id="basic-export" style="margin-top: 5px; padding: 3px 8px; background: #2196f3; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">📄 HTML Export</button>
        `;
    document.body.appendChild(fallbackNotice);

    // Add basic export functionality with error handling
    const exportBtn = fallbackNotice.querySelector('#basic-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        try {
          createBasicHTMLExport();
        } catch (error) {
          console.error('Export button error:', error);

          // Check if this is a file access related error
          if (
            FileAccessChecker.needsFileAccess() &&
            (error.message.includes('fetch') ||
              error.message.includes('network') ||
              error.message.includes('CORS'))
          ) {
            showExportError('ファイルアクセス権限が必要です');
          } else {
            showExportError(error.message);
          }
        }
      });
    }

    // Auto-hide after 10 seconds (longer for export button)
    setTimeout(() => {
      if (fallbackNotice.parentNode) {
        fallbackNotice.parentNode.removeChild(fallbackNotice);
      }
    }, window.TIMEOUTS?.MAX_TIMEOUT || 10000);
  }

  // Basic HTML export for sandboxed environments
  function createBasicHTMLExport() {
    try {
      const markdownContent = document.getElementById('markdown-content');
      if (!markdownContent) {
        throw new Error('コンテンツが見つかりません');
      }

      // Check if we can use Blob and download
      if (typeof Blob === 'undefined' || typeof URL === 'undefined') {
        // Fallback: show content in new window/tab
        showHTMLInNewWindow(markdownContent);
        return;
      }

      const title = document.title || 'Markdown Document';
      const currentURL = location.href;
      const timestamp = new Date().toLocaleString();

      const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: ${window.SIZES?.MAX_TOC_ITEMS || 1000}px;
            margin: 0 auto;
            padding: 20px;
            color: #24292e;
        }
        h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 2em; margin-bottom: 1em; }
        h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding-left: 16px; color: #6a737d; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; font-weight: 600; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .export-header { text-align: center; border-bottom: 2px solid #eee; margin-bottom: 2em; padding-bottom: 1em; }
        .copy-notice { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="copy-notice">
        <strong>📋 HTMLコードをコピーしてファイルに保存してください</strong><br>
        <small>Ctrl+A で全選択、Ctrl+C でコピー</small>
    </div>
    <div class="export-header">
        <h1>${title}</h1>
        <p>エクスポート日時: ${timestamp}</p>
        <p>元URL: ${currentURL}</p>
    </div>
    ${markdownContent.innerHTML}
</body>
</html>`;

      // Try download first
      try {
        const blob = new Blob([htmlContent], {
          type: 'text/html;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `markdown-export-${new Date().toISOString().slice(0, window.SIZES?.ANIMATION_OFFSET || 19).replace(/:/g, '-')}.html`;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), window.TIMEOUTS?.VERY_LONG_DELAY || 1000);
        showExportSuccess();
      } catch (downloadError) {
        console.warn('Download failed, showing in new window:', downloadError);
        showHTMLInNewWindow(markdownContent);
      }
    } catch (error) {
      console.error('Export failed:', error);
      showExportError(error.message);
    }
  }

  // Show HTML in new window as fallback
  function showHTMLInNewWindow(markdownContent) {
    const title = document.title || 'Markdown Document';
    const currentURL = location.href;
    const timestamp = new Date().toLocaleString();

    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: ${window.SIZES?.MAX_TOC_ITEMS || 1000}px; margin: 0 auto; padding: 20px; color: #24292e; }
        h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 2em; margin-bottom: 1em; }
        h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        .copy-notice { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border: 1px solid #ffeaa7; }
        .copy-notice button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px; }
    </style>
</head>
<body>
    <div class="copy-notice">
        <h3>📋 エクスポート完了</h3>
        <p>サンドボックス環境のため、直接ダウンロードできません。</p>
        <p><strong>このページのHTMLコードをコピーして、.htmlファイルとして保存してください。</strong></p>
        <button onclick="selectAll()">全選択</button>
        <button onclick="copyToClipboard()">クリップボードにコピー</button>
        <script>
            function selectAll() { document.getSelection().selectAllChildren(document.body); }
            function copyToClipboard() { 
                selectAll(); 
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    const textContent = document.body.textContent;
                    navigator.clipboard.writeText(textContent).then(() => {
                        showToastMessage('クリップボードにコピーしました！', 'success');
                    }).catch(() => {
                        showToastMessage('コピーに失敗しました', 'error');
                    });
                } else {
                    showToastMessage('このブラウザではクリップボード機能がサポートされていません', 'error');
                }
            }
        </script>
    </div>
    <hr>
    <div class="export-header" style="text-align: center; border-bottom: 2px solid #eee; margin-bottom: 2em; padding-bottom: 1em;">
        <h1>${title}</h1>
        <p>エクスポート日時: ${timestamp}</p>
        <p>元URL: ${currentURL}</p>
    </div>
    ${markdownContent.innerHTML}
</body>
</html>`;

    try {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        newWindow.location.href = url;
        showExportSuccess('新しいタブでHTMLを表示しました');
      } else {
        // Popup blocked, show HTML in textarea
        showHTMLInTextarea(htmlContent);
      }
    } catch (error) {
      console.warn('Failed to open new window:', error);
      showHTMLInTextarea(htmlContent);
    }
  }

  // Show HTML in textarea as last resort
  function showHTMLInTextarea(htmlContent) {
    const modal = document.createElement('div');
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: ${window.TIMEOUTS?.MAX_TIMEOUT || 10000};
            display: flex;
            align-items: center;
            justify-content: center;
        `;

    modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;">
                <h3>📄 HTMLエクスポート</h3>
                <p>以下のHTMLコードをコピーして、.htmlファイルとして保存してください：</p>
                <textarea readonly style="width: 100%; height: ${window.PRINT?.PDF_MARGIN || 300}px; font-family: monospace; font-size: 12px; border: 1px solid #ccc; padding: 10px;">${htmlContent}</textarea>
                <div style="margin-top: 10px; text-align: center;">
                    <button onclick="
                        const textarea = this.previousElementSibling.previousElementSibling;
                        (textarea /** @type {HTMLTextAreaElement} */ ).select();
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText((textarea /** @type {HTMLTextAreaElement} */ ).value).then(() => {
                                showToastMessage('コピーしました！', 'success');
                            }).catch(() => {
                                showToastMessage('コピーに失敗しました', 'error');
                            });
                        } else {
                            showToastMessage('このブラウザではクリップボード機能がサポートされていません', 'error');
                        }" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px;">コピー</button>
                    <button onclick="this.closest('div').remove();" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px;">閉じる</button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Auto-select the textarea
    const textarea = modal.querySelector('textarea');
    textarea.focus();
    textarea.select();
  }

  // サンドボックス環境の制限を徹底調査する関数
  function investigateSandboxLimitations() {
    console.log('🔍 SANDBOX INVESTIGATION START');
    console.log('='.repeat(window.SIZES?.SMALL || 50));

    // 基本情報
    console.log('📍 Environment Info:');
    console.log('  URL:', location.href);
    console.log('  Origin:', location.origin);
    console.log('  Protocol:', location.protocol);
    console.log('  Hostname:', location.hostname);
    console.log('  Pathname:', location.pathname);

    // サンドボックス属性の確認
    console.log('🔒 Sandbox Attributes:');
    const iframe = document.querySelector('iframe');
    if (iframe) {
      console.log('  Iframe sandbox:', iframe.sandbox);
    }
    const htmlElement = document.documentElement;
    console.log('  HTML sandbox attr:', htmlElement.getAttribute('sandbox'));
    console.log('  Document domain:', document.domain);

    // CSP (Content Security Policy) の確認
    console.log('🛡️ Content Security Policy:');
    const metaCSP = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    );
    if (metaCSP) {
      console.log('  Meta CSP:', metaCSP.content);
    }

    // API可用性テスト
    console.log('🧪 API Availability Tests:');
    console.log('  Blob:', typeof Blob !== 'undefined');
    console.log(
      '  URL.createObjectURL:',
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    );
    console.log('  window.open:', typeof window.open === 'function');
    console.log(
      '  document.createElement:',
      typeof document.createElement === 'function'
    );
    console.log(
      '  addEventListener:',
      typeof Element.prototype.addEventListener === 'function'
    );

    // ダウンロード機能テスト
    console.log('💾 Download Function Tests:');
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      console.log('  Blob creation: SUCCESS');

      const testURL = URL.createObjectURL(testBlob);
      console.log('  Object URL creation: SUCCESS');
      console.log('  Test URL:', testURL);

      const testLink = document.createElement('a');
      testLink.href = testURL;
      testLink.download = 'test.txt';
      console.log('  Download link creation: SUCCESS');
      console.log('  Link href:', testLink.href);
      console.log('  Link download:', testLink.download);

      URL.revokeObjectURL(testURL);
      console.log('  URL revocation: SUCCESS');
    } catch (error) {
      console.error('  Download test FAILED:', error);
    }

    // DOM操作テスト
    console.log('🌐 DOM Manipulation Tests:');
    try {
      const testDiv = document.createElement('div');
      testDiv.textContent = 'Test Element';
      testDiv.style.display = 'none';
      document.body.appendChild(testDiv);
      console.log('  DOM append: SUCCESS');
      document.body.removeChild(testDiv);
      console.log('  DOM remove: SUCCESS');
    } catch (error) {
      console.error('  DOM manipulation FAILED:', error);
    }

    // イベントテスト
    console.log('🎯 Event Tests:');
    try {
      const testBtn = document.createElement('button');
      testBtn.addEventListener('click', () => {
        console.log('  Event listener: SUCCESS');
      });
      console.log('  Event listener attachment: SUCCESS');
    } catch (error) {
      console.error('  Event test FAILED:', error);
    }

    console.log('='.repeat(window.SIZES?.SMALL || 50));
    console.log('🔍 SANDBOX INVESTIGATION END');

    return {
      canCreateBlob: typeof Blob !== 'undefined',
      canCreateObjectURL:
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
      canOpenWindow: typeof window.open === 'function',
      isSandboxed: location.hostname.includes('raw.githubusercontent.com'),
    };
  }

  // 直接HTMLエクスポート（徹底的なログ付き）
  function createDirectHTMLExport() {
    try {
      console.log('🚀 STARTING HTML EXPORT');
      console.log('='.repeat(SIZES.SCROLL_OFFSET));

      // サンドボックス調査を実行
      const _capabilities = investigateSandboxLimitations();

      const markdownContent = document.getElementById('markdown-content');
      if (!markdownContent) {
        throw new Error('コンテンツが見つかりません');
      }

      const title = document.title || 'Markdown Document';
      const currentURL = location.href;
      const timestamp = new Date().toLocaleString();

      const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: ${window.SIZES?.MAX_TOC_ITEMS || 1000}px; margin: 0 auto; padding: 20px; color: #24292e; }
        h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 2em; margin-bottom: 1em; }
        h1 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding-left: 16px; color: #6a737d; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; font-weight: 600; }
        a { color: #0366d6; text-decoration: none; }
        .export-header { text-align: center; border-bottom: 2px solid #eee; margin-bottom: 2em; padding-bottom: 1em; }
    </style>
</head>
<body>
    <div class="export-header">
        <h1>${title}</h1>
        <p>エクスポート日時: ${timestamp}</p>
        <p>元URL: <a href="${currentURL}">${currentURL}</a></p>
    </div>
    ${markdownContent.innerHTML}
</body>
</html>`;

      console.log('📄 HTML content generated, length:', htmlContent.length);

      // 複数の方法を順次試行
      const methods = [
        {
          name: 'Blob Download',
          func: () => window.tryBlobDownload(htmlContent),
        },
        {
          name: 'Data URL Download',
          func: () => window.tryDataURLDownload(htmlContent),
        },
        { name: 'New Window', func: () => window.tryNewWindow(htmlContent) },
        {
          name: 'Copy to Clipboard',
          func: () => window.tryClipboard(htmlContent),
        },
        { name: 'Show in Modal', func: () => window.tryModal(htmlContent) },
      ];

      console.log('🎯 Trying', methods.length, 'export methods...');

      window.tryExportMethods(htmlContent, methods, 0);
    } catch (error) {
      console.error('❌ EXPORT COMPLETELY FAILED:', error);

      // Check if this is a file access related error
      if (FileAccessChecker.needsFileAccess()) {
        showExportError('エクスポート機能を使用するにはファイルアクセス権限が必要です');
      } else {
        showExportError(error.message);
      }
    }
  }

  // 複数の方法を順次試行
  window.tryExportMethods = function (htmlContent, methods, index) {
    if (index >= methods.length) {
      console.error('❌ ALL EXPORT METHODS FAILED');

      // Check if this is a file access related issue
      if (FileAccessChecker.needsFileAccess()) {
        showExportError('エクスポート機能を使用するにはファイルアクセス権限が必要です');
      } else {
        showExportError('すべてのエクスポート方法が失敗しました');
      }
      return;
    }

    const method = methods[index];
    console.log(
      `🔄 Trying method ${index + 1}/${methods.length}: ${method.name}`
    );

    try {
      const result = method.func.call(window, htmlContent);
      if (result !== false) {
        console.log(`✅ SUCCESS with method: ${method.name}`);
        return;
      }
    } catch (error) {
      console.error(`❌ Method ${method.name} failed:`, error);
    }

    // 次の方法を試行
    setTimeout(() => {
      window.tryExportMethods(htmlContent, methods, index + 1);
    }, window.SIZES?.MEDIUM || 100);
  };

  // Blobダウンロード試行
  window.tryBlobDownload = function (htmlContent) {
    console.log('💾 Attempting Blob download...');
    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      console.log('  Blob created, size:', blob.size, 'type:', blob.type);

      const url = URL.createObjectURL(blob);
      console.log('  Object URL created:', url);

      const fileName = `markdown-export-${Date.now()}.html`;
      console.log('  Filename:', fileName);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';

      console.log(
        '  Link created - href:',
        link.href,
        'download:',
        link.download
      );

      // イベントリスナーでクリックを監視
      let clickFired = false;
      link.addEventListener('click', e => {
        clickFired = true;
        console.log('  📥 DOWNLOAD CLICK FIRED!');
        console.log('    Default prevented:', e.defaultPrevented);
        console.log('    Is trusted:', e.isTrusted);
        console.log('    Event type:', e.type);
      });

      document.body.appendChild(link);
      console.log('  Link added to DOM');

      // 強制クリック
      link.click();
      console.log('  Click triggered, waiting for download...');

      // 短時間待機してクリックイベントを確認
      setTimeout(() => {
        console.log('  Click event fired:', clickFired);

        // ブラウザダウンロード制限をチェック
        console.log('🔍 BROWSER DOWNLOAD INVESTIGATION:');
        console.log('  Navigator downloads enabled:', !!navigator.downloads);
        console.log('  Document visibilityState:', document.visibilityState);
        console.log('  Document hasFocus:', document.hasFocus());
        console.log('  Window top === window:', window.top === window);
        console.log('  Document referrer:', document.referrer);

        // Chrome downloads API availability
        if (typeof chrome !== 'undefined' && chrome.downloads) {
          console.log('  Chrome downloads API available: true');
        } else {
          console.log('  Chrome downloads API available: false');
        }

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('  Cleanup completed');

        if (clickFired) {
          console.log('  ⚠️ DOWNLOAD EVENT FIRED BUT FILE MAY NOT BE SAVED');
          console.log(
            '  ⚠️ サンドボックス環境でダウンロードが制限されている可能性があります'
          );
          console.log('  🔄 次の方法を試行します...');

          // 次の方法を強制実行
          setTimeout(() => {
            console.log(
              '🔄 Forcing next method due to download restriction...'
            );

            // Data URLを試行
            const dataResult = window.tryDataURLDownload(htmlContent);
            if (!dataResult) {
              console.log('🔄 Data URL failed, trying new window...');
              const windowResult = window.tryNewWindow(htmlContent);
              if (!windowResult) {
                console.log('🔄 New window failed, showing modal...');
                window.tryModal(htmlContent);
              }
            }
          }, window.SIZES?.MEDIUM || 100);

          return false;
        } else {
          console.warn(
            '  ⚠️ Click event not fired - download may have been blocked'
          );
          return false;
        }
      }, 500);

      return false; // 即座に失敗として扱い、次の方法に進む
    } catch (error) {
      console.error('  Blob download error:', error);
      return false;
    }
  };

  // Data URL ダウンロード試行
  window.tryDataURLDownload = function (htmlContent) {
    console.log('🔗 Attempting Data URL download...');
    try {
      const dataURL =
        'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
      console.log('  Data URL created, length:', dataURL.length);

      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `markdown-export-dataurl-${Date.now()}.html`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('  Data URL download triggered');
      showExportSuccess('Data URLでHTMLをダウンロードしました');
      return true;
    } catch (error) {
      console.error('  Data URL download error:', error);
      return false;
    }
  };

  // 新しいウィンドウで表示
  window.tryNewWindow = function (htmlContent) {
    console.log('🪟 Attempting new window...');
    try {
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        newWindow.location.href = url;
        console.log('  New window opened successfully');
        showExportSuccess('新しいウィンドウでHTMLを表示しました');
        return true;
      } else {
        console.warn('  New window blocked (popup blocker?)');
        return false;
      }
    } catch (error) {
      console.error('  New window error:', error);
      return false;
    }
  };

  // クリップボードにコピー
  window.tryClipboard = function (htmlContent) {
    console.log('📋 Attempting clipboard copy...');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(htmlContent)
          .then(() => {
            console.log('  Clipboard copy successful');
            showExportSuccess('HTMLコードをクリップボードにコピーしました');
            return true;
          })
          .catch(error => {
            console.error('  Modern clipboard error:', error);
            return window.tryLegacyClipboard(htmlContent);
          });
      } else {
        return window.tryLegacyClipboard(htmlContent);
      }
    } catch (error) {
      console.error('  Clipboard error:', error);
      return false;
    }
  };

  // レガシークリップボード
  window.tryLegacyClipboard = async function (htmlContent) {
    try {
      const textarea = document.createElement('textarea');
      (textarea /** @type {HTMLTextAreaElement} */ ).value = htmlContent;
      textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
      document.body.appendChild(textarea);
      (textarea /** @type {HTMLTextAreaElement} */ ).select();

      let success = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText((textarea /** @type {HTMLTextAreaElement} */ ).value);
          success = true;
        } catch (error) {
          console.warn('Modern clipboard API failed:', error);
          success = false;
        }
      }
      document.body.removeChild(textarea);

      if (success) {
        console.log('  Legacy clipboard copy successful');
        showExportSuccess('HTMLコードをクリップボードにコピーしました');
        return true;
      } else {
        console.warn('  Legacy clipboard copy failed');
        return false;
      }
    } catch (error) {
      console.error('  Legacy clipboard error:', error);
      return false;
    }
  };

  // モーダルで表示
  window.tryModal = function (htmlContent) {
    console.log('📱 Showing in modal...');
    try {
      const modal = document.createElement('div');
      modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8); z-index: 2000;
                display: flex; align-items: center; justify-content: center;
            `;

      modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: auto;">
                    <h3>📄 HTMLエクスポート</h3>
                    <p>以下のHTMLコードをコピーして、.htmlファイルとして保存してください：</p>
                    <textarea readonly style="width: 100%; height: ${window.PRINT?.PDF_MARGIN || 300}px; font-family: monospace; font-size: 12px;">${htmlContent}</textarea>
                    <div style="margin-top: 10px; text-align: center;">
                        <button onclick="
                        const textarea = this.previousElementSibling.previousElementSibling;
                        (textarea /** @type {HTMLTextAreaElement} */ ).select();
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText((textarea /** @type {HTMLTextAreaElement} */ ).value).then(() => {
                                showToastMessage('コピーしました！', 'success');
                            }).catch(() => {
                                showToastMessage('コピーに失敗しました', 'error');
                            });
                        } else {
                            showToastMessage('このブラウザではクリップボード機能がサポートされていません', 'error');
                        }" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px;">コピー</button>
                        <button onclick="this.closest('div').remove();" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px;">閉じる</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);
      console.log('  Modal created and displayed');

      // テキストエリアを自動選択
      const textarea = modal.querySelector('textarea');
      textarea.focus();
      (textarea /** @type {HTMLTextAreaElement} */ ).select();

      showExportSuccess('モーダルでHTMLコードを表示しました');
      return true;
    } catch (error) {
      console.error('  Modal error:', error);
      return false;
    }
  };

  // 汎用トーストメッセージ関数
  function showToastMessage(message, type = 'info', duration = 3000) {
    // 既存のトーストがあれば削除
    const existingToast = document.querySelector('.toast-message-generic');
    if (existingToast) {
      existingToast.remove();
    }

    // タイプに応じたスタイル設定
    let bgColor, borderColor, textColor, icon;
    switch (type) {
      case 'success':
        bgColor = '#d4edda';
        borderColor = '#c3e6cb';
        textColor = '#155724';
        icon = '✅';
        break;
      case 'error':
        // 印刷エラーと同じ黄色いスタイルに統一
        bgColor = '#fff3cd';
        borderColor = '#ffeaa7';
        textColor = '#856404';
        icon = '⚠️';
        break;
      case 'info':
      default:
        bgColor = '#e7f3ff';
        borderColor = '#b3d9ff';
        textColor = '#0066cc';
        icon = 'ℹ️';
        break;
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message-generic';
    toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">
                    ${message}
                </div>
                <button class="toast-close">×</button>
            </div>
        `;

    // スタイルを設定
    toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${bgColor};
            border: 1px solid ${borderColor};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: ${window.TIMEOUTS?.MAX_TIMEOUT + 10 || 10010};
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
    const iconElement = toast.querySelector('.toast-icon');
    (iconElement /** @type {HTMLElement} */ ).style.cssText = `
            font-size: 20px;
            flex-shrink: 0;
        `;

    // メッセージのスタイル
    const messageElement = toast.querySelector('.toast-message');
    (messageElement /** @type {HTMLElement} */ ).style.cssText = `
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            color: ${textColor};
        `;

    // 閉じるボタンのスタイル
    const closeBtn = toast.querySelector('.toast-close');
    (closeBtn /** @type {HTMLElement} */ ).style.cssText = `
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: ${textColor};
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            flex-shrink: 0;
        `;

    // CSSアニメーションを追加（まだ存在しない場合）
    if (!document.querySelector('#toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(${window.SIZES?.MEDIUM || 100}%);
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

    // 指定時間後に自動で閉じる
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);
  }

  // Show export success message
  function showExportSuccess(message = 'HTMLファイルをダウンロードしました') {
    showToastMessage(
      `<strong>エクスポート完了</strong><br>${message}`,
      'success',
      3000
    );
  }

  // Show export error message - 印刷エラーダイアログと完全に同じ実装
  function showExportError(_errorMessage) {
    // 既存のトーストがあれば削除
    const existingToast = document.querySelector('.export-error-toast');
    if (existingToast) {
      existingToast.remove();
    }

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

    // スタイルを設定 - 印刷エラートーストと全く同じ
    toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: ${window.TIMEOUTS?.MAX_TIMEOUT + 10 || 10010};
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideInRight 0.3s ease;
        `;

    // コンテンツのスタイル - 印刷エラートーストと全く同じ
    const content = toast.querySelector('.toast-content');
    content.style.cssText = `
            display: flex;
            align-items: flex-start;
            padding: 16px;
            gap: 12px;
        `;

    // アイコンのスタイル - 印刷エラートーストと全く同じ
    const icon = toast.querySelector('.toast-icon');
    icon.style.cssText = `
            font-size: 20px;
            flex-shrink: 0;
        `;

    // メッセージのスタイル - 印刷エラートーストと全く同じ
    const message = toast.querySelector('.toast-message');
    message.style.cssText = `
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            color: #856404;
        `;

    // 閉じるボタンのスタイル - 印刷エラートーストと全く同じ
    const closeBtn = toast.querySelector('.toast-close');
    (closeBtn /** @type {HTMLElement} */ ).style.cssText = `
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

    // CSSアニメーションを追加 - 印刷エラートーストと全く同じ
    if (!document.querySelector('#toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(${window.SIZES?.MEDIUM || 100}%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .toast-close:hover {
                    background: rgba(133, 100, 4, 0.1) !important;
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 閉じるボタンのイベントリスナー - 印刷エラートーストと全く同じ
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    // ホバー効果を追加 - 印刷エラートーストと全く同じ
    closeBtn.addEventListener('mouseenter', () => {
      (closeBtn /** @type {HTMLElement} */ ).style.backgroundColor = 'rgba(133, 100, 4, 0.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      (closeBtn /** @type {HTMLElement} */ ).style.backgroundColor = 'transparent';
    });

    // 5秒後に自動で閉じる - 印刷エラートーストと全く同じ
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }


  // 簡単なHTML生成（モーダル用）
  function _generateSimpleHTML(contentHTML, _originalMarkdown) {
    const title = document.title || 'Markdown Document';
    const currentURL = location.href;
    const timestamp = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: ${window.SIZES?.MAX_TOC_ITEMS || 1000}px; margin: 0 auto; padding: 20px; color: #24292e; }
        h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 2em; margin-bottom: 1em; }
        h1 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding-left: 16px; color: #6a737d; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; font-weight: 600; }
        a { color: #0366d6; text-decoration: none; }
        .export-header { text-align: center; border-bottom: 2px solid #eee; margin-bottom: 2em; padding-bottom: 1em; }
    </style>
</head>
<body>
    <div class="export-header">
        <h1>${title}</h1>
        <p>エクスポート日時: ${timestamp}</p>
        <p>元URL: <a href="${currentURL}">${currentURL}</a></p>
    </div>
    ${contentHTML}
</body>
</html>`;
  }

  // メイン処理
  async function initViewer() {
    try {
      console.log('Initializing enhanced markdown viewer...');

      let originalContent = '';

      // GitHub raw URLの場合はfetchを試行
      if (isGitHubRawURL()) {
        console.log(
          'Detected GitHub raw URL, attempting multiple fetch methods...'
        );

        // まず通常のfetchを試行
        try {
          originalContent = await fetchMarkdownContent(location.href);
          console.log('✅ Standard fetch succeeded');
        } catch (fetchError) {
          console.warn('❌ Standard fetch failed:', fetchError);

          // Chrome拡張機能のAPIを使った方法を試行
          try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
              console.log('Trying Chrome extension fetch...');
              originalContent = await fetchWithExtension(location.href);
              console.log('✅ Extension fetch succeeded');
            } else {
              throw new Error('Chrome extension API not available');
            }
          } catch (extensionError) {
            console.warn('❌ Extension fetch failed:', extensionError);

            // Check if file access is needed and show appropriate guidance
            if (FileAccessChecker.needsFileAccess()) {
              console.log(
                'File access permission may be needed for optimal functionality'
              );
              // Don't show error immediately, let the user see the basic functionality first
            }

            console.log('Falling back to DOM content extraction...');
            originalContent = getOriginalContent();
          }
        }
      } else {
        // 通常の方法でコンテンツを取得
        originalContent = getOriginalContent();
      }

      if (!originalContent.trim()) {
        console.log('No content found');
        return;
      }

      // ページを書き換え（CSSも含める）
      document.head.innerHTML = `
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Markdown Viewer with Enhanced Features</title>
                <link rel="stylesheet" href="${chrome.runtime.getURL('css/main.css')}">
            `;

      // Create main container
      document.body.innerHTML = `
                <div id="container">
                    <div id="markdown-content"></div>
                </div>
            `;

      // Markdownをレンダリング
      const html = renderMarkdown(originalContent);
      const contentContainer = document.getElementById('markdown-content');
      contentContainer.innerHTML = html;

      // Mermaid図を描画
      await renderMermaidDiagrams();

      // Initialize enhanced features
      // fetchでコンテンツを取得できた場合は、サンドボックス制限が回避される可能性が高い
      const isFetchedContent = isGitHubRawURL() && originalContent.trim();
      const delay = isFetchedContent
        ? window.SIZES?.LARGE || 200
        : location.protocol === 'https:' || location.protocol === 'http:'
          ? window.TIMEOUTS?.VERY_LONG_DELAY || 1000
          : window.SIZES?.LARGE || 200;

      const initFeatures = () => {
        try {
          initializeEnhancedFeatures(originalContent);
        } catch {
          console.warn(
            'Enhanced features initialization delayed due to restrictions'
          );
          // Try again with longer delay
          setTimeout(() => {
            try {
              initializeEnhancedFeatures(originalContent);
            } catch (e) {
              console.error('Enhanced features failed to initialize:', e);
              showBasicFallback();
            }
          }, window.TIMEOUTS?.VERY_LONG_DELAY || 1000);
        }
      };

      if (window.requestAnimationFrame) {
        setTimeout(() => {
          requestAnimationFrame(initFeatures);
        }, delay);
      } else {
        setTimeout(initFeatures, delay);
      }

      console.log('Enhanced markdown viewer initialized successfully');

    } catch (error) {
      console.error('Error initializing viewer:', error);
      document.body.innerHTML = `
                <h1>エラーが発生しました</h1>
                <pre style="color: red; background: #ffe6e6; padding: 20px; border-radius: 5px;">
${error.message}

デバッグ情報:
- URL: ${location.href}
- Protocol: ${location.protocol}
- Pathname: ${location.pathname}
- marked: ${typeof marked}
- mermaid: ${typeof mermaid}

コンソールで詳細なエラー情報を確認してください。
                </pre>
                <h2>元のファイル内容</h2>
                <pre style="background: #f8f8f8; padding: 20px; border-radius: 5px; white-space: pre-wrap;">${getOriginalContent()}</pre>
            `;
    }
  }

  // Start the initialization process
  startWhenReady();
})();
