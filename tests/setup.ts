/**
 * Jest Test Setup
 *
 * Global setup for Jest tests. This file runs before each test file.
 */

// Global test timeout
jest.setTimeout(10000);

// Mock console.error to fail on unintended errors in tests
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // Ignore specific warnings that are expected
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning:") || args[0].includes("ReactDOM.render"))
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

// Global beforeAll setup
beforeAll(() => {
  // Setup that needs to run once before all tests
});

// Global afterAll cleanup
afterAll(() => {
  // Cleanup after all tests
});

// Global beforeEach setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global afterEach cleanup
afterEach(() => {
  // Cleanup after each test
});
