module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { diagnostics: false }]
  },

  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/popup/**',
    '!src/types/**'
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^webextension-polyfill$': '<rootDir>/node_modules/webextension-polyfill/dist/webextension-polyfill.min.js'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};
