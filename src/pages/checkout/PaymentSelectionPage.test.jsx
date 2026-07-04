/**
 * Tests — PaymentSelectionPage
 * UC-PAY-01-V2: MercadoPago Checkout API (CardForm, ADR-018)
 * UC-PAY-02: PayPal (Checkout Pro redirect)
 * UC-PAY-13: Métodos no-tarjeta (OXXO, SPEI, Paycash, cajeros, Cuenta MP)
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

jest.mock('./paymentRedirect', () => ({
  __esModule: true,
  redirectToGateway: jest.fn(),
}));

// Mock useMpCardForm — prefixed with `mock` so Jest factory closure is allowed.
// mockCardFormSubmit is set by each useMpCardForm call and allows tests to
// imperatively trigger the payment callback.
let mockCardFormSubmitFn = null;
jest.mock('@hooks/useMpCardForm', () => ({
  useMpCardForm: jest.fn(({ onPayment }) => {
    mockCardFormSubmitFn = () => onPayment({
      token:             'test-token-123',
      payment_method_id: 'visa',
      issuerId:          '310',
      installments:      1,
      payer: { email: 'buyer@test.com', identification: { type: 'DNI', number: '12345678' } },
    });
    return { status: 'ready', error: null, submit: mockCardFormSubmitFn };
  }),
}));

import paymentsReducer from '@redux/slices/paymentsSlice';
import cardsReducer    from '@redux/slices/cardsSlice';
import ordersReducer   from '@redux/slices/ordersSlice';
import PaymentSelectionPage from './PaymentSelectionPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: {
      payments: paymentsReducer,
      cards:    cardsReducer,
      orders:   ordersReducer,
      auth:     () => ({ user: { email: 'buyer@test.com' } }),
    },
  });

// H-PP-04: el monto llega por navigation-state. Por defecto se pasa un monto
// válido (como en el flujo real desde CheckoutPage). El caso deep-link/reload
// (sin monto) se prueba aparte pasando state: null.
const wrap = (ui, store, { path = '/checkout/payment/ORD-001', state = { amount: '500.00' } } = {}) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/checkout/payment/:orderId" element={ui} />
        <Route path="/order/:orderId/confirmation" element={<div>Confirmación</div>} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

afterEach(() => {
  jest.clearAllMocks();
  mockCardFormSubmitFn = null;
});

describe('PaymentSelectionPage', () => {
  it('muestra el paso, el título y todos los métodos disponibles', () => {
    render(wrap(<PaymentSelectionPage />, makeStore()));
    // PG-03: encabezado del mockup 1.0.1.
    expect(screen.getByText(/Paso 04 · Pago/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Elige tu método de pago/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Método de pago$/i })).toBeInTheDocument();
    expect(screen.getByTestId('mp-method-list')).toBeInTheDocument();
    expect(screen.getByTestId('method-btn-mp-card')).toBeInTheDocument();
    expect(screen.getByTestId('method-btn-oxxo')).toBeInTheDocument();
    expect(screen.getByTestId('method-btn-clabe')).toBeInTheDocument();
  });

  it('muestra el CardForm al hacer click en tarjeta MP', () => {
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));
    expect(screen.getByTestId('mp-card-form')).toBeInTheDocument();
  });

  it('H-PP-04: sin monto en navigation-state, recupera el total y monta el CardForm', async () => {
    server.use(
      http.get(`${BASE}/api/v2/orders/ORD-001/`, () =>
        HttpResponse.json({ order_number: 'ORD-001', value: { total: '500.00' } }),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore(), { state: null }));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));
    // El CardForm no se monta hasta tener el total autoritativo de la orden.
    expect(await screen.findByTestId('mp-card-form')).toBeInTheDocument();
  });

  it('H-PP-04: sin monto ni total recuperable, avisa y no monta el CardForm', async () => {
    server.use(
      http.get(`${BASE}/api/v2/orders/ORD-001/`, () =>
        HttpResponse.json({ detail: 'not found' }, { status: 404 }),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore(), { state: null }));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));
    expect(await screen.findByTestId('amount-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('mp-card-form')).not.toBeInTheDocument();
  });

  it('UC-PAY-01-V2: CardForm tokeniza y POST a /api/v2/payments/initiate/', async () => {
    let capturedBody;
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          payment_id:         1,
          gateway_payment_id: 'mp-gw-001',
          status:             'approved',
          status_detail:      'accredited',
          order_number:       'ORD-001',
          amount:             '500.00',
          installments:       1,
        });
      }),
    );

    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));

    await act(async () => { mockCardFormSubmitFn?.(); });

    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        order_number:      'ORD-001',
        token:             'test-token-123',
        payment_method_id: 'visa',
      });
    });
  });

  it('UC-PAY-01-V2: muestra resultado aprobado tras pago exitoso', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          payment_id:         1,
          gateway_payment_id: 'mp-gw-002',
          status:             'approved',
          status_detail:      'accredited',
          order_number:       'ORD-001',
          amount:             '500.00',
          installments:       1,
        }),
      ),
    );

    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));
    await act(async () => { mockCardFormSubmitFn?.(); });

    await waitFor(() => {
      expect(screen.getByTestId('payment-result')).toBeInTheDocument();
      expect(screen.getByTestId('payment-result')).toHaveTextContent(/¡Pago aprobado!/);
    });
  });

  it('PG-08: pago rechazado muestra el motivo humano, no el código crudo', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          gateway_payment_id: 'mp-gw-003',
          status:             'rejected',
          status_detail:      'cc_rejected_insufficient_amount',
          order_number:       'ORD-001',
          amount:             '500.00',
        }),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));
    await act(async () => { mockCardFormSubmitFn?.(); });

    await waitFor(() => {
      const result = screen.getByTestId('payment-result');
      expect(result).toHaveTextContent(/No pudimos procesar tu pago/);
      // El detalle es el mensaje humano, no el código crudo.
      expect(screen.getByTestId('result-detail')).toHaveTextContent(/banco emisor/i);
      expect(screen.getByTestId('result-detail')).not.toHaveTextContent(/cc_rejected/);
    });
  });

  it('muestra mensaje de error si el gateway falla', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json(
          { detail: 'AMOUNT_MISMATCH', codigo_error: 'AMOUNT_MISMATCH' },
          { status: 422 },
        ),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));
    await act(async () => { mockCardFormSubmitFn?.(); });

    expect(await screen.findByRole('alert')).toHaveTextContent(/AMOUNT_MISMATCH/);
  });

  it('PG-10: OXXO/SPEI pendiente sondea el estado y navega al confirmarse', async () => {
    jest.useFakeTimers();
    server.use(
      http.get(`${BASE}/api/v2/payments/:id/status/`, () =>
        HttpResponse.json({ status: 'approved' }),
      ),
    );
    const store = configureStore({
      reducer: {
        payments: paymentsReducer,
        cards:    cardsReducer,
        auth:     () => ({ user: { email: 'buyer@test.com' } }),
      },
      preloadedState: {
        payments: {
          isActioning: false, actionError: null, lastAction: 'mp_non_card',
          lastInitiation: {
            gateway: 'mercadopago', status: 'pending',
            external_resource_url: 'https://mp.com/voucher/oxxo/abc',
            date_of_expiration: '2026-07-07T00:00:00Z',
          },
          lastRefund: null, lastCancellation: null,
        },
      },
    });
    render(wrap(<PaymentSelectionPage />, store));
    expect(screen.getByTestId('non-card-result')).toBeInTheDocument();
    // Al vencer el intervalo, /status/ devuelve approved → navega a confirmación.
    await act(async () => { await jest.advanceTimersByTimeAsync(6000); });
    expect(screen.getByText('Confirmación')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('vuelve a la seleccion al cancelar el CardForm', () => {
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-mp-card'));
    expect(screen.getByTestId('mp-card-form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByTestId('mp-card-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('method-btn-mp-card')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // UC-PAY-13: Métodos no-tarjeta
  // -------------------------------------------------------------------------

  it('UC-PAY-13: muestra NonCardPaymentForm al seleccionar OXXO', () => {
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-oxxo'));
    expect(screen.getByTestId('non-card-payment-form')).toBeInTheDocument();
    expect(screen.getByTestId('payer-email-input')).toBeInTheDocument();
  });

  it('UC-PAY-13: NonCardPaymentForm se pre-llena con email del usuario', () => {
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-oxxo'));
    expect(screen.getByTestId('payer-email-input')).toHaveValue('buyer@test.com');
  });

  it('UC-PAY-13: POST a /api/v2/payments/initiate/ sin token para OXXO', async () => {
    let capturedBody;
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          payment_id:            2,
          gateway_payment_id:    'mp-oxxo-001',
          status:                'pending',
          status_detail:         'pending_waiting_payment',
          order_number:          'ORD-001',
          amount:                '500.00',
          installments:          1,
          external_resource_url: 'https://www.mercadopago.com/mlm/payments/ticket/oxxo/abc',
          date_of_expiration:    '2026-07-01T23:59:59.000-06:00',
          transaction_data:      null,
        });
      }),
    );

    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-oxxo'));
    fireEvent.change(screen.getByTestId('payer-email-input'), { target: { value: 'test@test.com' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    });

    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        order_number:      'ORD-001',
        payment_method_id: 'oxxo',
        payer_email:       'test@test.com',
      });
      expect(capturedBody.token).toBeUndefined();
    });
  });

  it('UC-PAY-13: muestra non-card-result con voucher URL tras pago pendiente', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          payment_id:            2,
          gateway_payment_id:    'mp-oxxo-002',
          status:                'pending',
          status_detail:         'pending_waiting_payment',
          order_number:          'ORD-001',
          amount:                '500.00',
          installments:          1,
          external_resource_url: 'https://mp.com/ticket/oxxo/abc',
          date_of_expiration:    '2026-07-01T23:59:59.000-06:00',
          transaction_data:      null,
        }),
      ),
    );

    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-oxxo'));
    fireEvent.change(screen.getByTestId('payer-email-input'), { target: { value: 'test@test.com' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('non-card-result')).toBeInTheDocument();
      expect(screen.getByTestId('voucher-url')).toBeInTheDocument();
      expect(screen.getByTestId('expiry-display')).toBeInTheDocument();
    });
  });

  it('UC-PAY-13: muestra CLABE en resultado de SPEI', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          payment_id:            3,
          gateway_payment_id:    'mp-spei-001',
          status:                'pending',
          status_detail:         'pending_waiting_transfer',
          order_number:          'ORD-001',
          amount:                '500.00',
          installments:          1,
          external_resource_url: '',
          date_of_expiration:    '2026-07-01T23:59:59.000-06:00',
          transaction_data: {
            bank_account_id: '646180132800000002',
          },
        }),
      ),
    );

    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-clabe'));
    fireEvent.change(screen.getByTestId('payer-email-input'), { target: { value: 'test@test.com' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('non-card-result')).toBeInTheDocument();
      expect(screen.getByTestId('clabe-display')).toBeInTheDocument();
    });
  });

  it('UC-PAY-13: boton reintentar vuelve al selector tras pago rechazado', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          payment_id:         4,
          gateway_payment_id: 'mp-oxxo-003',
          status:             'rejected',
          status_detail:      'cc_rejected_other_reason',
          order_number:       'ORD-001',
          amount:             '500.00',
          installments:       1,
          external_resource_url: '',
          date_of_expiration:    '',
          transaction_data:      null,
        }),
      ),
    );

    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-oxxo'));
    fireEvent.change(screen.getByTestId('payer-email-input'), { target: { value: 'test@test.com' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('non-card-submit-btn'));
    });

    await waitFor(() => screen.getByTestId('non-card-result'));
    fireEvent.click(screen.getByRole('button', { name: /Intentar de nuevo/i }));
    expect(screen.getByTestId('mp-method-list')).toBeInTheDocument();
  });

  it('UC-PAY-13: vuelve al selector al cancelar NonCardPaymentForm', () => {
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByTestId('method-btn-oxxo'));
    expect(screen.getByTestId('non-card-payment-form')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cambiar método/i }));
    expect(screen.getByTestId('mp-method-list')).toBeInTheDocument();
  });
});
