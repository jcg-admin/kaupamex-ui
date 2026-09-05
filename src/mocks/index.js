/**
 * Mock barrel — Kaupamex
 *
 * Production guard: throws immediately if this barrel is imported
 * in a production build. Webpack's DefinePlugin replaces
 * process.env.NODE_ENV with the literal at build time, enabling
 * dead-code elimination of this entire module tree (H-07).
 *
 * DO NOT import this barrel from production code paths.
 * Use the conditional require pattern in apiService.js instead.
 */
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    '[mocks] src/mocks/* was imported in a production build. ' +
    'Ensure apiService.js uses the conditional require pattern.'
  );
}

export { default, MockInterceptor } from './mockInterceptor';
export {
  loadMock,
  validateMock,
  listMocks,
  describeMock,
} from './registry';
