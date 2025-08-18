// Global type definitions for Markdown Viewer Chrome Extension

declare global {
  // External Libraries
  interface Window {
    marked: typeof import('marked');
    mermaid: any;
    jsPDF: any;
    html2canvas: any;

    // Custom classes
    TOCGenerator: any;
    ThemeManager: any;
    SearchEngine: any;
    Toolbar: any;

    // Test utilities (for testing environment)
    createMockElement?: (
      tagName: string,
      attributes?: Record<string, string>
    ) => HTMLElement;
    createMarkdownDocument?: (content: string) => void;
  }

  // Chrome Extension Storage Data Types
  interface ChromeStorageData {
    theme?: ThemeSettings;
    toc?: TOCSettings;
    search?: SearchSettings;
    toolbar?: ToolbarSettings;
  }

  interface ThemeSettings {
    current: 'light' | 'dark' | 'sepia' | 'auto';
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    customCSS: string;
  }

  interface TOCSettings {
    enabled: boolean;
    position: 'left' | 'right';
    width: string;
    maxDepth: number;
    minDepth: number;
    includeNumbers: boolean;
    autoCollapse: boolean;
    smoothScroll: boolean;
  }

  interface SearchSettings {
    caseSensitive: boolean;
    regexEnabled: boolean;
    highlightColor: string;
    maxResults: number;
  }

  interface ToolbarSettings {
    position: 'top' | 'bottom';
    sticky: boolean;
    showExportButtons: boolean;
    showSearchButton: boolean;
    showThemeButton: boolean;
    showTOCButton: boolean;
  }

  // File Access Types
  interface FileAccessChecker {
    hasFileAccess(): boolean;
    showFileAccessDialog(): void;
  }

  // Library Loader Types
  interface LibraryLoader {
    mermaidLoaded: boolean;
    exportLibrariesLoaded: boolean;
    loadMermaid(): Promise<boolean>;
    loadExportLibraries(): Promise<boolean>;
  }

  // Performance Metrics
  interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    tocGenerationTime?: number;
    searchIndexTime?: number;
  }

  // Error Types
  interface ExtensionError extends Error {
    code: string;
    context: string;
    timestamp: Date;
  }
}

export {};
