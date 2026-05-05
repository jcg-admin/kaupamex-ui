/**
 * usePasswordStrength -- PracticaYoruba
 * Evalua la fortaleza de una contrasena en tiempo real.
 * Usado en: RegisterPage, ResetPasswordPage.
 */

import { useMemo } from 'react';

export function usePasswordStrength(password = '') {
  const result = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', checks: _emptyChecks() };

    const checks = {
      length:    password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number:    /[0-9]/.test(password),
      special:   /[^a-zA-Z0-9]/.test(password),
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const map = [
      { score: 0, label: '',         color: '' },
      { score: 1, label: 'Muy debil', color: '#F04040' },
      { score: 2, label: 'Debil',     color: '#F0A020' },
      { score: 3, label: 'Aceptable', color: '#F0A020' },
      { score: 4, label: 'Fuerte',    color: '#1DB954' },
    ];

    return { ...map[passed], checks };
  }, [password]);

  return result;
}

function _emptyChecks() {
  return { length: false, uppercase: false, number: false, special: false };
}

export default usePasswordStrength;
