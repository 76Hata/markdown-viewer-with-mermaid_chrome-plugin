import './globals';

// Jest setup for DOM testing
import 'jest-environment-jsdom';

// Setup DOM environment
beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';

  // Reset all mocks
  jest.clearAllMocks();
});

// Global test utilities
(global as any).createMockElement = (
  tagName: string,
  attributes: Record<string, string> = {}
) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

(global as any).createMarkdownDocument = (content: string) => {
  document.body.innerHTML = `<pre><code>${content}</code></pre>`;
  // Skip location mocking to avoid JSDOM navigation issues
};

export {};
