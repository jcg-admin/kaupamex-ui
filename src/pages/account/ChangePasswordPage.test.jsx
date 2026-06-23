/**
 * Tests — ChangePasswordPage (UC-AUTH-08)
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../../redux/slices/authSlice';
import ChangePasswordPage from './ChangePasswordPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { id: 1, email: 'demo@test.mx' },
        isAuthenticated: true, isLoading: false, error: null,
      },
    },
  });

const renderPage = () =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>
    </Provider>,
  );

describe('ChangePasswordPage (UC-AUTH-08)', () => {
  it('renderiza el formulario con los 3 campos', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /cambiar contrasena/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/contrasena actual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nueva contrasena/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar nueva contrasena/i)).toBeInTheDocument();
  });

  it('valida que la contrasena actual sea obligatoria', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /guardar cambio/i }));
    await waitFor(() =>
      expect(screen.getByText(/contrasena actual es obligatoria/i)).toBeInTheDocument(),
    );
  });

  it('valida que la nueva contrasena tenga al menos 8 caracteres', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/contrasena actual/i), {
      target: { value: 'old123', name: 'oldPassword' },
    });
    fireEvent.change(screen.getByLabelText(/^nueva contrasena/i), {
      target: { value: 'short', name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contrasena/i), {
      target: { value: 'short', name: 'confirmPassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambio/i }));
    await waitFor(() => {
      const matches = screen.getAllByText(/al menos 8 caracteres/i);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('valida que confirmacion coincida con nueva contrasena', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/contrasena actual/i), {
      target: { value: 'OldPass1!', name: 'oldPassword' },
    });
    fireEvent.change(screen.getByLabelText(/^nueva contrasena/i), {
      target: { value: 'NewPass1!', name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contrasena/i), {
      target: { value: 'Different1!', name: 'confirmPassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambio/i }));
    await waitFor(() =>
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument(),
    );
  });

  it('envia POST a change-password y muestra confirmacion', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/auth/change-password/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ status: 'OK' });
      }),
    );
    renderPage();
    fireEvent.change(screen.getByLabelText(/contrasena actual/i), {
      target: { value: 'OldPass1!', name: 'oldPassword' },
    });
    fireEvent.change(screen.getByLabelText(/^nueva contrasena/i), {
      target: { value: 'NewPass1!', name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contrasena/i), {
      target: { value: 'NewPass1!', name: 'confirmPassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambio/i }));
    await waitFor(() =>
      expect(lastBody).toMatchObject({
        current_password: 'OldPass1!',
        new_password: 'NewPass1!',
        new_password_confirm: 'NewPass1!',
      }),
    );
    expect(
      await screen.findByText(/contrasena cambiada exitosamente/i),
    ).toBeInTheDocument();
  });

  it('muestra error de contrasena actual incorrecta (Alt A)', async () => {
    server.use(
      http.post(`${BASE}/api/v1/auth/change-password/`, () =>
        HttpResponse.json({ detail: 'La contrasena actual es incorrecta.' }, { status: 400 }),
      ),
    );
    renderPage();
    fireEvent.change(screen.getByLabelText(/contrasena actual/i), {
      target: { value: 'Wrong1!', name: 'oldPassword' },
    });
    fireEvent.change(screen.getByLabelText(/^nueva contrasena/i), {
      target: { value: 'NewPass1!', name: 'newPassword' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contrasena/i), {
      target: { value: 'NewPass1!', name: 'confirmPassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambio/i }));
    await waitFor(() =>
      expect(screen.getByText(/contrasena actual es incorrecta/i)).toBeInTheDocument(),
    );
  });
});
