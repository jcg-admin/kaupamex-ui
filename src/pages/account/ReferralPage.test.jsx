/**
 * Tests — ReferralPage
 * Programa de referidos: render de codigo + metricas (GET mockeado) y
 * canje (POST) en caminos de exito y error.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import referralReducer from '@redux/slices/referralSlice';
import ReferralPage from './ReferralPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { referral: referralReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

const GET_PAYLOAD = {
  code:                'YORUBA-42',
  share_link:          'https://practicayoruba.test/r/YORUBA-42',
  total_referrals:     5,
  completed_referrals: 3,
  rewards_earned:      150,
};

describe('ReferralPage', () => {
  it('renderiza el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v2/account/referral/`, () => HttpResponse.json(GET_PAYLOAD)),
    );
    render(wrap(<ReferralPage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Programa de referidos/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('muestra el codigo y las metricas tras el GET', async () => {
    server.use(
      http.get(`${BASE}/api/v2/account/referral/`, () => HttpResponse.json(GET_PAYLOAD)),
    );
    render(wrap(<ReferralPage />, makeStore()));

    expect(await screen.findByTestId('referral-code')).toHaveTextContent('YORUBA-42');
    expect(screen.getByTestId('total-referrals')).toHaveTextContent('5');
    expect(screen.getByTestId('completed-referrals')).toHaveTextContent('3');
    expect(screen.getByTestId('rewards-earned')).toHaveTextContent('150');
    expect(screen.getByLabelText(/Enlace para compartir/i)).toHaveValue(
      'https://practicayoruba.test/r/YORUBA-42',
    );
  });

  it('muestra el estado de programa deshabilitado ante un 404', async () => {
    server.use(
      http.get(`${BASE}/api/v2/account/referral/`, () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    );
    render(wrap(<ReferralPage />, makeStore()));

    expect(
      await screen.findByText(/programa de referidos no está disponible/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('referral-code')).not.toBeInTheDocument();
  });

  it('canjea un codigo correctamente y muestra confirmacion', async () => {
    server.use(
      http.get(`${BASE}/api/v2/account/referral/`, () => HttpResponse.json(GET_PAYLOAD)),
    );
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/account/referral/redeem/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ detail: 'ok' });
      }),
    );
    render(wrap(<ReferralPage />, makeStore()));

    await screen.findByTestId('referral-code');

    fireEvent.change(screen.getByTestId('redeem-code-input'), {
      target: { value: 'FRIEND-CODE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Canjear/i }));

    await waitFor(() => expect(lastBody).toMatchObject({ code: 'FRIEND-CODE' }));
    expect(
      await screen.findByText(/Código canjeado correctamente/i),
    ).toBeInTheDocument();
  });

  it('surface el mensaje del codigo_error al fallar el canje (422 self-referral)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/account/referral/`, () => HttpResponse.json(GET_PAYLOAD)),
    );
    server.use(
      http.post(`${BASE}/api/v2/account/referral/redeem/`, () =>
        HttpResponse.json(
          { codigo_error: 'SELF_REFERRAL_NOT_ALLOWED', detail: 'Self referral' },
          { status: 422 },
        ),
      ),
    );
    render(wrap(<ReferralPage />, makeStore()));

    await screen.findByTestId('referral-code');

    fireEvent.change(screen.getByTestId('redeem-code-input'), {
      target: { value: 'MY-OWN-CODE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Canjear/i }));

    expect(
      await screen.findByText(/No puedes canjear tu propio código/i),
    ).toBeInTheDocument();
  });
});
