/**
 * Redux Performance Monitor -- PracticaYoruba
 * Alerta en dev cuando un reducer tarda mas de 16ms (un frame).
 */

const THRESHOLD_MS = 16;

export const performanceMonitor = (store) => (next) => (action) => {
  if (process.env.NODE_ENV !== 'development') return next(action);
  const t0     = performance.now();
  const result = next(action);
  const ms     = performance.now() - t0;
  if (ms > THRESHOLD_MS) {
    console.warn(`[Redux Perf] ${action.type} tardó ${ms.toFixed(2)}ms`);
  }
  return result;
};

export default performanceMonitor;
