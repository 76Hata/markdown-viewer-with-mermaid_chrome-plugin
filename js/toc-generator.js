/**
 * @fileoverview 目次生成クラス - Markdown Viewerの目次自動生成機能を提供
 * 
 * このファイルは、Chrome拡張機能「Markdown Viewer with Mermaid」の目次生成機能を実装します。
 * 見出しから階層構造を持つ目次を自動生成し、ナビゲーション機能を提供します。
 * 
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 */

/**
 * 目次生成クラス
 * Markdownの見出しから目次を自動生成し、ナビゲーション機能を提供します
 * 
 * @class TOCGenerator
 * @description このクラスは以下の機能を提供します：
 * - 見出し（h1-h6）からの目次自動生成
 * - 階層構造を持つ目次の作成
 * - 目次項目クリックによるスムーズスクロール
 * - 現在の位置のハイライト表示
 * - 折りたたみ可能な目次パネル
 * - 目次の表示/非表示切り替え
 * - レスポンシブデザイン対応
 * 
 * @example
 * // 目次生成器を初期化
 * const tocGenerator = new TOCGenerator();
 * 
 * // オプション付きで初期化
 * const tocGenerator = new TOCGenerator({
 *     maxDepth: 4,
 *     includeNumbers: true
 * });
 * 
 * @author 76Hata
 * @since 1.0.0
 */
class TOCGenerator {
    constructor(options = {}) {
        this.options = {
            maxDepth: 6,
            minDepth: 1,
            includeNumbers: false,
            smoothScroll: true,
            autoCollapse: false,
            position: 'left',
            width: '250px',
            ...options
        };
        
        this.headings = [];
        this.tocElement = null;
        this.activeHeading = null;
        this.observer = null;
        this.isCollapsed = false;
        this.floatingButton = null;
        
        this.init();
    }
    
    init() {
        this.extractHeadings();
        this.createTOCStructure();
        this.renderTOC();
        this.setupScrollSpy();
        this.bindEvents();
    }
    
    extractHeadings() {
        const container = document.querySelector('#markdown-content, body');
        const selector = this.generateHeadingSelector();
        const headingElements = container.querySelectorAll(selector);
        
        this.headings = Array.from(headingElements).map((element, index) => {
            if (!element.id) {
                element.id = this.generateHeadingId(element.textContent, index);
            }
            
            return {
                id: element.id,
                level: parseInt(element.tagName.charAt(1)),
                text: element.textContent.trim(),
                element: element,
                children: [],
                parent: null,
                index: index
            };
        });
        
        this.buildHierarchy();
    }
    
    generateHeadingSelector() {
        const levels = [];
        for (let i = this.options.minDepth; i <= this.options.maxDepth; i++) {
            levels.push(`h${i}`);
        }
        return levels.join(', ');
    }
    
    generateHeadingId(text, index) {
        const slug = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
        
        return slug || `heading-${index}`;
    }
    
    buildHierarchy() {
        const stack = [];
        
        this.headings.forEach(heading => {
            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }
            
            if (stack.length > 0) {
                const parent = stack[stack.length - 1];
                heading.parent = parent;
                parent.children.push(heading);
            }
            
            stack.push(heading);
        });
    }
    
    createTOCStructure() {
        this.tocElement = document.createElement('div');
        this.tocElement.className = 'toc-panel';
        this.tocElement.innerHTML = `
            <div class="toc-header">
                <h3>目次</h3>
                <button class="toc-toggle" title="目次を折りたたむ" aria-label="目次を折りたたむ">
                    <svg class="toc-toggle-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>
            </div>
            <div class="toc-content">
                <nav class="toc-nav" role="navigation" aria-label="目次">
                    ${this.generateTOCHTML()}
                </nav>
            </div>
        `;
    }
    
    generateTOCHTML() {
        const rootHeadings = this.headings.filter(h => !h.parent);
        return `<ul class="toc-list">${this.generateHeadingHTML(rootHeadings)}</ul>`;
    }
    
    generateHeadingHTML(headings) {
        return headings.map(heading => {
            const hasChildren = heading.children.length > 0;
            const childrenHTML = hasChildren ? 
                `<ul class="toc-sublist">${this.generateHeadingHTML(heading.children)}</ul>` : '';
            
            const numberPrefix = this.options.includeNumbers ? 
                `<span class="toc-number">${this.getHeadingNumber(heading)}</span>` : '';
            
            return `
                <li class="toc-item" data-level="${heading.level}">
                    ${hasChildren ? '<button class="toc-expand" aria-expanded="true">▼</button>' : ''}
                    <a href="#${heading.id}" class="toc-link" data-heading-id="${heading.id}">
                        ${numberPrefix}
                        <span class="toc-text">${this.escapeHTML(heading.text)}</span>
                    </a>
                    ${childrenHTML}
                </li>
            `;
        }).join('');
    }
    
    getHeadingNumber(heading) {
        const getNumber = (h, numbers = []) => {
            if (h.parent) {
                getNumber(h.parent, numbers);
            }
            const siblings = h.parent ? h.parent.children : this.headings.filter(h => !h.parent);
            numbers.push(siblings.indexOf(h) + 1);
            return numbers;
        };
        
        return getNumber(heading).join('.');
    }
    
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    renderTOC() {
        const existingTOC = document.querySelector('.toc-panel');
        if (existingTOC) {
            existingTOC.remove();
        }
        
        document.body.appendChild(this.tocElement);
        this.adjustTOCPosition();
        this.adjustContentMargin();
    }
    
    adjustTOCPosition() {
        const toc = this.tocElement;
        
        switch (this.options.position) {
            case 'left':
                toc.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: ${this.options.width};
                    height: 100vh;
                    z-index: 1000;
                `;
                break;
            case 'right':
                toc.style.cssText = `
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: ${this.options.width};
                    height: 100vh;
                    z-index: 1000;
                `;
                break;
        }
    }
    
    adjustContentMargin() {
        const content = document.querySelector('#markdown-content') || document.body;
        
        if (this.isCollapsed) {
            // 折りたたまれている場合はマージンをリセット
            content.style.marginLeft = '20px';
            content.style.marginRight = '20px';
        } else {
            // 展開されている場合は通常のマージン
            switch (this.options.position) {
                case 'left':
                    content.style.marginLeft = `calc(${this.options.width} + 20px)`;
                    content.style.marginRight = '20px';
                    break;
                case 'right':
                    content.style.marginLeft = '20px';
                    content.style.marginRight = `calc(${this.options.width} + 20px)`;
                    break;
            }
        }
    }
    
    setupScrollSpy() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveHeading(entry.target.id);
                }
            });
        }, options);
        
        this.headings.forEach(heading => {
            this.observer.observe(heading.element);
        });
    }
    
    setActiveHeading(headingId) {
        const prevActive = this.tocElement.querySelector('.toc-link.active');
        if (prevActive) {
            prevActive.classList.remove('active');
        }
        
        const newActive = this.tocElement.querySelector(`[data-heading-id="${headingId}"]`);
        if (newActive) {
            newActive.classList.add('active');
            this.activeHeading = headingId;
            this.scrollTOCToActive(newActive);
        }
    }
    
    scrollTOCToActive(activeElement) {
        const tocContent = this.tocElement.querySelector('.toc-content');
        const elementTop = activeElement.offsetTop;
        const containerHeight = tocContent.clientHeight;
        const scrollTop = elementTop - containerHeight / 2;
        
        tocContent.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }
    
    bindEvents() {
        this.tocElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('toc-link')) {
                e.preventDefault();
                const headingId = e.target.dataset.headingId;
                this.scrollToHeading(headingId);
            }
            
            if (e.target.classList.contains('toc-expand')) {
                this.toggleSublist(e.target);
            }
            
            // Handle toggle button click (including SVG child elements)
            const toggleButton = e.target.closest('.toc-toggle');
            if (toggleButton) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTOC();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        this.navigateToHeading('prev');
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.navigateToHeading('next');
                        break;
                }
            }
        });
    }
    
    scrollToHeading(headingId) {
        const heading = document.getElementById(headingId);
        if (!heading) return;
        
        // 右側ツールバーなので、上部オフセットのみ考慮
        const baseOffset = 100; // 十分な上部余白
        const targetPosition = heading.offsetTop - baseOffset;
        
        if (this.options.smoothScroll) {
            // より確実なスムーススクロール実装
            this.smoothScrollTo(targetPosition);
        } else {
            window.scrollTo(0, targetPosition);
        }
        
        // 見出しにフォーカスを当てる
        setTimeout(() => {
            heading.focus();
        }, this.options.smoothScroll ? 800 : 0);
    }
    
    smoothScrollTo(targetY) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const duration = 600; // ミリ秒
        let startTime = null;
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // easeInOutCubic イージング関数
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            window.scrollTo(0, startY + distance * easeProgress);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    }
    
    toggleSublist(button) {
        const sublist = button.parentElement.querySelector('.toc-sublist');
        if (!sublist) return;
        
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        button.setAttribute('aria-expanded', !isExpanded);
        // 開く時も閉じる時も同じ位置に表示するために、アイコンの位置を統一
        if (isExpanded) {
            button.innerHTML = '▶'; // 閉じる時（展開時→折りたたみ時）
            sublist.style.display = 'none';
        } else {
            button.innerHTML = '▼'; // 開く時（折りたたみ時→展開時） 
            sublist.style.display = 'block';
        }
    }
    
    toggleTOC() {
        try {
            
            if (!this.tocElement) {
                console.error('TOC element not found');
                return;
            }
            
            const content = this.tocElement.querySelector('.toc-content');
            const toggle = this.tocElement.querySelector('.toc-toggle');
            const icon = toggle ? toggle.querySelector('.toc-toggle-icon') : null;
            const headerElement = this.tocElement.querySelector('.toc-header');
            const headerTitle = headerElement ? headerElement.querySelector('h3') : null;
            
            if (!content || !toggle || !icon || !headerElement || !headerTitle) {
                console.error('TOC elements not found:', { 
                    content: !!content, 
                    toggle: !!toggle, 
                    icon: !!icon, 
                    headerElement: !!headerElement,
                    headerTitle: !!headerTitle
                });
                return;
            }
            
            this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            // 折りたたむ - サイドバーを完全に非表示
            this.tocElement.style.display = 'none';
            this.showFloatingButton();
            
        } else {
            // 展開する
            this.tocElement.style.display = 'block';
            this.hideFloatingButton();
            content.style.display = 'block';
            this.tocElement.style.width = this.options.width;
            this.tocElement.classList.remove('collapsed');
            
            // アイコンを閉じる形（左向き矢印）に変更
            icon.innerHTML = `<path d="M15 18l-6-6 6-6"/>`;
            toggle.title = '目次を折りたたむ';
            toggle.setAttribute('aria-label', '目次を折りたたむ');
        }
        
        // コンテンツのマージンを調整
        this.adjustContentMargin();
        
        } catch (error) {
            console.error('Error in toggleTOC:', error);
        }
    }
    
    showFloatingButton() {
        // フローティングボタンが既に存在する場合は削除
        this.hideFloatingButton();
        
        // フローティングボタンを作成
        this.floatingButton = document.createElement('button');
        this.floatingButton.className = 'toc-floating-button';
        this.floatingButton.title = '目次を表示';
        this.floatingButton.setAttribute('aria-label', '目次を表示');
        this.floatingButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
            </svg>
        `;
        
        // クリックイベントを追加
        this.floatingButton.addEventListener('click', () => {
            this.toggleTOC();
        });
        
        // ドキュメントに追加
        document.body.appendChild(this.floatingButton);
    }
    
    hideFloatingButton() {
        if (this.floatingButton && this.floatingButton.parentNode) {
            this.floatingButton.parentNode.removeChild(this.floatingButton);
            this.floatingButton = null;
        }
    }
    
    navigateToHeading(direction) {
        if (!this.activeHeading) return;
        
        const currentIndex = this.headings.findIndex(h => h.id === this.activeHeading);
        if (currentIndex === -1) return;
        
        let targetIndex;
        if (direction === 'prev') {
            targetIndex = Math.max(0, currentIndex - 1);
        } else {
            targetIndex = Math.min(this.headings.length - 1, currentIndex + 1);
        }
        
        const targetHeading = this.headings[targetIndex];
        this.scrollToHeading(targetHeading.id);
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        if (this.tocElement) {
            this.tocElement.remove();
        }
        
        const content = document.querySelector('#markdown-content') || document.body;
        content.style.marginLeft = '';
        content.style.marginRight = '';
        content.style.marginTop = '';
    }
}

// Ensure class is available globally
window.TOCGenerator = TOCGenerator;