// Global type declarations for Chrome Extension

declare global {
  interface Window {
    TIMEOUTS: {
      SHORT_DELAY: number;
      STANDARD_DELAY: number;
      LONG_DELAY: number;
      VERY_LONG_DELAY: number;
      NETWORK_TIMEOUT: number;
      MAX_TIMEOUT: number;
      HEAVY_PROCESS_TIMEOUT: number;
      NOTIFICATION_DURATION: number;
      DEBOUNCE_SHORT: number;
      DEBOUNCE_STANDARD: number;
      FILE_ACCESS_CHECK_INTERVAL: number;
    };
    SIZES: {
      SMALL: number;
      MEDIUM: number;
      LARGE: number;
      MAX_SEARCH_RESULTS: number;
      MAX_TOC_ITEMS: number;
      ANIMATION_OFFSET: number;
      SCROLL_OFFSET: number;
      MARGIN_SMALL: number;
      MARGIN_MEDIUM: number;
      MARGIN_LARGE: number;
      MARGIN_XLARGE: number;
      FONT_SMALL: number;
      FONT_MEDIUM: number;
      FONT_LARGE: number;
      FONT_XLARGE: number;
    };
    FileAccessChecker: {
      checkFileAccess(): void;
      isFileProtocol(): boolean;
      needsFileAccess(): boolean;
    };
    SafeStorage: {
      setItem(
        key: string,
        value: string,
        callback?: (success: boolean) => void
      ): void;
      getItem(key: string, callback: (value: string | null) => void): void;
    };
    LibraryLoader: any;
    Toolbar: new (container: Element) => any;
    SearchEngine: new (container: Element) => any;
    ThemeManager: new () => any;
    TOCGenerator: new (container: Element) => any;
    markdownViewerToolbar: any;
    tryBlobDownload: (htmlContent: string) => Promise<boolean>;
    tryDataURLDownload: (htmlContent: string) => Promise<boolean>;
    tryNewWindow: (htmlContent: string, modal?: boolean) => Promise<boolean>;
    tryClipboard: (htmlContent: string) => Promise<boolean>;
    tryModal: (htmlContent: string, showPreview?: boolean) => Promise<boolean>;
    tryExportMethods: (
      htmlContent: string,
      methods: string[],
      index: number
    ) => void;
    tryLegacyClipboard: (htmlContent: string) => Promise<boolean>;
    testFunctions: {
      testWelcomeNotification(): void;
      testSetupGuide(): void;
      testBadge(): void;
      clearBadge(): void;
      simulateInstall(): void;
      testCipherInit(): void;
      testCipherStatus(): void;
    };
  }

  // Service Worker specific global scope
  declare const self: ServiceWorkerGlobalScope & {
    clients: ServiceWorkerContainer;
    skipWaiting(): Promise<void>;
    testFunctions: {
      testWelcomeNotification(): void;
      testSetupGuide(): void;
      testBadge(): void;
      clearBadge(): void;
      simulateInstall(): void;
      testCipherInit(): void;
      testCipherStatus(): void;
    };
  };

  // Chrome Extension APIs
  namespace chrome {
    namespace extension {
      function isAllowedFileSchemeAccess(): Promise<boolean>;
    }
    namespace tabs {
      interface Tab {
        testFunctions?: {
          testWelcomeNotification(): void;
          testSetupGuide(): void;
          testBadge(): void;
          clearBadge(): void;
          simulateInstall(): void;
          testCipherInit(): void;
          testCipherStatus(): void;
        };
      }
    }
  }

  // Extended Event types
  interface ExtendedEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }

  interface EventTarget {
    state?: string;
    value?: string;
    checked?: boolean;
    dataset?: DOMStringMap;
    classList?: DOMTokenList;
    closest?: (selectors: string) => Element | null;
    scrollIntoView?: (arg?: boolean | ScrollIntoViewOptions) => void;
  }

  // Navigator extensions
  interface Navigator {
    downloads: any;
  }

  // Extended Element interface
  interface Element {
    content: string;
    dataset: DOMStringMap;
    style: CSSStyleDeclaration;
    innerText: string;
    value: string;
    checked: boolean;
    disabled: boolean;
    title: string;
  }

  // Extended Node interface
  interface Node {
    innerText: string;
    classList: DOMTokenList;
    scrollIntoView(arg?: boolean | ScrollIntoViewOptions): void;
    remove(): void;
  }

  // Promise constructor fix
  interface PromiseConstructor {
    new (): Promise<any>;
    new <T>(): Promise<T>;
    new <T>(
      executor: (
        resolve: (value: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void
      ) => void
    ): Promise<T>;
  }

  // Constants available globally
  declare const TIMEOUTS: Window['TIMEOUTS'];
  declare const SIZES: Window['SIZES'];
  declare const FileAccessChecker: Window['FileAccessChecker'];
  declare const SafeStorage: Window['SafeStorage'];
}

export {};
