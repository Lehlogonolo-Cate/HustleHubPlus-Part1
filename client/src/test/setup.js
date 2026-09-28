import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// Recharts measures its container, which jsdom cannot do
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
