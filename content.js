(function() {
    'use strict';
    
    console.log('Markdown Viewer: Enhanced content script loaded');
    console.log('Current URL:', location.href);
    console.log('Libraries check - marked:', typeof marked, 'mermaid:', typeof mermaid);
    
    // Safe storage utility for sandboxed environments
    window.SafeStorage = {
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
    
    // マークダウンファイルかチェック
    function isMarkdownFile() {
        const pathname = location.pathname.toLowerCase();
        const protocol = location.protocol;
        const isValidProtocol = protocol === 'file:' || protocol === 'http:' || protocol === 'https:';
        const isMd = pathname.endsWith('.md') || 
                     pathname.endsWith('.mkd') || 
                     pathname.endsWith('.mdx') || 
                     pathname.endsWith('.markdown');
        console.log('Protocol:', protocol, 'Is valid protocol:', isValidProtocol, 'Is markdown extension:', isMd);
        return isValidProtocol && isMd;
    }
    
    // GitHub raw URLかどうかをチェック
    function isGitHubRawURL() {
        return location.hostname.includes('raw.githubusercontent.com') || 
               (location.hostname.includes('github.com') && location.pathname.includes('/raw/'));
    }
    
    if (!isMarkdownFile()) {
        console.log('Not a markdown file, exiting');
        return;
    }
    
    console.log('Markdown file detected, starting enhanced viewer...');
    
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
    function loadScript(src) {
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
    
    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
    
    // 拡張機能のベースURLを取得
    function getExtensionBaseURL() {
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
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose'
            });
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
        
        const mermaidElements = document.querySelectorAll('.mermaid');
        console.log(`Found ${mermaidElements.length} mermaid elements`);
        
        for (let i = 0; i < mermaidElements.length; i++) {
            const element = mermaidElements[i];
            try {
                const graphDefinition = element.textContent.trim();
                console.log(`Rendering mermaid ${i}:`, graphDefinition.substring(0, 50));
                
                const { svg } = await mermaid.render(`graph-${i}`, graphDefinition);
                element.innerHTML = svg;
                
                console.log(`Mermaid ${i} rendered successfully`);
            } catch (error) {
                console.error(`Mermaid ${i} rendering error:`, error);
                element.innerHTML = `<pre style="color: red; background: #ffe6e6; padding: 10px; border-radius: 5px;">
Mermaidエラー: ${error.message}

元のコード:
${element.textContent}
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
                                z-index: 99999 !important;
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
                    showExportError(error.message);
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
                        alert('クリップボードにコピーしました！');
                    }).catch(() => {
                        alert('コピーに失敗しました');
                    });
                } else {
                    alert('このブラウザではクリップボード機能がサポートされていません');
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
                                alert('コピーしました！');
                            }).catch(() => {
                                alert('コピーに失敗しました');
                            });
                        } else {
                            alert('このブラウザではクリップボード機能がサポートされていません');
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
            const capabilities = investigateSandboxLimitations();
            
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
            showExportError(error.message);
        }
    }

    // 複数の方法を順次試行
    window.tryExportMethods = function(htmlContent, methods, index) {
        if (index >= methods.length) {
            console.error('❌ ALL EXPORT METHODS FAILED');
            showExportError('すべてのエクスポート方法が失敗しました');
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
                background: rgba(0,0,0,0.8); z-index: 999999;
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
                                alert('コピーしました！');
                            }).catch(() => {
                                alert('コピーに失敗しました');
                            });
                        } else {
                            alert('このブラウザではクリップボード機能がサポートされていません');
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
    
    // Show export success message
    function showExportSuccess(message = 'HTMLファイルをダウンロードしました') {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 10px;
            border-radius: 5px;
            z-index: 1001;
            font-size: 12px;
        `;
        successMsg.textContent = `✅ ${message}`;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.parentNode.removeChild(successMsg);
            }
        }, 3000);
    }
    
    // Show export error message
    function showExportError(errorMessage) {
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            z-index: 1001;
            font-size: 12px;
            max-width: 300px;
        `;
        errorMsg.innerHTML = `
            <strong>❌ エクスポートエラー</strong><br>
            <small>${errorMessage}</small><br>
            <small>サンドボックス環境では機能が制限されます</small>
        `;
        document.body.appendChild(errorMsg);
        
        setTimeout(() => {
            if (errorMsg.parentNode) {
                errorMsg.parentNode.removeChild(errorMsg);
            }
        }, 5000);
    }
    
    // 簡単なHTML生成（モーダル用）
    function generateSimpleHTML(contentHTML, originalMarkdown) {
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
                } catch (error) {
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
    
    // 実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initViewer);
    } else {
        initViewer();
    }
    
})();