/**
 * Tests — PaymentRetryPage
 * UC-PAY-08 / ADR-018: reintentar es on-site. Esta ruta solo redirige a
 * PaymentSelectionPage (/checkout/payment/:orderId), donde vive el initiate
 * on-site (CardForm o método sin tarjeta). No hay redirect a checkout_url.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import PaymentRetryPage from './PaymentRetryPage';

const wrap = (path = '/account/orders/ORD-7/payment/retry') => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route
        path="/account/orders/:orderId/payment/retry"
        element={<PaymentRetryPage />}
      />
      <Route
        path="/checkout/payment/:orderId"
        element={<div>PAGO ON-SITE</div>}
      />
    </Routes>
  </MemoryRouter>
);

describe('PaymentRetryPage (UC-PAY-08)', () => {
  it('redirige al pago on-site de la orden (no a un checkout_url)', () => {
    render(wrap());
    expect(screen.getByText(/PAGO ON-SITE/)).toBeInTheDocument();
  });

  it('resuelve la ruta on-site sin depender de checkout_url', () => {
    render(wrap('/account/orders/PY-999/payment/retry'));
    expect(screen.getByText(/PAGO ON-SITE/)).toBeInTheDocument();
    expect(screen.queryByText(/checkout_url/i)).not.toBeInTheDocument();
  });
});
