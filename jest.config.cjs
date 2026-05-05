module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  verbose: true,

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  moduleNameMapper: {
    '\\.(css|scss|less|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',

    '^@/(.*)$':          '<rootDir>/src/$1',
    '^@app/(.*)$':       '<rootDir>/src/app/$1',
    '^@modules/(.*)$':   '<rootDir>/src/modules/$1',
    '^@components/(.*)$':'<rootDir>/src/components/$1',
    '^@hooks/(.*)$':     '<rootDir>/src/hooks/$1',
    '^@styles/(.*)$':    '<rootDir>/src/styles/$1',
    '^@state/(.*)$':     '<rootDir>/src/state/$1',
    '^@redux/(.*)$':     '<rootDir>/src/redux/$1',
    '^@services/(.*)$':  '<rootDir>/src/services/$1',
    '^@mocks/(.*)$':     '<rootDir>/src/mocks/$1',
    '^@utils/(.*)$':     '<rootDir>/src/utils/$1',
    '^@pages/(.*)$':     '<rootDir>/src/pages/$1',
    '^@router/(.*)$':    '<rootDir>/src/router/$1',
    '^@config/(.*)$':    '<rootDir>/src/config/$1',
    '^@layouts/(.*)$':   '<rootDir>/src/layouts/$1',
    '^@context/(.*)$':   '<rootDir>/src/context/$1',
    '^@lib/(.*)$':       '<rootDir>/src/lib/$1',
    '^@facades/(.*)$':   '<rootDir>/src/facades/$1',
    '^@decorators/(.*)$':'<rootDir>/src/decorators/$1',
    '^@types/(.*)$':     '<rootDir>/src/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  },

  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
  ],

  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/mocks/**',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
