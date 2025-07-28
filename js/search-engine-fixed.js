/**
 * 修正版検索エンジン - シンプルで堅牢な実装
 */
class SearchEngine {
    constructor(container) {
        this.container = container || document;
        this.searchPanelElement = null;
        this.isVisible = false;
        this.currentQuery = '';
        this.currentResults = [];
        this.currentIndex = 0;
        
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
        
        input.addEventListener('input', () => {
            this.performSearch(input.value);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.navigateResults('prev');
                } else {
                    this.navigateResults('next');
                }
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });
        
        prevBtn.addEventListener('click', () => this.navigateResults('prev'));
        nextBtn.addEventListener('click', () => this.navigateResults('next'));
        closeBtn.addEventListener('click', () => this.hide());
        
        // オプション変更時の再検索
        const options = this.searchPanelElement.querySelectorAll('.search-options input[type="checkbox"]');
        options.forEach(option => {
            option.addEventListener('change', () => {
                if (this.currentQuery) {
                    this.performSearch(this.currentQuery);
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
        
        console.log('Performing search for:', query);
        
        // シンプルな文字列検索（DOM書き換えなし）
        const contentContainer = document.querySelector('#markdown-content') || document.body;
        const textContent = contentContainer.textContent || contentContainer.innerText;
        
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
        
        // マッチ箇所を検索
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
        
        // 簡易ハイライト表示（CSS Highlights API またはシンプルな方法）
        this.highlightMatches(query, searchRegex);
        this.updateStatus();
        
        if (this.currentResults.length > 0) {
            this.currentIndex = 0;
            this.scrollToMatch(0);
        }
    }
    
    highlightMatches(query, regex) {
        // 既存のハイライトをクリア
        this.clearHighlights();
        
        // CSS Highlights API が利用可能な場合
        if ('CSS' in window && 'highlights' in window.CSS) {
            try {
                const range = new Range();
                const selection = window.getSelection();
                const highlights = [];
                
                // 簡易実装: selection API を使用
                const contentContainer = document.querySelector('#markdown-content') || document.body;
                const walker = document.createTreeWalker(
                    contentContainer,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent;
                    const matches = [...text.matchAll(regex)];
                    
                    matches.forEach(match => {
                        try {
                            const span = document.createElement('span');
                            span.className = 'search-highlight';
                            span.textContent = match[0];
                            
                            const range = document.createRange();
                            range.setStart(node, match.index);
                            range.setEnd(node, match.index + match[0].length);
                            
                            // 安全に範囲を囲む
                            try {
                                range.surroundContents(span);
                                highlights.push(span);
                            } catch (e) {
                                // 範囲が複数の要素にまたがる場合はスキップ
                                console.warn('Could not highlight match:', e);
                            }
                        } catch (e) {
                            console.warn('Highlight error:', e);
                        }
                    });
                }
                
                return;
            } catch (error) {
                console.warn('CSS Highlights not available, using fallback');
            }
        }
        
        // フォールバック: Mark.js風の実装
        this.highlightWithMarkJS(query, regex);
    }
    
    highlightWithMarkJS(query, regex) {
        const contentContainer = document.querySelector('#markdown-content') || document.body;
        const html = contentContainer.innerHTML;
        
        // シンプルな置換ベースのハイライト
        const highlightedHTML = html.replace(regex, (match) => {
            return `<span class="search-highlight">${match}</span>`;
        });
        
        if (html !== highlightedHTML) {
            contentContainer.innerHTML = highlightedHTML;
            
            // アクティブなハイライトを設定
            const highlights = contentContainer.querySelectorAll('.search-highlight');
            if (highlights.length > 0) {
                highlights[0].classList.add('search-highlight-active');
            }
        }
    }
    
    clearHighlights() {
        // 既存のハイライトを削除
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                parent.normalize();
            }
        });
    }
    
    scrollToMatch(index) {
        const highlights = document.querySelectorAll('.search-highlight');
        if (highlights[index]) {
            // 前のアクティブを削除
            document.querySelectorAll('.search-highlight-active').forEach(el => {
                el.classList.remove('search-highlight-active');
            });
            
            // 新しいアクティブを設定
            highlights[index].classList.add('search-highlight-active');
            highlights[index].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    navigateResults(direction) {
        if (this.currentResults.length === 0) return;
        
        if (direction === 'next') {
            this.currentIndex = (this.currentIndex + 1) % this.currentResults.length;
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.currentResults.length) % this.currentResults.length;
        }
        
        this.scrollToMatch(this.currentIndex);
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
    
    show() {
        this.searchPanelElement.style.display = 'block';
        this.isVisible = true;
        
        const input = this.searchPanelElement.querySelector('.search-input');
        input.focus();
        input.select();
    }
    
    hide() {
        this.searchPanelElement.style.display = 'none';
        this.isVisible = false;
        this.clearHighlights();
        this.currentResults = [];
        this.currentIndex = 0;
        this.currentQuery = '';
        this.updateStatus();
    }
    
    destroy() {
        this.clearHighlights();
        if (this.searchPanelElement) {
            this.searchPanelElement.remove();
        }
    }
}