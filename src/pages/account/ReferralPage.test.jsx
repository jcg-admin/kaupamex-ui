/**
 * Tests — ReferralPage
 * Programa de referidos: render de codigo + metricas (GET mockeado) y
 * canje (POST) en caminos de exito y error.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import referralReducer from '@redux/slices/referralSlice';
import ReferralPage from './ReferralPage';

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

afterEach(() => jest.clearAllMocks());

describe('ReferralPage', () => {
  it('renderiza el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: GET_PAYLOAD });
    render(wrap(<ReferralPage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Programa de referidos/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('muestra el codigo y las metricas tras el GET', async () => {
    apiService.get.mockResolvedValue({ data: GET_PAYLOAD });
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
    apiService.get.mockRejectedValue({
      message: 'Not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    });
    render(wrap(<ReferralPage />, makeStore()));

    expect(
      await screen.findByText(/programa de referidos no está disponible/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('referral-code')).not.toBeInTheDocument();
  });

  it('canjea un codigo correctamente y muestra confirmacion', async () => {
    apiService.get.mockResolvedValue({ data: GET_PAYLOAD });
    apiService.post.mockResolvedValue({ data: { detail: 'ok' } });
    render(wrap(<ReferralPage />, makeStore()));

    await screen.findByTestId('referral-code');

    fireEvent.change(screen.getByTestId('redeem-code-input'), {
      target: { value: 'FRIEND-CODE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Canjear/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/account/referral/redeem/',
        { code: 'FRIEND-CODE' },
      );
    });
    expect(
      await screen.findByText(/Código canjeado correctamente/i),
    ).toBeInTheDocument();
  });

  it('surface el mensaje del codigo_error al fallar el canje (422 self-referral)', async () => {
    apiService.get.mockResolvedValue({ data: GET_PAYLOAD });
    apiService.post.mockRejectedValue({
      message: 'Self referral',
      code: 'SELF_REFERRAL_NOT_ALLOWED',
      statusCode: 422,
    });
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
