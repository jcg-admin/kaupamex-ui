/**
 * Redux Logger Middleware -- PracticaYoruba
 * Solo activo en development.
 */

export const loggerMiddleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV !== 'development') return next(action);
  const prev  = store.getState();
  const result = next(action);
  const next_  = store.getState();
  console.groupCollapsed(`[Redux] ${action.type}`);
  console.log('prev:',    prev);
  console.log('action:',  action);
  console.log('next:',    next_);
  console.groupEnd();
  return result;
};

export default loggerMiddleware;
