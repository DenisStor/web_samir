/**
 * Jest Configuration for Say's Barbers JavaScript Tests
 */
module.exports = {
  // Use jsdom environment for DOM testing
  testEnvironment: 'jsdom',

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/setup.js'],

  // Test file patterns
  testMatch: ['**/*.test.js'],

  // Root directory
  rootDir: __dirname,

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/../../src/js'],

  // Transform settings (no transformation needed for ES5)
  transform: {},

  // Coverage configuration
  collectCoverageFrom: [
    '../../src/js/**/*.js',
    '!../../src/js/**/*.bundle.js'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};
