/**
 * ReviewItem — botón "¿te resultó útil?" (COV-02, UC-REV-02).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import reviewsReducer from '@redux/slices/reviewsSlice';
import ReviewItem from './ReviewItem';

const BASE = process.env.API_URL || 'http://localhost:8000';
const store = () => configureStore({ reducer: { reviews: reviewsReducer } });
const review = { id: 9, rating: 5, title: 'Bueno', body: 'Muy bueno', helpful_count: 0 };

const wrap = (props) => (
  <Provider store={store()}><ReviewItem review={review} {...props} /></Provider>
);

describe('ReviewItem helpful vote (COV-02)', () => {
  it('sin productId no muestra el botón de útil', () => {
    render(wrap());
    expect(screen.queryByRole('button', { name: /útil/i })).not.toBeInTheDocument();
  });

  it('con productId vota y muestra el conteo devuelto', async () => {
    let posted = false;
    server.use(
      http.post(`${BASE}/api/v2/products/7/reviews/9/helpful-votes/`, () => {
        posted = true;
        return HttpResponse.json({ helpful_count: 3 });
      }),
    );
    render(wrap({ productId: 7 }));
    fireEvent.click(screen.getByRole('button', { name: /¿Te resultó útil/i }));
    await waitFor(() => expect(posted).toBe(true));
    expect(await screen.findByText(/3 personas lo encontró útil/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gracias/ })).toBeDisabled();
  });

  it('un 400 (reseña propia) deshabilita el botón sin romper', async () => {
    server.use(
      http.post(`${BASE}/api/v2/products/7/reviews/9/helpful-votes/`, () =>
        HttpResponse.json({ codigo_error: 'CANNOT_VOTE_OWN_REVIEW', detail: 'x' }, { status: 400 }),
      ),
    );
    render(wrap({ productId: 7 }));
    fireEvent.click(screen.getByRole('button', { name: /¿Te resultó útil/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Gracias/ })).toBeDisabled(),
    );
  });
});
