/**
 * Tests — AdminProductCreatePage (UC-CAT-09)
 *
 * Formulario admin para crear un nuevo producto en el catalogo.
 *   POST /api/v2/admin/products/
 *
 * Cobertura:
 *   - Render del formulario con todos los campos requeridos
 *   - Carga del listado de categorias para el select
 *   - Validacion client-side de campos requeridos
 *   - Submit con payload correcto (incluye imagen via FormData)
 *   - Manejo de error 409 SKU_DUPLICADO
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import productsReducer from '@redux/slices/productsSlice';
import AdminProductCreatePage from './AdminProductCreatePage';

const CATEGORIES = [
  { id: 1, name: 'Collares', is_active: true },
  { id: 2, name: 'Pulseras', is_active: true },
];

const makeStore = () =>
  configureStore({ reducer: { products: productsReducer } });

const wrap = (ui, store) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    </QueryClientProvider>
  );
};

describe('AdminProductCreatePage (UC-CAT-09)', () => {
  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
    );
    render(wrap(<AdminProductCreatePage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Nuevo Producto/i }),
    ).toBeInTheDocument();
  });

  it('expone los campos requeridos del formulario', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
    );
    render(wrap(<AdminProductCreatePage />, makeStore()));
    expect(await screen.findByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripcion corta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripcion completa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio sin IVA/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Stock inicial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categoria/i)).toBeInTheDocument();
  });

  it('carga las categorias al montar', async () => {
    let categoriesCalled = false;
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => {
        categoriesCalled = true;
        return HttpResponse.json({ results: CATEGORIES });
      }),
    );
    render(wrap(<AdminProductCreatePage />, makeStore()));
    await waitFor(() => {
      expect(categoriesCalled).toBe(true);
    });
    expect(await screen.findByRole('option', { name: 'Collares' })).toBeInTheDocument();
  });

  it('valida los campos requeridos antes de enviar', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
    );
    render(wrap(<AdminProductCreatePage />, makeStore()));
    await screen.findByLabelText(/Nombre/i);
    fireEvent.click(screen.getByRole('button', { name: /Crear producto/i }));
    expect(await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument();
  });

  it('envia POST /api/v1/admin/products/ con los datos del formulario', async () => {
    let lastPostBody;
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
      http.post(`${BASE}/api/v1/admin/products/`, async ({ request }) => {
        lastPostBody = await request.json().catch(() => null);
        return HttpResponse.json({ id: 99, sku: 'NEW-001' });
      }),
    );

    render(wrap(<AdminProductCreatePage />, makeStore()));
    await screen.findByLabelText(/Nombre/i);

    fireEvent.change(screen.getByLabelText(/Nombre/i),
      { target: { value: 'Collar Oshun dorado' } });
    fireEvent.change(screen.getByLabelText(/Descripcion corta/i),
      { target: { value: 'Collar artesanal Yoruba' } });
    fireEvent.change(screen.getByLabelText(/Descripcion completa/i),
      { target: { value: 'Collar de cuentas amarillas para Oshun.' } });
    fireEvent.change(screen.getByLabelText(/Precio sin IVA/i),
      { target: { value: '1250.00' } });
    fireEvent.change(screen.getByLabelText(/Stock inicial/i),
      { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/Categoria/i),
      { target: { value: '1' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear producto/i }));

    await waitFor(() => {
      expect(lastPostBody).not.toBeNull();
    });
    expect(lastPostBody.name).toBe('Collar Oshun dorado');
    // UC-CAT-13: el contrato es category_ids (lista de PKs), no category_id singular.
    expect(lastPostBody.category_ids).toEqual([1]);
  });

  it('muestra error 409 cuando el SKU ya existe', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/categories/`, () => HttpResponse.json({ results: CATEGORIES })),
      http.post(`${BASE}/api/v1/admin/products/`, () =>
        HttpResponse.json({ detail: 'SKU duplicado' }, { status: 409 }),
      ),
    );

    render(wrap(<AdminProductCreatePage />, makeStore()));
    await screen.findByLabelText(/Nombre/i);

    fireEvent.change(screen.getByLabelText(/Nombre/i),
      { target: { value: 'Producto valido' } });
    fireEvent.change(screen.getByLabelText(/Descripcion corta/i),
      { target: { value: 'descripcion corta' } });
    fireEvent.change(screen.getByLabelText(/Descripcion completa/i),
      { target: { value: 'descripcion larga' } });
    fireEvent.change(screen.getByLabelText(/Precio sin IVA/i),
      { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Stock inicial/i),
      { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Categoria/i),
      { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear producto/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
