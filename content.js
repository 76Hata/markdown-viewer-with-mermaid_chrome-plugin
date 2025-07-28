(function() {
    'use strict';
    
    console.log('Markdown Viewer: Enhanced content script loaded');
    console.log('Current URL:', location.href);
    console.log('Libraries check - marked:', typeof marked, 'mermaid:', typeof mermaid);
    
    // マークダウンファイルかチェック
    function isMarkdownFile() {
        const pathname = location.pathname.toLowerCase();
        const isFile = location.protocol === 'file:';
        const isMd = pathname.endsWith('.md') || pathname.endsWith('.markdown');
        console.log('Is file protocol:', isFile, 'Is markdown extension:', isMd);
        return isFile && isMd;
    }
    
    if (!isMarkdownFile()) {
        console.log('Not a markdown file, exiting');
        return;
    }
    
    console.log('Markdown file detected, starting enhanced viewer...');
    
    // 元のコンテンツを取得
    function getOriginalContent() {
        const content = document.body.textContent || document.body.innerText || '';
        console.log('Original content length:', content.length);
        return content;
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
            breaks: false
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
            
            if (typeof window.Toolbar !== 'undefined') {
                try {
                    window.markdownViewerToolbar = new window.Toolbar();
                    console.log('✅ Enhanced features initialized successfully');
                } catch (error) {
                    console.error('❌ Error creating Toolbar:', error);
                }
            } else {
                console.error('❌ Toolbar class not available - check manifest.json');
            }
            
        } catch (error) {
            console.error('Failed to initialize enhanced features:', error);
        }
    }
    
    // メイン処理
    async function initViewer() {
        try {
            console.log('Initializing enhanced markdown viewer...');
            
            // 元のコンテンツを保存
            const originalContent = getOriginalContent();
            if (!originalContent.trim()) {
                console.log('No content found');
                return;
            }
            
            // ページを書き換え
            document.head.innerHTML = `
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Markdown Viewer with Enhanced Features</title>
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
            setTimeout(() => {
                initializeEnhancedFeatures(originalContent);
            }, 100);
            
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