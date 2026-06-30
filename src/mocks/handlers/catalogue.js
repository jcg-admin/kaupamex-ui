import { http, HttpResponse } from 'msw';
import { makeProduct } from '../factories/product';

const BASE = process.env.API_URL || 'http://localhost:8000';

const CATEGORIES = [
  { id: 1, name: 'Velas', slug: 'velas' },
  { id: 2, name: 'Collares', slug: 'collares' },
  { id: 3, name: 'Tableros', slug: 'tableros' },
];

export const catalogueHandlers = [
  http.get(`${BASE}/api/v2/products/`, ({ request }) => {
    const url    = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const count  = 6;
    const results = Array.from({ length: count }, (_, i) =>
      makeProduct({ id: i + 1, name: `Producto ${i + 1} ${search}`.trim() }),
    );
    return HttpResponse.json({ count, next: null, previous: null, results });
  }),

  http.get(`${BASE}/api/v2/products/:slug/`, ({ params }) =>
    HttpResponse.json(makeProduct({ slug: params.slug })),
  ),

  http.get(`${BASE}/api/v2/categories/`, () =>
    HttpResponse.json({ count: CATEGORIES.length, results: CATEGORIES }),
  ),
];
