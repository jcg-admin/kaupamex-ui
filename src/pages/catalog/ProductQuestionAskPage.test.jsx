/**
 * Tests — ProductQuestionAskPage
 * UC-QST-01: el visitante hace una pregunta sobre un producto.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import questionsReducer from '@redux/slices/questionsSlice';
import ProductQuestionAskPage from './ProductQuestionAskPage';

const makeStore = () =>
  configureStore({ reducer: { questions: questionsReducer } });

const wrap = (initialPath = '/catalog/42/ask') => (
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/catalog/:productId/ask" element={<ProductQuestionAskPage />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('ProductQuestionAskPage (UC-QST-01)', () => {
  it('muestra el formulario de pregunta', () => {
    render(wrap());
    expect(
      screen.getByRole('heading', { name: /Hacer pregunta/i }),
    ).toBeInTheDocument();
  });

  it('exige una pregunta con longitud minima', () => {
    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: /Enviar pregunta/i }));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/La pregunta es obligatoria/i)).toBeInTheDocument();
  });

  it('al enviar, hace POST al endpoint del producto', async () => {
    apiService.post.mockResolvedValue({ data: { id: 9 } });
    render(wrap());

    fireEvent.change(screen.getByLabelText(/Tu pregunta/i),
      { target: { value: 'Cual es la talla recomendada para mediana?' } });
    fireEvent.change(screen.getByLabelText(/Email/i),
      { target: { value: 'visitante@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar pregunta/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/products/42/questions/',
        expect.objectContaining({
          body:  'Cual es la talla recomendada para mediana?',
          email: 'visitante@example.com',
        }),
      );
    });
  });

  it('muestra confirmacion al recibir', async () => {
    apiService.post.mockResolvedValue({ data: { id: 9 } });
    render(wrap());
    fireEvent.change(screen.getByLabelText(/Tu pregunta/i),
      { target: { value: 'Una pregunta sufficientemente larga.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar pregunta/i }));
    expect(
      await screen.findByText(/Pregunta recibida/i),
    ).toBeInTheDocument();
  });
});
