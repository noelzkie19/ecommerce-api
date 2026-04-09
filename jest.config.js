module.exports = {
  // Test environment
  testEnvironment: "node",

  // Transform TypeScript files
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2020",
          module: "CommonJS",
          lib: ["ES2021"],
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      },
    ],
  },

  // File patterns to test
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.spec.ts"],

  // File patterns to ignore
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/tests/__mocks__/"],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // Module name mapping for path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/server.ts",
    "!src/app.ts",
  ],

  // Coverage thresholds (optional - adjust as needed)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000,
};
