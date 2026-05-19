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

  it('al enviar, hace POST a /api/v1/admin/newsletter/campaigns/', async () => {
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

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/newsletter/campaigns/',
        expect.objectContaining({
          subject:   'Boletin de mayo',
          html_body: '<p>Hola</p>',
          text_body: 'Hola',
          segment:   'ALL_ACTIVE',
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

    expect(
      await screen.findByText(/120 destinatarios/i),
    ).toBeInTheDocument();
  });

  it('permite programar el envio futuro', async () => {
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
        '/api/v1/admin/newsletter/campaigns/',
        expect.objectContaining({
          scheduled_at: '2026-06-01T10:00',
        }),
      );
    });
  });
});
