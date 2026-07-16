import '@testing-library/jest-dom/vitest';

// Only mock browser APIs when in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.location.hash for navigation tests
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
    },
    writable: true,
  });

  // Mock window.confirm
  Object.defineProperty(window, 'confirm', {
    value: vi.fn(() => true),
    writable: true,
  });
}

// Suppress console.error in tests (ErrorBoundary logs)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('[ErrorBoundary]')) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});