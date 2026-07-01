/**
 * AppProviders — PracticaYoruba
 * Encapsula todos los providers globales en el orden correcto:
 *   1. React Query (fetching / cache)
 *   2. Redux (estado global)
 *   3. Toast Context (notificaciones UI)
 *   4. Cookie Consent (banner + preferencias, LFPDPPP)
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import store from '@redux/store';
import { queryClient } from '@lib/queryClient';
import { ToastProvider } from '@context/ToastContext';
import { CookieConsentProvider } from '@context/CookieConsentContext';

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ToastProvider>
          <CookieConsentProvider>
            {children}
          </CookieConsentProvider>
        </ToastProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default AppProviders;
