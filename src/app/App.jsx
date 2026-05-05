/**
 * App — PracticaYoruba UI
 * Componente raíz. Single Responsibility: renderizar el router con providers.
 */

import { Suspense } from 'react';
import { AppProviders } from './AppProviders';
import { AppRouter } from '@router';
import '@styles/main.scss';

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#FAFAF7',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #E8E0D5', borderTopColor: '#B8860B',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: '#9C8A7A', fontSize: 14 }}>Cargando PracticaYoruba...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <Suspense fallback={<LoadingFallback />}>
        <AppRouter />
      </Suspense>
    </AppProviders>
  );
}
