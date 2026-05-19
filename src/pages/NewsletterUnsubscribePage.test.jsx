/**
 * Tests — NewsletterUnsubscribePage
 * UC-NEW-02: desuscripcion publica via token firmado del email.
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
import NewsletterUnsubscribePage from './NewsletterUnsubscribePage';

const makeStore = () =>
  configureStore({ reducer: { newsletter: newsletterReducer } });

const wrap = (initialPath = '/newsletter/unsubscribe?token=abc123') => (
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={[initialPath]}>
      <NewsletterUnsubscribePage />
    </MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('NewsletterUnsubscribePage (UC-NEW-02)', () => {
  it('muestra el titulo y el motivo opcional', () => {
    render(wrap());
    expect(
      screen.getByRole('heading', { name: /Desuscribirte del newsletter/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo/i)).toBeInTheDocument();
  });

  it('al confirmar, hace POST a /api/v1/newsletter/unsubscribe/ con el token', async () => {
    apiService.post.mockResolvedValue({ data: { ok: true } });
    render(wrap());

    fireEvent.change(screen.getByLabelText(/Motivo/i),
      { target: { value: 'TOO_FREQUENT' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar desuscripci[oó]n/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/newsletter/unsubscribe/',
        expect.objectContaining({
          token:  'abc123',
          reason: 'TOO_FREQUENT',
        }),
      );
    });
  });

  it('muestra confirmacion tras el envio', async () => {
    apiService.post.mockResolvedValue({ data: { ok: true } });
    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: /Confirmar desuscripci[oó]n/i }));
    expect(
      await screen.findByText(/Te has desuscrito correctamente/i),
    ).toBeInTheDocument();
  });

  it('advierte si el token no esta en la URL', () => {
    render(wrap('/newsletter/unsubscribe'));
    expect(
      screen.getByText(/Enlace de desuscripci[oó]n no v[aá]lido/i),
    ).toBeInTheDocument();
  });
});
