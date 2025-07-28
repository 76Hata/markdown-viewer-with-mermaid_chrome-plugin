/**
 * Toolbar Class
 * Creates and manages the main toolbar interface
 */
class Toolbar {
    constructor(container) {
        this.container = container || document.body;
        this.toolbarElement = null;
        this.themeManager = null;
        this.searchEngine = null;
        this.tocGenerator = null;
        
        this.init();
    }
    
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
        this.toolbarElement.innerHTML = `
            <div class="toolbar-drag-handle" title="ツールバーをドラッグして移動">⋮⋮</div>
            <button class="toolbar-btn" id="toggle-toc-btn" title="目次表示/非表示">
                📋
            </button>
            <button class="toolbar-btn" id="search-btn" title="検索 (Ctrl+F)">
                🔍
            </button>
            <div class="theme-selector-container"></div>
            <button class="toolbar-btn" id="print-btn" title="印刷">
                🖨️
            </button>
            <button class="toolbar-btn" id="settings-btn" title="設定">
                ⚙️
            </button>
            <button class="toolbar-btn" id="hide-toolbar-btn" title="ツールバーを隠す (F11)">
                ✕
            </button>
        `;
        
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
            const themeContainer = this.toolbarElement?.querySelector('.theme-selector-container');
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
                        this.disableTOCButton();
                    }
                } else {
                    console.warn('TOC Generator disabled: no headings or class not available');
                    this.disableTOCButton();
                }
            }, 100);
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }
    
    createThemeSelector(container) {
        const themeSelector = document.createElement('div');
        themeSelector.className = 'theme-selector';
        themeSelector.innerHTML = `
            <button class="toolbar-btn theme-selector-button" title="テーマを選択">
                🎨 <span class="theme-name">Light</span>
            </button>
            <div class="theme-dropdown" style="display: none;">
                <div class="theme-options">
                    <div class="theme-option" data-theme="light">
                        <div class="theme-preview light-preview">
                            <div class="preview-text">Aa</div>
                        </div>
                        <span class="theme-label">Light</span>
                    </div>
                    <div class="theme-option" data-theme="dark">
                        <div class="theme-preview dark-preview">
                            <div class="preview-text">Aa</div>
                        </div>
                        <span class="theme-label">Dark</span>
                    </div>
                    <div class="theme-option" data-theme="sepia">
                        <div class="theme-preview sepia-preview">
                            <div class="preview-text">Aa</div>
                        </div>
                        <span class="theme-label">Sepia</span>
                    </div>
                </div>
                <div class="theme-actions">
                    <button class="auto-theme-button">🌓 自動切り替え</button>
                </div>
            </div>
        `;
        
        container.appendChild(themeSelector);
    }
    
    bindEvents() {
        // TOC toggle
        const tocBtn = this.toolbarElement.querySelector('#toggle-toc-btn');
        if (tocBtn) {
            tocBtn.addEventListener('click', () => {
                console.log('TOC button clicked');
                if (this.tocGenerator) {
                    this.toggleTOC();
                } else {
                    console.warn('TOC Generator not available');
                }
            });
        }
        
        // Search
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
        
        // Print
        const printBtn = this.toolbarElement.querySelector('#print-btn');
        printBtn.addEventListener('click', () => {
            this.handlePrint();
        });
        
        // Settings
        const settingsBtn = this.toolbarElement.querySelector('#settings-btn');
        settingsBtn.addEventListener('click', () => {
            this.openSettings();
        });
        
        // Hide toolbar
        const hideBtn = this.toolbarElement.querySelector('#hide-toolbar-btn');
        hideBtn.addEventListener('click', () => {
            this.hideToolbar();
        });
        
        // Theme selector events will be bound after theme selector is created
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'p':
                        e.preventDefault();
                        this.handlePrint();
                        break;
                    case 't':
                        e.preventDefault();
                        this.toggleTOC();
                        break;
                }
            } else if (e.key === 'F11') {
                e.preventDefault();
                this.toggleToolbar();
            } else if (e.key === 'Escape' && this.isToolbarHidden()) {
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
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleThemeDropdown();
        });
        
        dropdown.addEventListener('click', (e) => {
            if (e.target.closest('.theme-option')) {
                const themeKey = e.target.closest('.theme-option').dataset.theme;
                this.selectTheme(themeKey);
            }
            
            if (e.target.classList.contains('auto-theme-button')) {
                this.toggleAutoTheme();
            }
        });
        
        document.addEventListener('click', (e) => {
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
    
    toggleAutoTheme() {
        const currentTheme = this.themeManager.currentTheme;
        const newTheme = currentTheme === 'auto' ? 'light' : 'auto';
        this.selectTheme(newTheme);
    }
    
    updateThemeDisplay(themeName) {
        const themeNameElement = this.toolbarElement.querySelector('.theme-name');
        const themeNames = {
            'light': 'Light',
            'dark': 'Dark',
            'sepia': 'Sepia',
            'auto': '自動'
        };
        
        themeNameElement.textContent = themeNames[themeName] || themeName;
        
        // Update active state
        this.toolbarElement.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === themeName);
        });
        
        // Update auto button
        const autoButton = this.toolbarElement.querySelector('.auto-theme-button');
        autoButton.classList.toggle('active', themeName === 'auto');
    }
    
    toggleTOC() {
        if (!this.tocGenerator) return;
        
        const tocPanel = document.querySelector('.toc-panel');
        if (tocPanel) {
            const isVisible = tocPanel.style.display !== 'none';
            tocPanel.style.display = isVisible ? 'none' : 'block';
            
            // Update content margin
            const content = document.querySelector('#markdown-content') || document.body;
            if (isVisible) {
                content.style.marginLeft = '';
            } else {
                content.style.marginLeft = 'calc(250px + 20px)';
            }
            
            // Update button state
            const tocBtn = this.toolbarElement.querySelector('#toggle-toc-btn');
            tocBtn.classList.toggle('active', !isVisible);
        }
    }
    
    handlePrint() {
        // Apply print-specific styles
        this.addPrintStyles();
        
        // Hide toolbar and TOC for printing
        const toolbar = this.toolbarElement;
        const toc = document.querySelector('.toc-panel');
        const searchPanel = document.querySelector('.search-panel');
        
        const originalDisplay = {
            toolbar: toolbar.style.display,
            toc: toc ? toc.style.display : null,
            searchPanel: searchPanel ? searchPanel.style.display : null
        };
        
        toolbar.style.display = 'none';
        if (toc) toc.style.display = 'none';
        if (searchPanel) searchPanel.style.display = 'none';
        
        // Print
        window.print();
        
        // Restore visibility
        setTimeout(() => {
            toolbar.style.display = originalDisplay.toolbar;
            if (toc) toc.style.display = originalDisplay.toc;
            if (searchPanel) searchPanel.style.display = originalDisplay.searchPanel;
        }, 1000);
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
                                    <tr><td>Ctrl+P</td><td>印刷</td></tr>
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
                modal.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
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
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || 
                e.target.classList.contains('modal-close')) {
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
        this.showButtonElement.title = 'ツールバーを表示 (F11 または Esc) - ドラッグで移動可能';
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
        
        this.showButtonElement.addEventListener('click', (e) => {
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
        
        dragTrigger.addEventListener('mousedown', (e) => {
            // ツールバーの場合、ボタンクリックは無視
            if (isToolbar && (e.target.tagName === 'BUTTON' || e.target.closest('button'))) {
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
        
        const handleMouseMove = (e) => {
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
                const newLeft = Math.max(0, Math.min(window.innerWidth - elementWidth, startLeft + deltaX));
                const newTop = Math.max(0, Math.min(window.innerHeight - elementHeight, startTop + deltaY));
                
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
        localStorage.setItem('toolbar-position', JSON.stringify({ left, top }));
    }
    
    restoreToolbarPosition() {
        const saved = localStorage.getItem('toolbar-position');
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
        const toolbarRect = this.toolbarElement.getBoundingClientRect();
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
            this.saveToolbarPosition(toolbarLeft, parseInt(this.showButtonElement.style.top));
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
        hint.innerHTML = '📌 ツールバーが隠れています。<kbd>F11</kbd> または <kbd>Esc</kbd> で表示';
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
}

// Ensure class is available globally
window.Toolbar = Toolbar;