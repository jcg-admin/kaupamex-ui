/**
 * Tests — NewsletterSubscribePage
 * UC-NEW-01: suscripcion publica al newsletter (doble optin).
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
import newsletterReducer from '@redux/slices/newsletterSlice';
import NewsletterSubscribePage from './NewsletterSubscribePage';

const makeStore = () =>
  configureStore({ reducer: { newsletter: newsletterReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('NewsletterSubscribePage (UC-NEW-01)', () => {
  it('muestra el formulario de suscripcion', () => {
    render(wrap(<NewsletterSubscribePage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Suscr[ií]bete al newsletter/i }),
    ).toBeInTheDocument();
  });

  it('exige email valido antes de enviar', () => {
    render(wrap(<NewsletterSubscribePage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Suscribirme/i }));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/El email es obligatorio/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST a /api/v1/newsletter/subscribe/', async () => {
    apiService.post.mockResolvedValue({ data: { id: 1, status: 'PENDING' } });
    render(wrap(<NewsletterSubscribePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'lector@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Suscribirme/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/newsletter/subscribe/',
        expect.objectContaining({
          email:  'lector@example.com',
          source: 'page',
        }),
      );
    });
  });

  it('muestra confirmacion tras el envio', async () => {
    apiService.post.mockResolvedValue({ data: { id: 1 } });
    render(wrap(<NewsletterSubscribePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'lector@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Suscribirme/i }));

    expect(
      await screen.findByText(/Revisa tu email para confirmar/i),
    ).toBeInTheDocument();
  });

  it('muestra mensaje si el email ya esta suscrito', async () => {
    apiService.post.mockRejectedValue({
      message: 'Este email ya esta suscrito al newsletter',
      code:    'YA_SUSCRITO',
      status:  409,
    });
    render(wrap(<NewsletterSubscribePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'lector@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Suscribirme/i }));

    expect(
      await screen.findByText(/ya esta suscrito/i),
    ).toBeInTheDocument();
  });
});
