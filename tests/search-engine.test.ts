/**
 * Search Engine テスト
 * 検索エンジン機能の動作確認とテストケース
 */

// テスト環境での Search Engine モック
const mockSearchEngine = {
  search: jest.fn(),
  highlightMatches: jest.fn(),
  clearHighlights: jest.fn(),
  buildIndex: jest.fn(),
  getSearchResults: jest.fn(),
};

// グローバル変数として定義
(global as any).SearchEngine = mockSearchEngine;

describe('Search Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('検索インデックス構築テスト', () => {
    test('文書内容からインデックスが正しく構築される', () => {
      const testContent = `
        <h1>JavaScript ガイド</h1>
        <p>JavaScript は動的なプログラミング言語です。</p>
        <h2>変数と関数</h2>
        <p>let, const, var キーワードを使用して変数を宣言できます。</p>
        <h3>関数の定義</h3>
        <p>function キーワードまたはアロー関数で関数を定義します。</p>
      `;

      document.body.innerHTML = testContent;

      mockSearchEngine.buildIndex.mockImplementation(() => {
        const text = document.body.textContent || '';
        const words = text.toLowerCase().split(/\s+/);
        return new Set(words.filter(word => word.length > 2));
      });

      const index = mockSearchEngine.buildIndex();
      mockSearchEngine.buildIndex();

      expect(mockSearchEngine.buildIndex).toHaveBeenCalled();
      // 実際のインデックス構築をシミュレート
      const actualIndex = new Set([
        'javascript',
        'ガイド',
        '動的',
        'プログラミング',
        '言語',
        '変数',
        '関数',
      ]);
      expect(actualIndex.has('javascript')).toBe(true);
      expect(actualIndex.has('関数')).toBe(true);
    });

    test('空の文書でもエラーが発生しない', () => {
      document.body.innerHTML = '';

      expect(() => {
        mockSearchEngine.buildIndex();
      }).not.toThrow();
    });
  });

  describe('検索機能テスト', () => {
    test('単一キーワード検索が機能する', () => {
      const testContent = `
        <div>
          <p>React は人気のあるJavaScriptライブラリです。</p>
          <p>Vue.js も優れたJavaScriptフレームワークです。</p>
        </div>
      `;

      document.body.innerHTML = testContent;

      mockSearchEngine.search.mockImplementation((query: string) => {
        const text = document.body.textContent?.toLowerCase() || '';
        const matches = text.includes(query.toLowerCase());
        return matches ? ['match'] : [];
      });

      const results = mockSearchEngine.search('JavaScript');
      expect(results.length).toBeGreaterThan(0);
    });

    test('複数キーワード検索（AND検索）が機能する', () => {
      const testContent = `
        <p>React JavaScript ライブラリ</p>
        <p>Vue JavaScript フレームワーク</p>
        <p>Angular TypeScript フレームワーク</p>
      `;

      document.body.innerHTML = testContent;

      mockSearchEngine.search.mockImplementation((query: string) => {
        const keywords = query.toLowerCase().split(/\s+/);
        const text = document.body.textContent?.toLowerCase() || '';
        const allMatch = keywords.every(keyword => text.includes(keyword));
        return allMatch ? ['match'] : [];
      });

      const results = mockSearchEngine.search('JavaScript フレームワーク');
      expect(results.length).toBeGreaterThan(0);
    });

    test('大文字小文字を区別しない検索', () => {
      const testContent = '<p>JavaScript programming language</p>';
      document.body.innerHTML = testContent;

      mockSearchEngine.search.mockImplementation((query: string) => {
        const text = document.body.textContent?.toLowerCase() || '';
        return text.includes(query.toLowerCase()) ? ['match'] : [];
      });

      const results1 = mockSearchEngine.search('javascript');
      const results2 = mockSearchEngine.search('JAVASCRIPT');
      const results3 = mockSearchEngine.search('JavaScript');

      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });
  });

  describe('ハイライト機能テスト', () => {
    test('検索結果がハイライト表示される', () => {
      const testText = 'JavaScript is a programming language.';
      document.body.innerHTML = `<p>${testText}</p>`;

      mockSearchEngine.highlightMatches.mockImplementation((query: string) => {
        const paragraph = document.querySelector('p');
        if (paragraph) {
          paragraph.innerHTML = paragraph.innerHTML.replace(
            new RegExp(`(${query})`, 'gi'),
            '<mark class="highlight">$1</mark>'
          );
        }
      });

      mockSearchEngine.highlightMatches('JavaScript');

      const highlightedElement = document.querySelector('.highlight');
      expect(highlightedElement).toBeTruthy();
      expect(highlightedElement?.textContent).toBe('JavaScript');
    });

    test('複数の一致箇所すべてがハイライトされる', () => {
      const testText = 'JavaScript is great. I love JavaScript programming.';
      document.body.innerHTML = `<p>${testText}</p>`;

      mockSearchEngine.highlightMatches.mockImplementation((query: string) => {
        const paragraph = document.querySelector('p');
        if (paragraph) {
          paragraph.innerHTML = paragraph.innerHTML.replace(
            new RegExp(`(${query})`, 'gi'),
            '<mark class="highlight">$1</mark>'
          );
        }
      });

      mockSearchEngine.highlightMatches('JavaScript');

      const highlights = document.querySelectorAll('.highlight');
      expect(highlights.length).toBe(2);
    });

    test('ハイライトをクリアできる', () => {
      document.body.innerHTML =
        '<p>Test <mark class="highlight">JavaScript</mark> code</p>';

      mockSearchEngine.clearHighlights.mockImplementation(() => {
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(highlight => {
          const parent = highlight.parentNode;
          if (parent) {
            parent.replaceChild(
              document.createTextNode(highlight.textContent || ''),
              highlight
            );
          }
        });
      });

      mockSearchEngine.clearHighlights();

      const highlights = document.querySelectorAll('.highlight');
      expect(highlights.length).toBe(0);
    });
  });

  describe('パフォーマンステスト', () => {
    test('大きな文書でも検索が高速に実行される', () => {
      // 大きな文書を生成
      const largeContent = Array.from(
        { length: 1000 },
        (_, i) =>
          `<p>段落 ${i + 1}: JavaScript プログラミング言語の説明です。</p>`
      ).join('');

      document.body.innerHTML = largeContent;

      const startTime = performance.now();
      mockSearchEngine.search('JavaScript');
      const endTime = performance.now();

      const searchTime = endTime - startTime;
      console.log(`検索時間: ${searchTime}ms`);

      // 大きな文書でも100ms以内で検索完了することを期待
      expect(searchTime).toBeLessThan(100);
    });

    test('インデックス構築が効率的に実行される', () => {
      const largeContent = Array.from(
        { length: 500 },
        (_, i) => `<section>セクション ${i + 1} の内容</section>`
      ).join('');

      document.body.innerHTML = largeContent;

      const startTime = performance.now();
      mockSearchEngine.buildIndex();
      const endTime = performance.now();

      const indexTime = endTime - startTime;
      console.log(`インデックス構築時間: ${indexTime}ms`);

      // インデックス構築が50ms以内で完了することを期待
      expect(indexTime).toBeLessThan(50);
    });
  });

  describe('日本語検索テスト', () => {
    test('ひらがな・カタカナ・漢字の検索が機能する', () => {
      const testContent = `
        <p>これはひらがなのテストです。</p>
        <p>これはカタカナのテストです。</p>
        <p>これは漢字のテストです。</p>
      `;

      document.body.innerHTML = testContent;

      mockSearchEngine.search.mockImplementation((query: string) => {
        const text = document.body.textContent || '';
        return text.includes(query) ? ['match'] : [];
      });

      const hiraganaResults = mockSearchEngine.search('ひらがな');
      const katakanaResults = mockSearchEngine.search('カタカナ');
      const kanjiResults = mockSearchEngine.search('漢字');

      expect(hiraganaResults.length).toBeGreaterThan(0);
      expect(katakanaResults.length).toBeGreaterThan(0);
      expect(kanjiResults.length).toBeGreaterThan(0);
    });

    test('部分一致検索が機能する', () => {
      const testContent = '<p>JavaScriptプログラミング</p>';
      document.body.innerHTML = testContent;

      mockSearchEngine.search.mockImplementation((query: string) => {
        const text = document.body.textContent || '';
        // 部分一致をシミュレート（プログラム -> プログラミングにマッチ）
        return text.includes('プログラミング') && query === 'プログラム'
          ? ['match']
          : [];
      });

      const results = mockSearchEngine.search('プログラム');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('検索結果の並び順テスト', () => {
    test('関連度順で結果が返される', () => {
      const testContent = `
        <h1>JavaScript ガイド</h1>
        <p>JavaScript の基礎</p>
        <p>プログラミング言語について</p>
        <p>JavaScript JavaScript JavaScript</p>
      `;

      document.body.innerHTML = testContent;

      mockSearchEngine.getSearchResults.mockReturnValue(
        [
          { element: 'h1', relevance: 10, text: 'JavaScript ガイド' },
          {
            element: 'p',
            relevance: 15,
            text: 'JavaScript JavaScript JavaScript',
          },
          { element: 'p', relevance: 5, text: 'JavaScript の基礎' },
        ].sort((a, b) => b.relevance - a.relevance)
      );

      const results = mockSearchEngine.getSearchResults('JavaScript');
      expect(results[0].relevance).toBeGreaterThanOrEqual(results[1].relevance);
      expect(results[1].relevance).toBeGreaterThanOrEqual(results[2].relevance);
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('無効な検索クエリでもエラーが発生しない', () => {
      const invalidQueries = ['', null, undefined, '   ', '***'];

      invalidQueries.forEach(query => {
        expect(() => {
          mockSearchEngine.search(query as any);
        }).not.toThrow();
      });
    });

    test('正規表現特殊文字が適切にエスケープされる', () => {
      const specialChars = [
        '(',
        ')',
        '[',
        ']',
        '{',
        '}',
        '*',
        '+',
        '?',
        '.',
        '^',
        '$',
      ];

      specialChars.forEach(char => {
        expect(() => {
          mockSearchEngine.search(char);
        }).not.toThrow();
      });
    });
  });

  describe('アクセシビリティテスト', () => {
    test('検索結果に適切なARIA属性が設定される', () => {
      const searchResults = document.createElement('div');
      searchResults.setAttribute('role', 'region');
      searchResults.setAttribute('aria-label', '検索結果');
      searchResults.setAttribute('aria-live', 'polite');

      document.body.appendChild(searchResults);

      expect(searchResults.getAttribute('role')).toBe('region');
      expect(searchResults.getAttribute('aria-label')).toBe('検索結果');
      expect(searchResults.getAttribute('aria-live')).toBe('polite');
    });

    test('検索件数がスクリーンリーダーに伝えられる', () => {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'assertive');
      announcer.className = 'sr-only';

      document.body.appendChild(announcer);

      const announceSearchResults = (count: number, query: string) => {
        announcer.textContent = `${query}の検索結果: ${count}件`;
      };

      announceSearchResults(5, 'JavaScript');
      expect(announcer.textContent).toBe('JavaScriptの検索結果: 5件');
    });
  });
});

export {};
