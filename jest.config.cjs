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

    // Bare aliases (sin sub-path). Webpack resuelve `@constants` al index.js
    // del directorio; jest necesita el mapeo explícito o el require revienta
    // con "Cannot find module '@constants'" (H-UI-01) al importar utils que
    // hacen `import { CURRENCY } from '@constants'`. Solo los directorios con
    // index.js resoluble bare: constants, router, hooks, mocks. Van antes de
    // los patrones con sub-path (son mutuamente exclusivos, pero el orden
    // explícito documenta la intención).
    '^@constants$':      '<rootDir>/src/constants/index.js',
    '^@router$':         '<rootDir>/src/router/index.js',
    '^@hooks$':          '<rootDir>/src/hooks/index.js',
    '^@mocks$':          '<rootDir>/src/mocks/index.js',

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
    '^@context/ToastContext$': '<rootDir>/src/context/__mocks__/ToastContext.jsx',
    '^@context/(.*)$':   '<rootDir>/src/context/$1',
    '^@lib/(.*)$':       '<rootDir>/src/lib/$1',
    '^@facades/(.*)$':   '<rootDir>/src/facades/$1',
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
