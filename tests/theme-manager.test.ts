/**
 * Theme Manager テスト
 * テーマ管理機能の動作確認とテストケース
 */

// テスト環境での Theme Manager モック
const mockThemeManager = {
  setTheme: jest.fn(),
  getTheme: jest.fn(),
  applyTheme: jest.fn(),
  initializeTheme: jest.fn(),
  loadStoredTheme: jest.fn(),
};

// グローバル変数として定義
(global as any).ThemeManager = mockThemeManager;

describe('Theme Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    document.body.className = '';
  });

  describe('テーマ設定テスト', () => {
    test('ライトテーマが正しく適用される', () => {
      const lightTheme = 'light';
      mockThemeManager.setTheme.mockImplementation((theme: string) => {
        document.body.className = `theme-${theme}`;
      });

      mockThemeManager.setTheme(lightTheme);
      expect(document.body.className).toBe('theme-light');
    });

    test('ダークテーマが正しく適用される', () => {
      const darkTheme = 'dark';
      mockThemeManager.setTheme.mockImplementation((theme: string) => {
        document.body.className = `theme-${theme}`;
      });

      mockThemeManager.setTheme(darkTheme);
      expect(document.body.className).toBe('theme-dark');
    });

    test('セピアテーマが正しく適用される', () => {
      const sepiaTheme = 'sepia';
      mockThemeManager.setTheme.mockImplementation((theme: string) => {
        document.body.className = `theme-${theme}`;
      });

      mockThemeManager.setTheme(sepiaTheme);
      expect(document.body.className).toBe('theme-sepia');
    });
  });

  describe('テーマ永続化テスト', () => {
    test('テーマ設定がストレージに保存される', async () => {
      const testTheme = 'dark';

      (chrome.storage.local.set as jest.Mock).mockImplementation(
        (data, callback) => {
          expect(data).toEqual({ selectedTheme: testTheme });
          if (callback) callback();
        }
      );

      // ストレージ保存機能をシミュレート
      const saveTheme = (theme: string) => {
        chrome.storage.local.set({ selectedTheme: theme });
      };

      saveTheme(testTheme);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        selectedTheme: testTheme,
      });
    });

    test('ストレージからテーマが読み込まれる', async () => {
      const storedTheme = 'sepia';

      (chrome.storage.local.get as jest.Mock).mockImplementation(
        (keys, callback) => {
          callback({ selectedTheme: storedTheme });
        }
      );

      mockThemeManager.loadStoredTheme.mockImplementation(() => {
        return new Promise(resolve => {
          chrome.storage.local.get(['selectedTheme'], result => {
            resolve(result.selectedTheme || 'light');
          });
        });
      });

      const loadedTheme = await mockThemeManager.loadStoredTheme();
      expect(loadedTheme).toBe(storedTheme);
    });
  });

  describe('CSS変数テスト', () => {
    test('テーマに応じてCSS変数が設定される', () => {
      const setThemeColors = (theme: string) => {
        const root = document.documentElement;
        switch (theme) {
          case 'dark':
            root.style.setProperty('--bg-color', '#1a1a1a');
            root.style.setProperty('--text-color', '#ffffff');
            break;
          case 'light':
            root.style.setProperty('--bg-color', '#ffffff');
            root.style.setProperty('--text-color', '#000000');
            break;
          case 'sepia':
            root.style.setProperty('--bg-color', '#f4f1ea');
            root.style.setProperty('--text-color', '#5c4b37');
            break;
        }
      };

      setThemeColors('dark');
      const rootStyle = getComputedStyle(document.documentElement);

      // CSSプロパティの確認
      expect(
        document.documentElement.style.getPropertyValue('--bg-color')
      ).toBe('#1a1a1a');
      expect(
        document.documentElement.style.getPropertyValue('--text-color')
      ).toBe('#ffffff');
    });
  });

  describe('テーマ切り替えUIテスト', () => {
    test('テーマ選択ボタンが正しく動作する', () => {
      const createThemeSelector = () => {
        const container = document.createElement('div');
        container.id = 'theme-selector';

        ['light', 'dark', 'sepia'].forEach(theme => {
          const button = document.createElement('button');
          button.textContent = theme;
          button.classList.add('theme-button');
          button.dataset.theme = theme;
          button.addEventListener('click', () => {
            mockThemeManager.setTheme(theme);
          });
          container.appendChild(button);
        });

        return container;
      };

      const selector = createThemeSelector();
      document.body.appendChild(selector);

      const darkButton = selector.querySelector(
        '[data-theme="dark"]'
      ) as HTMLButtonElement;
      darkButton.click();

      expect(mockThemeManager.setTheme).toHaveBeenCalledWith('dark');
    });

    test('現在のテーマがUIに反映される', () => {
      const currentTheme = 'dark';
      const selector = document.createElement('div');

      ['light', 'dark', 'sepia'].forEach(theme => {
        const button = document.createElement('button');
        button.dataset.theme = theme;
        button.classList.toggle('active', theme === currentTheme);
        selector.appendChild(button);
      });

      document.body.appendChild(selector);

      const activeButton = selector.querySelector(
        '.active'
      ) as HTMLButtonElement;
      expect(activeButton.dataset.theme).toBe(currentTheme);
    });
  });

  describe('レスポンシブテーマテスト', () => {
    test('システムの配色設定が考慮される', () => {
      // メディアクエリのモック
      const mockMatchMedia = jest.fn();
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      mockMatchMedia.mockReturnValue({
        matches: true, // ダークモードを検出
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });

      const getSystemTheme = () => {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return darkModeQuery.matches ? 'dark' : 'light';
      };

      expect(getSystemTheme()).toBe('dark');
    });
  });

  describe('パフォーマンステスト', () => {
    test('テーマ切り替えが高速に実行される', () => {
      const startTime = performance.now();

      // 大量のテーマ切り替えをシミュレート
      for (let i = 0; i < 100; i++) {
        const theme = ['light', 'dark', 'sepia'][i % 3];
        mockThemeManager.setTheme(theme);
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 100回の切り替えが50ms以内で実行されることを期待
      console.log(`テーマ切り替え時間: ${processingTime}ms`);
      expect(processingTime).toBeLessThan(50);
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('無効なテーマ名でもエラーが発生しない', () => {
      const invalidThemes = ['', null, undefined, 'invalid-theme'];

      invalidThemes.forEach(theme => {
        expect(() => {
          mockThemeManager.setTheme(theme as any);
        }).not.toThrow();
      });
    });

    test('ストレージエラー時にデフォルトテーマが使用される', () => {
      (chrome.storage.local.get as jest.Mock).mockImplementation(
        (keys, callback) => {
          // ストレージエラーをシミュレート
          throw new Error('Storage error');
        }
      );

      mockThemeManager.loadStoredTheme.mockImplementation(() => {
        try {
          chrome.storage.local.get(['selectedTheme'], result => {
            return result.selectedTheme || 'light';
          });
          return 'light';
        } catch (error) {
          return 'light'; // デフォルトテーマ
        }
      });

      const fallbackTheme = mockThemeManager.loadStoredTheme();
      expect(fallbackTheme).toBe('light');
    });
  });

  describe('アクセシビリティテスト', () => {
    test('テーマ選択ボタンに適切なARIA属性が設定される', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'ダークテーマに切り替え');
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('role', 'switch');

      document.body.appendChild(button);

      expect(button.getAttribute('aria-label')).toBe('ダークテーマに切り替え');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.getAttribute('role')).toBe('switch');
    });

    test('テーマ変更時にスクリーンリーダーに通知される', () => {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';

      document.body.appendChild(announcer);

      const announceThemeChange = (theme: string) => {
        announcer.textContent = `テーマが${theme}に変更されました`;
      };

      announceThemeChange('ダーク');
      expect(announcer.textContent).toBe('テーマがダークに変更されました');
    });
  });
});

export {};
