/**
 * Theme Manager Class
 * Manages theme switching and CSS variables
 */
class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.currentTheme = 'light';
        this.customCSS = '';
        this.systemThemeQuery = null;
        this.observers = new Set();
        
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.registerDefaultThemes();
        this.setupSystemThemeDetection();
        this.applyTheme(this.currentTheme);
    }
    
    async loadSettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get(['theme', 'customCSS']);
                this.currentTheme = result.theme || 'light';
                this.customCSS = result.customCSS || '';
            } else {
                const theme = localStorage.getItem('markdown-viewer-theme') || 'light';
                const customCSS = localStorage.getItem('markdown-viewer-custom-css') || '';
                this.currentTheme = theme;
                this.customCSS = customCSS;
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
                '--toc-active-color': '#ffffff'
            },
            mermaidTheme: 'default'
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
                '--toc-active-color': '#ffffff'
            },
            mermaidTheme: 'dark'
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
                '--toc-active-color': '#ffffff'
            },
            mermaidTheme: 'base'
        });
    }
    
    registerTheme(name, config) {
        this.themes.set(name, {
            name: config.name || name,
            variables: config.variables || {},
            mermaidTheme: config.mermaidTheme || 'default',
            customCSS: config.customCSS || '',
            ...config
        });
    }
    
    setupSystemThemeDetection() {
        this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemThemeQuery.addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        });
    }
    
    async applyTheme(themeName) {
        let actualTheme = themeName;
        
        if (themeName === 'auto') {
            actualTheme = this.detectSystemTheme();
        }
        
        const theme = this.themes.get(actualTheme);
        if (!theme) {
            console.warn(`Theme "${actualTheme}" not found`);
            return;
        }
        
        this.applyCSSVariables(theme.variables);
        this.applyCustomCSS(theme.customCSS);
        await this.applyMermaidTheme(theme.mermaidTheme);
        
        document.documentElement.setAttribute('data-theme', actualTheme);
        
        this.currentTheme = themeName;
        await this.saveSettings();
        
        this.notifyObservers('themeChanged', { theme: actualTheme, config: theme });
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
                    htmlLabels: true
                }
            });
            
            await this.rerenderMermaidDiagrams();
        }
    }
    
    async rerenderMermaidDiagrams() {
        const mermaidElements = document.querySelectorAll('.mermaid');
        
        for (const element of mermaidElements) {
            try {
                const originalCode = element.dataset.mermaidCode || element.textContent;
                
                if (originalCode) {
                    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, originalCode);
                    element.innerHTML = svg;
                }
            } catch (error) {
                console.error('Failed to re-render mermaid diagram:', error);
            }
        }
    }
    
    detectSystemTheme() {
        return this.systemThemeQuery?.matches ? 'dark' : 'light';
    }
    
    getAvailableThemes() {
        return Array.from(this.themes.entries()).map(([key, theme]) => ({
            key,
            name: theme.name,
            preview: this.generateThemePreview(theme)
        }));
    }
    
    generateThemePreview(theme) {
        return {
            backgroundColor: theme.variables['--bg-color'],
            textColor: theme.variables['--text-color'],
            headingColor: theme.variables['--heading-color'],
            linkColor: theme.variables['--link-color']
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
                    customCSS: this.customCSS
                });
            } else {
                localStorage.setItem('markdown-viewer-theme', this.currentTheme);
                localStorage.setItem('markdown-viewer-custom-css', this.customCSS);
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
            this.systemThemeQuery.removeEventListener('change', this.handleSystemThemeChange);
        }
        
        this.observers.clear();
    }
}

// Ensure class is available globally
window.ThemeManager = ThemeManager;