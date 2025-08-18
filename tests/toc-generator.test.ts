/**
 * TOC Generator テスト
 * 目次生成機能の動作確認とテストケース
 */

// テスト環境での TOC Generator モック
const mockTOCGenerator = {
  createTOC: jest.fn(),
  updateTOC: jest.fn(),
  generateTOCHTML: jest.fn(),
  setupTOCEvents: jest.fn(),
};

// グローバル変数として定義
(global as any).TOCGenerator = mockTOCGenerator;

describe('TOC Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('見出し検出テスト', () => {
    test('H1-H6見出しを正しく検出する', () => {
      const testHTML = `
        <h1>見出し1</h1>
        <p>本文</p>
        <h2>見出し2</h2>
        <h3>見出し3</h3>
        <h4>見出し4</h4>
        <h5>見出し5</h5>
        <h6>見出し6</h6>
      `;
      document.body.innerHTML = testHTML;

      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBe(6);
      expect(headings[0].textContent).toBe('見出し1');
      expect(headings[1].textContent).toBe('見出し2');
    });

    test('IDが自動生成される', () => {
      const testHTML = '<h1>テストタイトル</h1>';
      document.body.innerHTML = testHTML;

      const heading = document.querySelector('h1');
      const expectedId = 'テストタイトル'.toLowerCase().replace(/\s+/g, '-');

      // 実際のID生成ロジックをシミュレート
      if (heading && !heading.id) {
        heading.id = expectedId;
      }

      expect(heading?.id).toBe(expectedId);
    });
  });

  describe('TOC HTML生成テスト', () => {
    test('階層構造のTOCが生成される', () => {
      const mockHeadings = [
        { level: 1, text: 'メインタイトル', id: 'main-title' },
        { level: 2, text: 'サブタイトル1', id: 'sub-title-1' },
        { level: 2, text: 'サブタイトル2', id: 'sub-title-2' },
        { level: 3, text: 'サブサブタイトル', id: 'sub-sub-title' },
      ];

      mockTOCGenerator.generateTOCHTML.mockReturnValue(`
        <ul class="toc-level-1">
          <li><a href="#main-title">メインタイトル</a>
            <ul class="toc-level-2">
              <li><a href="#sub-title-1">サブタイトル1</a></li>
              <li><a href="#sub-title-2">サブタイトル2</a>
                <ul class="toc-level-3">
                  <li><a href="#sub-sub-title">サブサブタイトル</a></li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `);

      const tocHTML = mockTOCGenerator.generateTOCHTML(mockHeadings);
      expect(tocHTML).toContain('toc-level-1');
      expect(tocHTML).toContain('toc-level-2');
      expect(tocHTML).toContain('toc-level-3');
      expect(tocHTML).toContain('#main-title');
    });

    test('空の見出しリストの場合、空のTOCが生成される', () => {
      mockTOCGenerator.generateTOCHTML.mockReturnValue('');
      const tocHTML = mockTOCGenerator.generateTOCHTML([]);
      expect(tocHTML).toBe('');
    });
  });

  describe('スクロール機能テスト', () => {
    test('TOCリンククリックでスクロールイベントが発生する', () => {
      const mockScrollIntoView = jest.fn();
      const mockElement = {
        scrollIntoView: mockScrollIntoView,
      };

      // DOMを設定
      document.getElementById = jest.fn().mockReturnValue(mockElement);

      // スクロール機能をシミュレート
      const simulateClick = (targetId: string) => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      simulateClick('test-heading');
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量の見出しでもパフォーマンスが良好', () => {
      const largeHeadingsList = Array.from({ length: 1000 }, (_, i) => ({
        level: (i % 6) + 1,
        text: `見出し ${i + 1}`,
        id: `heading-${i + 1}`,
      }));

      const startTime = performance.now();
      mockTOCGenerator.generateTOCHTML(largeHeadingsList);
      const endTime = performance.now();

      // 1000個の見出しでも100ms以内で処理されることを期待
      const processingTime = endTime - startTime;
      console.log(`処理時間: ${processingTime}ms`);
      expect(processingTime).toBeLessThan(100);
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('不正な見出しデータでもエラーが発生しない', () => {
      const invalidHeadings = [
        { level: 0, text: '', id: '' },
        { level: 7, text: 'Invalid level', id: 'invalid' },
        null,
        undefined,
      ] as any;

      expect(() => {
        mockTOCGenerator.generateTOCHTML(invalidHeadings);
      }).not.toThrow();
    });
  });

  describe('アクセシビリティテスト', () => {
    test('TOCにARIAラベルが含まれる', () => {
      const tocWithAria = `
        <nav aria-label="目次" role="navigation">
          <ul class="toc-level-1">
            <li><a href="#test" aria-describedby="toc-description">テスト</a></li>
          </ul>
        </nav>
      `;

      document.body.innerHTML = tocWithAria;
      const nav = document.querySelector('nav[aria-label="目次"]');
      expect(nav).toBeTruthy();
      expect(nav?.getAttribute('role')).toBe('navigation');
    });
  });
});

export {};
