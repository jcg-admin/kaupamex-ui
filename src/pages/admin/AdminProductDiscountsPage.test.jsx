/**
 * Tests — AdminProductDiscountsPage
 * UC-DASH-04: Ver descuentos activos del catalogo
 * UC-DASH-03: Desactivar descuento (acceso desde la lista)
 * UC-DASH-01: Abrir formulario de crear descuento
 * UC-DASH-02: Abrir formulario de editar descuento
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }        from 'react-redux';
import { MemoryRouter }    from 'react-router-dom';
import { configureStore }  from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import productDiscountsReducer from '@redux/slices/productDiscountsSlice';
import AdminProductDiscountsPage from './AdminProductDiscountsPage';

const DISCOUNTS = [
  {
    id: 1, product_id: 10, product_name: 'Camiseta Yoruba',
    discount_pct: 15.0, valid_from: '2026-01-01', valid_until: '2026-12-31',
    status: 'CURRENT', is_active: true,
    original_price: 100, discounted_price: 85,
  },
  {
    id: 2, product_id: 11, product_name: 'Libro de gramatica',
    discount_pct: 25.0, valid_from: '2026-07-01', valid_until: null,
    status: 'FUTURE', is_active: true,
    original_price: 50, discounted_price: 37.5,
  },
  {
    id: 3, product_id: 12, product_name: 'Curso online',
    discount_pct: 10.0, valid_from: '2025-01-01', valid_until: '2025-12-31',
    status: 'EXPIRED', is_active: true,
    original_price: 200, discounted_price: 180,
  },
];

const makeStore = () =>
  configureStore({ reducer: { productDiscounts: productDiscountsReducer } });

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

afterEach(() => jest.clearAllMocks());

describe('AdminProductDiscountsPage — listado (UC-DASH-04)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Descuentos de Producto/i }),
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con los descuentos clasificados', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    expect(await screen.findByText('Camiseta Yoruba')).toBeInTheDocument();
    expect(screen.getByText('Libro de gramatica')).toBeInTheDocument();
    expect(screen.getByText('Curso online')).toBeInTheDocument();
  });

  it('muestra los porcentajes y precios con descuento', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');
    expect(screen.getByText(/15(\.0+)?%/)).toBeInTheDocument();
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay descuentos', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    expect(
      await screen.findByText(/No hay descuentos activos/i),
    ).toBeInTheDocument();
  });

  it('expone un boton para crear un nuevo descuento', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    expect(
      await screen.findByRole('button', { name: /Nuevo descuento/i }),
    ).toBeInTheDocument();
  });

  it('permite filtrar por estado de vigencia', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');

    const select = screen.getByLabelText(/Estado/i);
    fireEvent.change(select, { target: { value: 'CURRENT' } });

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/product-discounts/',
        expect.objectContaining({ params: { status: 'CURRENT' } }),
      );
    });
  });

  it('muestra mensaje de error cuando la API falla', async () => {
    apiService.get.mockRejectedValue(
      Object.assign(new Error('Boom'), { code: 'INTERNAL_SERVER_ERROR' }),
    );
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    expect(
      await screen.findByText(/No se pudieron cargar los descuentos/i),
    ).toBeInTheDocument();
  });
});

describe('AdminProductDiscountsPage — desactivar (UC-DASH-03)', () => {
  it('muestra un boton de desactivar por cada descuento', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');
    expect(screen.getByRole('button', {
      name: /Desactivar descuento Camiseta Yoruba/i,
    })).toBeInTheDocument();
  });

  it('llama al endpoint de desactivar al confirmar', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    apiService.post.mockResolvedValue({
      data: { ...DISCOUNTS[0], is_active: false },
    });

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');

    fireEvent.click(screen.getByRole('button', {
      name: /Desactivar descuento Camiseta Yoruba/i,
    }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/product-discounts/1/deactivate/'),
      );
    });

    confirmSpy.mockRestore();
  });

  it('no llama al endpoint si el admin cancela la confirmacion', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');

    fireEvent.click(screen.getByRole('button', {
      name: /Desactivar descuento Camiseta Yoruba/i,
    }));
    expect(apiService.post).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('muestra mensaje de error cuando la desactivacion falla', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    apiService.post.mockRejectedValue(
      Object.assign(new Error('Conflict'), {
        code: 'DESCUENTO_YA_INACTIVO',
        status: 409,
      }),
    );
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');

    fireEvent.click(screen.getByRole('button', {
      name: /Desactivar descuento Camiseta Yoruba/i,
    }));

    expect(
      await screen.findByText(/no se pudo desactivar/i),
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});

describe('AdminProductDiscountsPage — crear (UC-DASH-01)', () => {
  it('abre el modal al pulsar Nuevo descuento', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');

    fireEvent.click(screen.getByRole('button', { name: /Nuevo descuento/i }));
    expect(
      await screen.findByRole('dialog', { name: /Nuevo descuento de producto/i }),
    ).toBeInTheDocument();
  });
});

describe('AdminProductDiscountsPage — editar (UC-DASH-02)', () => {
  it('muestra un boton de editar por cada descuento', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');
    expect(screen.getByRole('button', {
      name: /Editar descuento Camiseta Yoruba/i,
    })).toBeInTheDocument();
  });

  it('abre el modal de edicion al pulsar Editar', async () => {
    apiService.get.mockResolvedValue({ data: { results: DISCOUNTS } });
    render(wrap(<AdminProductDiscountsPage />, makeStore()));
    await screen.findByText('Camiseta Yoruba');

    fireEvent.click(screen.getByRole('button', {
      name: /Editar descuento Camiseta Yoruba/i,
    }));

    expect(
      await screen.findByRole('dialog', { name: /Editar descuento de producto/i }),
    ).toBeInTheDocument();
  });
});
