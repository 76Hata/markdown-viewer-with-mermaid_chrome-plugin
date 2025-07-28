/**
 * 完全安全版検索エンジン - DOM破壊を防ぐ
 */
class SearchEngine {
    constructor(container) {
        this.container = container || document;
        this.searchPanelElement = null;
        this.isVisible = false;
        this.currentQuery = '';
        this.currentResults = [];
        this.currentIndex = 0;
        this.originalHTML = ''; // 元のHTMLを保存
        
        this.init();
    }
    
    init() {
        this.createSearchPanel();
        this.bindEvents();
    }
    
    createSearchPanel() {
        this.searchPanelElement = document.createElement('div');
        this.searchPanelElement.className = 'search-panel';
        this.searchPanelElement.innerHTML = `
            <div class="search-header">
                <input type="text" class="search-input" placeholder="検索..." />
                <div class="search-controls">
                    <button class="search-btn search-prev" title="前の結果">↑</button>
                    <button class="search-btn search-next" title="次の結果">↓</button>
                    <span class="search-status">0/0</span>
                    <button class="search-btn search-close" title="閉じる">×</button>
                </div>
            </div>
            <div class="search-options">
                <label><input type="checkbox" class="search-case-sensitive"> 大文字小文字を区別</label>
                <label><input type="checkbox" class="search-regex"> 正規表現</label>
                <label><input type="checkbox" class="search-whole-word"> 完全一致</label>
            </div>
        `;
        
        this.searchPanelElement.style.display = 'none';
        document.body.appendChild(this.searchPanelElement);
    }
    
    bindEvents() {
        const input = this.searchPanelElement.querySelector('.search-input');
        const prevBtn = this.searchPanelElement.querySelector('.search-prev');
        const nextBtn = this.searchPanelElement.querySelector('.search-next');
        const closeBtn = this.searchPanelElement.querySelector('.search-close');
        
        // 安全なイベントハンドラー
        input.addEventListener('input', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                this.performSearch(e.target.value);
            } catch (error) {
                console.error('Search input error:', error);
                this.safeResetSearch();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            e.stopPropagation(); // 重要: イベントの伝播を停止
            
            if (e.key === 'Enter') {
                e.preventDefault();
                try {
                    if (e.shiftKey) {
                        this.navigateResults('prev');
                    } else {
                        this.navigateResults('next');
                    }
                } catch (error) {
                    console.error('Navigation error:', error);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hide();
            }
        });
        
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateResults('prev');
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.navigateResults('next');
        });
        
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        });
        
        // オプション変更時の再検索
        const options = this.searchPanelElement.querySelectorAll('.search-options input[type="checkbox"]');
        options.forEach(option => {
            option.addEventListener('change', (e) => {
                e.stopPropagation();
                try {
                    if (this.currentQuery) {
                        this.performSearch(this.currentQuery);
                    }
                } catch (error) {
                    console.error('Options change error:', error);
                }
            });
        });
        
        // Ctrl+F ショートカット
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.show();
            }
        });
    }
    
    performSearch(query) {
        this.currentQuery = query;
        this.clearHighlights();
        this.currentResults = [];
        this.currentIndex = 0;
        
        if (!query.trim()) {
            this.updateStatus();
            return;
        }
        
        console.log('Performing safe search for:', query);
        
        // 元のHTMLを保存（初回のみ）
        const contentContainer = document.querySelector('#markdown-content') || document.body;
        if (!this.originalHTML) {
            this.originalHTML = contentContainer.innerHTML;
        }
        
        // 安全な検索実行
        try {
            this.safeSearch(query, contentContainer);
        } catch (error) {
            console.error('Search error:', error);
            this.safeResetSearch();
        }
    }
    
    safeSearch(query, container) {
        const textContent = container.textContent || container.innerText;
        const options = this.getSearchOptions();
        const flags = options.caseSensitive ? 'g' : 'gi';
        let searchRegex;
        
        try {
            if (options.regex) {
                searchRegex = new RegExp(query, flags);
            } else {
                const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = options.wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
                searchRegex = new RegExp(pattern, flags);
            }
        } catch (error) {
            console.warn('Invalid search pattern:', error);
            this.updateStatus();
            return;
        }
        
        // マッチ箇所を検索（テキストコンテンツのみ）
        let match;
        while ((match = searchRegex.exec(textContent)) !== null) {
            this.currentResults.push({
                text: match[0],
                index: match.index,
                length: match[0].length
            });
            
            if (!searchRegex.global) break;
        }
        
        console.log(`Found ${this.currentResults.length} matches`);
        
        // 安全なハイライト表示
        if (this.currentResults.length > 0) {
            this.safeHighlight(query, searchRegex, container);
            this.currentIndex = 0;
            this.scrollToFirstMatch();
        }
        
        this.updateStatus();
    }
    
    safeHighlight(query, regex, container) {
        try {
            // HTMLタグを避けてテキストのみハイライト
            // シンプルな置換で安全に実装
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.originalHTML;
            
            this.highlightTextNodes(tempDiv, regex);
            
            container.innerHTML = tempDiv.innerHTML;
            
        } catch (error) {
            console.error('Highlight error:', error);
            // エラー時は元に戻す
            container.innerHTML = this.originalHTML;
        }
    }
    
    highlightTextNodes(element, regex) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent || parent.tagName === 'SCRIPT' || 
                        parent.tagName === 'STYLE' ||
                        parent.classList.contains('search-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const nodesToProcess = [];
        let node;
        while (node = walker.nextNode()) {
            if (regex.test(node.textContent)) {
                nodesToProcess.push(node);
            }
        }
        
        // 逆順で処理してインデックスのずれを防ぐ
        nodesToProcess.reverse().forEach(textNode => {
            try {
                const parent = textNode.parentElement;
                if (!parent) return;
                
                const text = textNode.textContent;
                const highlightedText = text.replace(regex, (match) => {
                    return `<span class="search-highlight">${match}</span>`;
                });
                
                if (text !== highlightedText) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = highlightedText;
                    
                    // 子ノードを移動
                    while (tempDiv.firstChild) {
                        parent.insertBefore(tempDiv.firstChild, textNode);
                    }
                    parent.removeChild(textNode);
                }
            } catch (error) {
                console.warn('Text node highlight error:', error);
            }
        });
    }
    
    clearHighlights() {
        // 安全なクリーンアップ
        const container = document.querySelector('#markdown-content') || document.body;
        if (this.originalHTML) {
            try {
                container.innerHTML = this.originalHTML;
            } catch (error) {
                console.error('Clear highlights error:', error);
            }
        }
    }
    
    scrollToFirstMatch() {
        setTimeout(() => {
            const firstHighlight = document.querySelector('.search-highlight');
            if (firstHighlight) {
                firstHighlight.classList.add('search-highlight-active');
                firstHighlight.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);
    }
    
    navigateResults(direction) {
        if (this.currentResults.length === 0) return;
        
        // 現在のアクティブを削除
        document.querySelectorAll('.search-highlight-active').forEach(el => {
            el.classList.remove('search-highlight-active');
        });
        
        if (direction === 'next') {
            this.currentIndex = (this.currentIndex + 1) % this.currentResults.length;
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.currentResults.length) % this.currentResults.length;
        }
        
        const highlights = document.querySelectorAll('.search-highlight');
        if (highlights[this.currentIndex]) {
            highlights[this.currentIndex].classList.add('search-highlight-active');
            highlights[this.currentIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
        
        this.updateStatus();
    }
    
    updateStatus() {
        const status = this.searchPanelElement.querySelector('.search-status');
        if (this.currentResults.length === 0) {
            status.textContent = '0/0';
        } else {
            status.textContent = `${this.currentIndex + 1}/${this.currentResults.length}`;
        }
    }
    
    getSearchOptions() {
        const panel = this.searchPanelElement;
        return {
            caseSensitive: panel.querySelector('.search-case-sensitive').checked,
            regex: panel.querySelector('.search-regex').checked,
            wholeWord: panel.querySelector('.search-whole-word').checked
        };
    }
    
    safeResetSearch() {
        try {
            this.clearHighlights();
            this.currentResults = [];
            this.currentIndex = 0;
            this.currentQuery = '';
            this.updateStatus();
            
            // 入力フィールドをクリア
            const input = this.searchPanelElement.querySelector('.search-input');
            if (input) {
                input.value = '';
            }
        } catch (error) {
            console.error('Reset error:', error);
        }
    }
    
    show() {
        this.searchPanelElement.style.display = 'block';
        this.isVisible = true;
        
        // 元のHTMLを保存
        const contentContainer = document.querySelector('#markdown-content') || document.body;
        this.originalHTML = contentContainer.innerHTML;
        
        const input = this.searchPanelElement.querySelector('.search-input');
        setTimeout(() => {
            input.focus();
            input.select();
        }, 50);
    }
    
    hide() {
        this.searchPanelElement.style.display = 'none';
        this.isVisible = false;
        this.clearHighlights();
        this.safeResetSearch();
    }
    
    destroy() {
        this.clearHighlights();
        if (this.searchPanelElement) {
            this.searchPanelElement.remove();
        }
    }
}