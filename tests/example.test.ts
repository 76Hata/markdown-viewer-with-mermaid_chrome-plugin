/**
 * Example test file demonstrating basic Chrome Extension testing patterns
 */

describe('Chrome Extension Testing Setup', () => {
  test('Chrome APIs are properly mocked', () => {
    expect(chrome.storage.local.get).toBeDefined();
    expect(chrome.storage.local.set).toBeDefined();
    expect(chrome.runtime.getURL).toBeDefined();
  });

  test('DOM utilities work correctly', () => {
    const element = (global as any).createMockElement('div', {
      id: 'test',
      class: 'test-class',
    });
    expect(element.tagName).toBe('DIV');
    expect(element.id).toBe('test');
    expect(element.className).toBe('test-class');
  });

  test('Markdown document setup works', () => {
    (global as any).createMarkdownDocument('# Test Markdown');
    expect(document.body.innerHTML).toContain('# Test Markdown');
    // テスト用に簡単なアサーション
    expect(document.body.innerHTML).toBeTruthy();
  });

  test('External libraries are mocked', () => {
    expect(marked.parse).toBeDefined();
    expect(mermaid.initialize).toBeDefined();
    expect(html2canvas).toBeDefined();
  });
});

describe('Chrome Storage API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('storage.local.get returns data', async () => {
    const mockData = { theme: 'dark', fontSize: 'large' };
    (chrome.storage.local.get as jest.Mock).mockImplementation(
      (keys, callback) => {
        callback(mockData);
      }
    );

    return new Promise<void>(resolve => {
      chrome.storage.local.get(['theme', 'fontSize'], result => {
        expect(result).toEqual(mockData);
        resolve();
      });
    });
  });

  test('storage.local.set saves data', async () => {
    const testData = { theme: 'light' };
    (chrome.storage.local.set as jest.Mock).mockImplementation(
      (data, callback) => {
        callback();
      }
    );

    return new Promise<void>(resolve => {
      chrome.storage.local.set(testData, () => {
        expect(chrome.storage.local.set).toHaveBeenCalledWith(
          testData,
          expect.any(Function)
        );
        resolve();
      });
    });
  });
});

describe('File Detection', () => {
  test('detects markdown file patterns', () => {
    const testUrl = 'file:///test/document.md';
    const isMarkdownFile =
      testUrl.endsWith('.md') || testUrl.endsWith('.markdown');
    expect(isMarkdownFile).toBe(true);
  });

  test('detects content that needs processing', () => {
    (global as any).createMarkdownDocument('```mermaid\ngraph TD\nA-->B\n```');
    const hasMermaidContent = document.body.innerHTML.includes('mermaid');
    expect(hasMermaidContent).toBe(true);
  });
});

export {};
