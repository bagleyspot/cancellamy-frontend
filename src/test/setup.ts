import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetHttpState } from '@/api/http';
import { server } from './server';

// Parallel test files share the CPU: the default 1s for async queries is too tight and makes tests flaky.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetHttpState();
  window.localStorage.clear();
});

afterAll(() => server.close());
