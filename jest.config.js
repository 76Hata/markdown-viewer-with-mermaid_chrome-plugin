module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    '**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/lib/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/*.min.js',
    '!**/*.config.js',
    '!**/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@js/(.*)$': '<rootDir>/js/$1',
  },
  setupFiles: ['<rootDir>/tests/globals.ts'],
};
