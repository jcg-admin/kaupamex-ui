/**
 * Tests — NewsletterSubscribePage
 * UC-NEW-01: suscripcion publica al newsletter (doble optin).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import newsletterReducer from '@redux/slices/newsletterSlice';
import NewsletterSubscribePage from './NewsletterSubscribePage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { newsletter: newsletterReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

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
    expect(screen.getByText(/El email es obligatorio/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST a /api/v2/newsletter/subscriptions/', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/newsletter/subscriptions/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 1, status: 'PENDING' });
      }),
    );
    render(wrap(<NewsletterSubscribePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'lector@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Suscribirme/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        email:  'lector@example.com',
        source: 'page',
      });
    });
  });

  it('muestra confirmacion tras el envio', async () => {
    server.use(
      http.post(`${BASE}/api/v2/newsletter/subscriptions/`, () =>
        HttpResponse.json({ id: 1 }),
      ),
    );
    render(wrap(<NewsletterSubscribePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'lector@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Suscribirme/i }));

    expect(
      await screen.findByText(/Revisa tu email para confirmar/i),
    ).toBeInTheDocument();
  });

  it('muestra mensaje si el email ya esta suscrito', async () => {
    // ConflictError (409) usa response.data.message como mensaje.
    // Se pone el texto en `message` para que createErrorFromResponse lo propague.
    server.use(
      http.post(`${BASE}/api/v2/newsletter/subscriptions/`, () =>
        HttpResponse.json(
          { message: 'Este email ya esta suscrito al newsletter', codigo_error: 'YA_SUSCRITO' },
          { status: 409 },
        ),
      ),
    );
    render(wrap(<NewsletterSubscribePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'lector@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Suscribirme/i }));

    expect(
      await screen.findByText(/ya esta suscrito/i),
    ).toBeInTheDocument();
  });
});
