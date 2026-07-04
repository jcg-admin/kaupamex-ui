/**
 * Tests — AdminWishlistMarketingPage (UC-WISH-04 / H-08)
 */
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import AdminWishlistMarketingPage from './AdminWishlistMarketingPage';

const BASE = process.env.API_URL || 'http://localhost:8000';
const URL = `${BASE}/api/v2/admin/wishlist/aggregate/`;

const wrap = (ui) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
};

describe('AdminWishlistMarketingPage', () => {
  it('muestra los productos más deseados en una tabla', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          results: [
            { product_id: 1, name: 'Elekes de Yemayá', times_wishlisted: 12, distinct_users: 9 },
            { product_id: 2, name: 'Otán de Shangó',   times_wishlisted: 5,  distinct_users: 5 },
          ],
          count: 2,
        }),
      ),
    );
    render(wrap(<AdminWishlistMarketingPage />));
    expect(await screen.findByTestId('wishlist-marketing-table')).toBeInTheDocument();
    expect(screen.getByText('Elekes de Yemayá')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('muestra un vacío honesto cuando no hay datos', async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ results: [], count: 0 })),
    );
    render(wrap(<AdminWishlistMarketingPage />));
    expect(
      await screen.findByTestId('wishlist-marketing-empty')
    ).toBeInTheDocument();
  });
});
