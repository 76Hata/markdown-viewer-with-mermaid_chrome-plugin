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
 * - エクスポート機能（HTML/PDF）
 * 
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 * 
 * @requires marked - Markdownパーサーライブラリ
 * @requires mermaid - 図表描画ライブラリ
 * @requires jsPDF - PDF生成ライブラリ
 * @requires html2canvas - HTML to Canvas変換ライブラリ
 * 
 * @example
 * // このスクリプトは自動的に実行され、Markdownファイルを検出すると
 * // enhanced markdown viewerを初期化します
 * 
 * @see {@link https://github.com/76Hata/markdown-viewer-with-mermaid} プロジェクトリポジトリ
 */
(function() {
    'use strict';
    
    // Markdown Viewer enhanced content script loaded
    
    // Check for sandboxed environment and GitHub Raw URLs
    try {
        const _isSandboxed = window.parent !== window.self && 
                          window.location !== window.parent.location;
        const _isGitHubRaw = location.hostname.includes('raw.githubusercontent.com');
    } catch {
        // Sandbox detection failed - continue normal execution
    }
    
    // Wait for libraries to load if needed
    if (typeof marked === 'undefined' || typeof mermaid === 'undefined') {
        setTimeout(() => {
            initMarkdownViewer();
        }, 100);
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
    window.FileAccessChecker = {
        /**
         * ファイルアクセス権限をチェックする
         * Chrome拡張機能のファイルアクセス設定を確認し、コンソールに結果を出力します。
         * 
         * @method checkFileAccess
         * @memberof FileAccessChecker
         * @description この関数は開発者がファイルアクセス権限の状態を確認するために使用します。
         *              主にデバッグ用途で、実際の権限判定にはFileAccessNotifierを使用してください。
         * 
         * @returns {void} 戻り値はありません。結果はコンソールに出力されます。
         * 
         * @example
         * // ファイルアクセス権限をチェックする
         * FileAccessChecker.checkFileAccess();
         * 
         * @see {@link FileAccessNotifier} 実際の権限判定とダイアログ表示
         */
        checkFileAccess: function() {
            console.log('=== FileAccessChecker.checkFileAccess() ===');
            try {
                console.log('chrome object exists:', typeof chrome !== 'undefined');
                console.log('chrome.extension exists:', typeof chrome !== 'undefined' && !!chrome.extension);
                console.log('chrome.extension.isAllowedFileSchemeAccess exists:', 
                    typeof chrome !== 'undefined' && !!chrome.extension && !!chrome.extension.isAllowedFileSchemeAccess);
                
                if (typeof chrome !== 'undefined' && chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
                    const hasAccess = chrome.extension.isAllowedFileSchemeAccess();
                    console.log('chrome.extension.isAllowedFileSchemeAccess() result:', hasAccess);
                    return hasAccess;
                }
                
                // For Manifest V3, try alternative detection method
                // If we can access the current file:// URL without restrictions, we likely have access
                if (location.protocol === 'file:') {
                    console.log('Trying alternative file access detection for Manifest V3...');
                    try {
                        // If we're running on a file:// protocol and the extension is working,
                        // we likely have file access permission
                        const hasManifestAccess = typeof chrome !== 'undefined' && 
                                                 chrome.runtime && 
                                                 chrome.runtime.getManifest;
                        if (hasManifestAccess) {
                            console.log('Extension APIs available on file:// - assuming file access is ON');
                            return true;
                        }
                    } catch (e) {
                        console.log('Alternative detection failed:', e.message);
                    }
                }
                
                // For non-file protocols or when we can't determine, return true to avoid showing unnecessary dialog
                if (location.protocol !== 'file:') {
                    console.log('Non-file protocol - returning true (no file access needed)');
                    return true;
                }
                
                // For file protocol when we can't determine, be conservative and return false
                console.log('Cannot determine file access status - returning false to be safe');
                return false;
            } catch (e) {
                console.warn('Could not check file access permission:', e.message);
                return false;
            }
        },
        
        isFileProtocol: function() {
            const isFile = location.protocol === 'file:';
            console.log('=== FileAccessChecker.isFileProtocol() ===', isFile);
            return isFile;
        },
        
        needsFileAccess: function() {
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
        }
    };

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
    window.SafeStorage = {
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
        setItem: function(key, value) {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.set({[key]: value});
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
        getItem: function(key, callback) {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.get([key], (result) => {
                        callback(result[key] || null);
                    });
                } else {
                    callback(localStorage.getItem(key));
                }
            } catch (e) {
                console.warn('Storage not available:', e.message);
                callback(null);
            }
        }
    };
    
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
        const isValidProtocol = protocol === 'file:' || protocol === 'http:' || protocol === 'https:';
        /** @type {boolean} Markdown拡張子かどうか */
        const isMd = pathname.endsWith('.md') || 
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
        return location.hostname.includes('raw.githubusercontent.com') || 
               (location.hostname.includes('github.com') && location.pathname.includes('/raw/'));
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
            console.log('📝 Note: Use local file:// URLs to test file access notifications');
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
            if (contentType.includes('text/plain') || contentType.includes('text/markdown') || 
                document.body.children.length === 1 && document.body.children[0].tagName === 'PRE') {
                content = document.body.textContent || document.body.innerText || '';
            } 
            // raw.githubusercontent.com のような生ファイルの場合
            else if (location.hostname.includes('raw.githubusercontent.com') || 
                     location.pathname.includes('/raw/')) {
                content = document.body.textContent || document.body.innerText || '';
            }
            else {
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
                    'Accept': 'text/plain, text/markdown, */*'
                }
            });
            
            console.log('Fetch response status:', response.status);
            console.log('Fetch response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const content = await response.text();
            console.log('Fetched content length:', content.length);
            console.log('First 100 chars:', content.substring(0, 100));
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
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('XHR succeeded with status:', xhr.status);
                    console.log('Response length:', xhr.responseText.length);
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`XHR failed with status: ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('XHR network error'));
            };
            
            xhr.ontimeout = function() {
                reject(new Error('XHR timeout'));
            };
            
            xhr.timeout = 10000; // 10秒タイムアウト
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
            script.onerror = (error) => {
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
                        wrap: true
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
                        useMaxWidth: true
                    },
                    // フローチャートの設定
                    flowchart: {
                        diagramPadding: 8,
                        htmlLabels: true,
                        curve: 'basis',
                        useMaxWidth: true
                    },
                    // パイチャートの設定
                    pie: {
                        useMaxWidth: true
                    },
                    // クラス図の設定
                    class: {
                        useMaxWidth: true
                    },
                    // ER図の設定
                    er: {
                        useMaxWidth: true
                    }
                });
                console.log('Mermaid initialized successfully');
            } catch (initError) {
                console.error('Mermaid initialization error:', initError);
            }
        }
        
        // カスタムレンダラー
        const renderer = new marked.Renderer();
        let mermaidCounter = 0;
        
        renderer.code = function(code, language) {
            if (language === 'mermaid') {
                const id = `mermaid-${mermaidCounter++}`;
                return `<div class="mermaid" id="${id}" data-mermaid-code="${encodeURIComponent(code)}">${code}</div>`;
            }
            // HTMLエスケープ関数
            const escapeHtml = (text) => {
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
            headerIds: false
        });
        
        // HTMLに変換
        const html = marked.parse(content);
        console.log('Markdown parsed, HTML length:', html.length);
        
        return html;
    }
    
    // Mermaid図の描画
    async function renderMermaidDiagrams() {
        if (typeof mermaid === 'undefined') {
            console.log('Mermaid not available');
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
                    wrap: true
                },
                gantt: {
                    useMaxWidth: true,
                    fontSize: 11,
                    fontFamily: 'inherit',
                    sidePadding: 50
                },
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis'
                },
                er: {
                    useMaxWidth: true,
                    fontSize: 12
                },
                pie: {
                    useMaxWidth: true
                }
            });
        } catch (initError) {
            console.warn('Mermaid re-initialization warning:', initError);
        }
        
        const mermaidElements = document.querySelectorAll('.mermaid');
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
                        console.warn(`Failed to decode mermaid code for element ${i}, using textContent:`, decodeError);
                        graphDefinition = element.textContent.trim();
                    }
                } else {
                    graphDefinition = element.textContent.trim();
                    // 後で再描画に使えるよう保存
                    element.dataset.mermaidCode = encodeURIComponent(graphDefinition);
                }
                
                console.log(`Rendering mermaid ${i}:`, graphDefinition.substring(0, 50));
                
                // 図表タイプを検出
                const diagramType = graphDefinition.split('\n')[0].trim();
                console.log(`Diagram type detected: ${diagramType}`);
                
                const { svg } = await mermaid.render(`graph-${Date.now()}-${i}`, graphDefinition);
                element.innerHTML = svg;
                
                console.log(`Mermaid ${i} (${diagramType}) rendered successfully`);
            } catch (error) {
                console.error(`Mermaid ${i} rendering error:`, error);
                console.error('Graph definition:', element.dataset.mermaidCode || element.textContent);
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
                            console.log('⚠️ Running in sandboxed environment - some features may be limited');
                        }
                        
                        console.log('Creating Toolbar instance...');
                        window.markdownViewerToolbar = new window.Toolbar();
                        
                        // CSSの確認
                        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
                        console.log('CSS links found:', cssLinks.length);
                        
                        // ツールバー要素の確認と強制修正
                        const toolbarElement = document.querySelector('.main-toolbar');
                        console.log('Toolbar element found:', !!toolbarElement);
                        if (toolbarElement) {
                            console.log('Toolbar visible:', getComputedStyle(toolbarElement).display !== 'none');
                            
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
                                z-index: 1000 !important;
                                height: 50px !important;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                            `;
                            
                            // エクスポートボタンを強制追加
                            const exportBtn = toolbarElement.querySelector('#export-html-btn');
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
                        console.log(`Toolbar class not yet available, retry ${toolbarInitAttempts}/${maxToolbarAttempts}`);
                        setTimeout(initToolbar, 500);
                    } else {
                        console.error('❌ Toolbar class not available after retries - check manifest.json');
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
            z-index: 1000;
            max-width: 300px;
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
                    if (FileAccessChecker.needsFileAccess() && 
                        (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('CORS'))) {
                        FileAccessNotifier.showFileAccessError('エクスポート機能');
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
        }, 10000);
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
            max-width: 1000px;
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
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `markdown-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; color: #24292e; }
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
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;">
                <h3>📄 HTMLエクスポート</h3>
                <p>以下のHTMLコードをコピーして、.htmlファイルとして保存してください：</p>
                <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px; border: 1px solid #ccc; padding: 10px;">${htmlContent}</textarea>
                <div style="margin-top: 10px; text-align: center;">
                    <button onclick="
                        const textarea = this.previousElementSibling.previousElementSibling;
                        textarea.select();
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(textarea.value).then(() => {
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
        console.log('='.repeat(50));
        
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
        const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (metaCSP) {
            console.log('  Meta CSP:', metaCSP.content);
        }
        
        // API可用性テスト
        console.log('🧪 API Availability Tests:');
        console.log('  Blob:', typeof Blob !== 'undefined');
        console.log('  URL.createObjectURL:', typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function');
        console.log('  window.open:', typeof window.open === 'function');
        console.log('  document.createElement:', typeof document.createElement === 'function');
        console.log('  addEventListener:', typeof Element.prototype.addEventListener === 'function');
        
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
        
        console.log('='.repeat(50));
        console.log('🔍 SANDBOX INVESTIGATION END');
        
        return {
            canCreateBlob: typeof Blob !== 'undefined',
            canCreateObjectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
            canOpenWindow: typeof window.open === 'function',
            isSandboxed: location.hostname.includes('raw.githubusercontent.com')
        };
    }

    // 直接HTMLエクスポート（徹底的なログ付き）
    function createDirectHTMLExport() {
        try {
            console.log('🚀 STARTING HTML EXPORT');
            console.log('='.repeat(40));
            
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; color: #24292e; }
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
                { name: 'Blob Download', func: () => window.tryBlobDownload(htmlContent) },
                { name: 'Data URL Download', func: () => window.tryDataURLDownload(htmlContent) },
                { name: 'New Window', func: () => window.tryNewWindow(htmlContent) },
                { name: 'Copy to Clipboard', func: () => window.tryClipboard(htmlContent) },
                { name: 'Show in Modal', func: () => window.tryModal(htmlContent) }
            ];

            console.log('🎯 Trying', methods.length, 'export methods...');

            window.tryExportMethods(htmlContent, methods, 0);
            
        } catch (error) {
            console.error('❌ EXPORT COMPLETELY FAILED:', error);
            
            // Check if this is a file access related error
            if (FileAccessChecker.needsFileAccess()) {
                FileAccessNotifier.showFileAccessError('エクスポート機能');
            } else {
                showExportError(error.message);
            }
        }
    }

    // 複数の方法を順次試行
    window.tryExportMethods = function(htmlContent, methods, index) {
        if (index >= methods.length) {
            console.error('❌ ALL EXPORT METHODS FAILED');
            
            // Check if this is a file access related issue
            if (FileAccessChecker.needsFileAccess()) {
                FileAccessNotifier.showFileAccessError('エクスポート機能');
            } else {
                showExportError('すべてのエクスポート方法が失敗しました');
            }
            return;
        }

        const method = methods[index];
        console.log(`🔄 Trying method ${index + 1}/${methods.length}: ${method.name}`);

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
        }, 100);
    };

    // Blobダウンロード試行
    window.tryBlobDownload = function(htmlContent) {
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
            
            console.log('  Link created - href:', link.href, 'download:', link.download);
            
            // イベントリスナーでクリックを監視
            let clickFired = false;
            link.addEventListener('click', (e) => {
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
                console.log('  Navigator downloads enabled:', !!(navigator.downloads));
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
                    console.log('  ⚠️ サンドボックス環境でダウンロードが制限されている可能性があります');
                    console.log('  🔄 次の方法を試行します...');
                    
                    // 次の方法を強制実行
                    setTimeout(() => {
                        console.log('🔄 Forcing next method due to download restriction...');
                        
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
                    }, 100);
                    
                    return false;
                } else {
                    console.warn('  ⚠️ Click event not fired - download may have been blocked');
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
    window.tryDataURLDownload = function(htmlContent) {
        console.log('🔗 Attempting Data URL download...');
        try {
            const dataURL = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
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
    window.tryNewWindow = function(htmlContent) {
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
    window.tryClipboard = function(htmlContent) {
        console.log('📋 Attempting clipboard copy...');
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(htmlContent).then(() => {
                    console.log('  Clipboard copy successful');
                    showExportSuccess('HTMLコードをクリップボードにコピーしました');
                    return true;
                }).catch(error => {
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
    window.tryLegacyClipboard = async function(htmlContent) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = htmlContent;
            textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
            document.body.appendChild(textarea);
            textarea.select();
            
            let success = false;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(textarea.value);
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
    window.tryModal = function(htmlContent) {
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
                    <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;">${htmlContent}</textarea>
                    <div style="margin-top: 10px; text-align: center;">
                        <button onclick="
                        const textarea = this.previousElementSibling.previousElementSibling;
                        textarea.select();
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(textarea.value).then(() => {
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
            textarea.select();
            
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
        const iconElement = toast.querySelector('.toast-icon');
        iconElement.style.cssText = `
            font-size: 20px;
            flex-shrink: 0;
        `;
        
        // メッセージのスタイル
        const messageElement = toast.querySelector('.toast-message');
        messageElement.style.cssText = `
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            color: ${textColor};
        `;
        
        // 閉じるボタンのスタイル
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.style.cssText = `
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
        
        // 指定時間後に自動で閉じる
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }

    // Show export success message
    function showExportSuccess(message = 'HTMLファイルをダウンロードしました') {
        showToastMessage(`<strong>エクスポート完了</strong><br>${message}`, 'success', 3000);
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
            z-index: 10010;
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
        
        // CSSアニメーションを追加 - 印刷エラートーストと全く同じ
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
            closeBtn.style.backgroundColor = 'rgba(133, 100, 4, 0.1)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = 'transparent';
        });
        
        // 5秒後に自動で閉じる - 印刷エラートーストと全く同じ
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    // File access notification system
    window.FileAccessNotifier = {
        // showFileAccessNotice function removed
        
        // Show detailed setup guide modal
        showDetailedGuide: function() {
            const modal = document.createElement('div');
            modal.id = 'file-access-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 20000;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <h3 style="margin-top: 0; color: #333; display: flex; align-items: center;">
                        📁 ファイルアクセス設定方法
                    </h3>
                    <ol style="line-height: 1.8; color: #555; padding-left: 20px;">
                        <li>ブラウザ右上の拡張機能アイコン（パズルピース）をクリック</li>
                        <li><strong>「Markdown Viewer with Mermaid」</strong>の横の<strong>三点メニュー</strong>をクリック</li>
                        <li><strong>「拡張機能を管理」</strong>をクリック</li>
                        <li><strong>「ファイルのURLへのアクセスを許可する」</strong>をONにする</li>
                        <li>ページを再読み込みする</li>
                    </ol>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #007bff;">
                        <strong>💡 この設定の効果</strong>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #666;">
                            <li>ローカルMarkdownファイルの高速読み込み</li>
                            <li>画像やリンクの正しい表示</li>
                            <li>エクスポート機能の安定動作</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 10px; border-radius: 4px; margin: 15px 0; font-size: 13px; color: #856404;">
                        ⚠️ <strong>セキュリティについて:</strong> この設定はローカルファイルへの読み取り専用アクセスのみを許可します。
                    </div>
                    
                    <div style="text-align: right; margin-top: 25px;">
                        <button id="close-modal-btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">理解しました</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal event
            document.getElementById('close-modal-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        },
        
        // dismissNotice function removed
        
        // Show error-specific guidance
        showFileAccessError: function(errorContext) {
            const errorModal = document.createElement('div');
            errorModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 20000;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            errorModal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 450px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <h3 style="margin-top: 0; color: #dc3545; display: flex; align-items: center;">
                        ❌ ファイルアクセス権限が必要です
                    </h3>
                    <p style="color: #666; line-height: 1.6;">
                        <strong>${errorContext || 'この機能'}</strong>を使用するには、拡張機能にファイルアクセス許可を与える必要があります。
                    </p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                        <strong>設定手順:</strong>
                        <ol style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
                            <li>拡張機能アイコン → メニュー → 「拡張機能を管理」</li>
                            <li>「ファイルのURLへのアクセスを許可する」をON</li>
                        </ol>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button onclick="this.closest('div').style.display='none'" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">後で設定</button>
                        <button onclick="window.FileAccessNotifier.showDetailedGuide(); this.closest('div').style.display='none';" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">詳細な手順を見る</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(errorModal);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (errorModal.parentNode) {
                    document.body.removeChild(errorModal);
                }
            }, 10000);
        },
        
        // Initialize file access checking when markdown files are loaded
        init: function() {
            console.log('=== FileAccessNotifier.init() ===');
            console.log('Markdown file loaded - checking file access permission');
            
            // Check extension's file access permission regardless of protocol
            this.checkFileAccessPermission((hasFileAccess) => {
                console.log('File access permission status:', hasFileAccess);
                
                if (!hasFileAccess) {
                    console.log('❌ File access OFF - showing local file usage dialog');
                    // Show "ローカルファイルでの使用について" dialog when file access is OFF
                    this.showLocalFileUsageDialog();
                }
            });
        },
        
        // Check extension's file access permission specifically
        checkFileAccessPermission: function(callback) {
            console.log("🔍 file:// アクセス権限を確認します...");

            // バックグラウンドスクリプトにメッセージを送信してファイルアクセス権限を確認
            chrome.runtime.sendMessage({action: 'checkFileAccess'}, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("❌ chrome.runtime.sendMessage エラー:", chrome.runtime.lastError);
                    callback(false);
                    return;
                }

                if (response && response.success) {
                    const hasFileAccess = response.hasFileAccess;
                    console.log("ファイルアクセス権限:", hasFileAccess);
                    
                    if (hasFileAccess) {
                        console.log("✅ file:// アクセスは有効です（ユーザー設定ON）");
                        callback(true);
                    } else {
                        console.log("❌ file:// アクセスはユーザー設定により無効です");
                        callback(false);
                    }
                } else {
                    console.log("❌ ファイルアクセス権限の確認に失敗しました");
                    callback(false);
                }
            });
        }, 

        // Show local file usage dialog when file access is OFF
        showLocalFileUsageDialog: function() {
            console.log('=== FileAccessNotifier.showLocalFileUsageDialog() ===');
            
            // Check if user has already dismissed this dialog
            const self = this;
            SafeStorage.getItem('local-file-usage-dialog-dismissed', (dismissed) => {
                if (!dismissed) {
                    console.log('⏰ Setting timer to show local file usage dialog in 2 seconds...');
                    setTimeout(() => {
                        console.log('🚀 Showing local file usage dialog now');
                        self.displayLocalFileUsageDialog();
                    }, 2000);
                } else {
                    console.log('ℹ️ Local file usage dialog was previously dismissed');
                }
            });
        },
        
        // Display the actual local file usage dialog
        displayLocalFileUsageDialog: function() {
            console.log('Creating local file usage dialog...');
            
            const dialog = document.createElement('div');
            dialog.id = 'local-file-usage-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background: #fff3cd;
                border-bottom: 2px solid #ffc107;
                padding: 15px;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            `;
            
            dialog.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <span style="margin-right: 15px; font-size: 18px;">📁</span>
                    <div>
                        <strong>ローカルファイルでの使用について</strong><br>
                        <small style="color: #856404;">この拡張機能をローカルのMarkdownファイルで使用するには「ファイルのURLへのアクセスを許可する」をONにしてください</small>
                    </div>
                </div>
                <div>
                    <button id="show-setup-guide-btn" style="background: #ffc107; color: #212529; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer; font-size: 13px; font-weight: 500;">設定方法</button>
                    <button id="dismiss-dialog-btn" style="background: transparent; border: none; font-size: 20px; cursor: pointer; color: #856404;">×</button>
                </div>
            `;
            
            // Add to top of page
            document.body.insertBefore(dialog, document.body.firstChild);
            
            // Adjust body padding to accommodate dialog
            document.body.style.paddingTop = (document.body.style.paddingTop ? parseInt(document.body.style.paddingTop) : 0) + 70 + 'px';
            
            // Event listeners
            document.getElementById('show-setup-guide-btn').addEventListener('click', () => {
                this.showFileAccessSetupGuide();
            });
            
            document.getElementById('dismiss-dialog-btn').addEventListener('click', () => {
                this.dismissLocalFileUsageDialog();
            });
            
            console.log('✅ Local file usage dialog created and displayed');
        },
        
        // Show file access setup guide
        showFileAccessSetupGuide: function() {
            const modal = document.createElement('div');
            modal.id = 'file-access-setup-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 20000;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <h3 style="margin-top: 0; color: #333; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">📁</span>
                        ファイルアクセス設定方法
                    </h3>
                    
                    <div style="margin-bottom: 20px;">
                        <p style="color: #666; margin-bottom: 15px;">
                            ローカルのMarkdownファイルを表示するには、以下の手順で設定してください：
                        </p>
                        
                        <ol style="color: #333; line-height: 1.6;">
                            <li style="margin-bottom: 10px;">
                                Chrome拡張機能ページ（<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">chrome://extensions/</code>）を開く
                            </li>
                            <li style="margin-bottom: 10px;">
                                「Markdown Viewer with Mermaid」拡張機能を見つける
                            </li>
                            <li style="margin-bottom: 10px;">
                                <strong>「ファイルのURLへのアクセスを許可する」</strong>をONにする
                            </li>
                            <li style="margin-bottom: 10px;">
                                ページを再読み込みする
                            </li>
                        </ol>
                        
                        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 12px; margin: 15px 0;">
                            <p style="margin: 0; color: #0066cc; font-size: 13px;">
                                💡 この設定により、ローカルファイル（file://）でも拡張機能が動作します
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: right;">
                        <button id="close-setup-modal-btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                            閉じる
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal event
            document.getElementById('close-setup-modal-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
            console.log('✅ File access setup guide modal displayed');
        },
        
        // Dismiss local file usage dialog
        dismissLocalFileUsageDialog: function() {
            console.log('Dismissing local file usage dialog...');
            
            const dialog = document.getElementById('local-file-usage-dialog');
            if (dialog) {
                // Remove dialog
                dialog.remove();
                
                // Reset body padding
                const currentPadding = parseInt(document.body.style.paddingTop) || 0;
                document.body.style.paddingTop = Math.max(0, currentPadding - 70) + 'px';
                
                // Remember that user dismissed this dialog
                SafeStorage.setItem('local-file-usage-dialog-dismissed', true);
                
                console.log('✅ Local file usage dialog dismissed and remembered');
            }
        }
    };
    
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; color: #24292e; }
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
                console.log('Detected GitHub raw URL, attempting multiple fetch methods...');
                
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
                            console.log('File access permission may be needed for optimal functionality');
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
            const delay = isFetchedContent ? 200 : (location.protocol === 'https:' || location.protocol === 'http:') ? 1000 : 200;
            
            const initFeatures = () => {
                try {
                    initializeEnhancedFeatures(originalContent);
                } catch {
                    console.warn('Enhanced features initialization delayed due to restrictions');
                    // Try again with longer delay
                    setTimeout(() => {
                        try {
                            initializeEnhancedFeatures(originalContent);
                        } catch (e) {
                            console.error('Enhanced features failed to initialize:', e);
                            showBasicFallback();
                        }
                    }, 1000);
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
            
            // Initialize file access notifier
            console.log('🔔 About to initialize FileAccessNotifier...');
            FileAccessNotifier.init();
            console.log('✅ FileAccessNotifier.init() completed');
            
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