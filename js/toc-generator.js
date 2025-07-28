/**
 * TOC Generator Class
 * Automatically generates table of contents from headings
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
                <button class="toc-toggle" title="折りたたみ">−</button>
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
        
        switch (this.options.position) {
            case 'left':
                content.style.marginLeft = `calc(${this.options.width} + 20px)`;
                break;
            case 'right':
                content.style.marginRight = `calc(${this.options.width} + 20px)`;
                break;
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
            
            if (e.target.classList.contains('toc-toggle')) {
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
        button.textContent = isExpanded ? '▶' : '▼';
        sublist.style.display = isExpanded ? 'none' : 'block';
    }
    
    toggleTOC() {
        const content = this.tocElement.querySelector('.toc-content');
        const toggle = this.tocElement.querySelector('.toc-toggle');
        const isCollapsed = content.style.display === 'none';
        
        content.style.display = isCollapsed ? 'block' : 'none';
        toggle.textContent = isCollapsed ? '−' : '+';
        
        if (!isCollapsed) {
            this.tocElement.style.width = '40px';
        } else {
            this.tocElement.style.width = this.options.width;
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