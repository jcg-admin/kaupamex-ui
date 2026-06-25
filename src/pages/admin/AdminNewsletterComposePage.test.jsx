/**
 * Tests — AdminNewsletterComposePage
 * UC-NEW-04: el admin compone y envia (o programa) una campana.
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
import AdminNewsletterComposePage from './AdminNewsletterComposePage';

const makeStore = () =>
  configureStore({ reducer: { newsletter: newsletterReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('AdminNewsletterComposePage (UC-NEW-04)', () => {
  it('muestra el titulo del compositor', () => {
    render(wrap(<AdminNewsletterComposePage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Nueva campa[nñ]a/i }),
    ).toBeInTheDocument();
  });

  it('exige asunto, html y texto plano antes de enviar', () => {
    render(wrap(<AdminNewsletterComposePage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Enviar campa[nñ]a/i }));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/El asunto es obligatorio/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST a /api/v2/admin/newsletter/campaigns/', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 5, status: 'QUEUED', recipients_count: 120 },
    });
    render(wrap(<AdminNewsletterComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Boletin de mayo' } });
    fireEvent.change(screen.getByLabelText(/Contenido HTML/i),
      { target: { value: '<p>Hola</p>' } });
    fireEvent.change(screen.getByLabelText(/Contenido en texto plano/i),
      { target: { value: 'Hola' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar campa[nñ]a/i }));
    // H-CICLO118-03: componente muestra dialogo de confirmacion antes de despachar
    fireEvent.click(await screen.findByRole('button', { name: /S[ií], enviar/i }));

    await waitFor(() => {
      // T-117 D-04 (iter 19): canon API
      // CampaignCreateSerializer expone {subject, body, audience_filter}.
      // Test antes asertaba {html_body, text_body, segment} soft-on-tests
      // del bug. UI ahora mapea html_body -> body + segment ALL_ACTIVE
      // -> audience_filter CONFIRMED (canon SubscriberStatus).
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v2/admin/newsletter/campaigns/',
        expect.objectContaining({
          subject:         'Boletin de mayo',
          body:            '<p>Hola</p>',
          audience_filter: 'CONFIRMED',
        }),
      );
    });
  });

  it('muestra el reporte de exito con el numero de destinatarios', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 5, status: 'QUEUED', recipients_count: 120 },
    });
    render(wrap(<AdminNewsletterComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Boletin' } });
    fireEvent.change(screen.getByLabelText(/Contenido HTML/i),
      { target: { value: '<p>x</p>' } });
    fireEvent.change(screen.getByLabelText(/Contenido en texto plano/i),
      { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar campa[nñ]a/i }));
    fireEvent.click(await screen.findByRole('button', { name: /S[ií], enviar/i }));

    expect(
      await screen.findByText(/120 destinatarios/i),
    ).toBeInTheDocument();
  });

  // T-117 D-04 (iter 19): scheduled_at field deferred a T-116b
  // pipeline epic (~3-4 semanas con Celery + storage). Backend
  // CampaignCreateSerializer NO acepta scheduled_at por ahora.
  // Test skipeado preservando intent para reactivar cuando T-116b
  // implemente scheduling. Anti-soft: el test antes asertaba
  // scheduled_at en payload que NO se enviaba al backend.
  it.skip('permite programar el envio futuro (deferred T-116b)', async () => {
    apiService.post.mockResolvedValue({ data: { id: 6, status: 'SCHEDULED' } });
    render(wrap(<AdminNewsletterComposePage />, makeStore()));

    fireEvent.change(screen.getByLabelText(/Asunto/i),
      { target: { value: 'Programada' } });
    fireEvent.change(screen.getByLabelText(/Contenido HTML/i),
      { target: { value: '<p>x</p>' } });
    fireEvent.change(screen.getByLabelText(/Contenido en texto plano/i),
      { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText(/Programar para/i),
      { target: { value: '2026-06-01T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar campa[nñ]a/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v2/admin/newsletter/campaigns/',
        expect.objectContaining({
          scheduled_at: '2026-06-01T10:00',
        }),
      );
    });
  });
});
