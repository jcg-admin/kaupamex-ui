/**
 * Catalog Slice — PracticaYoruba
 * Gestiona el catálogo de productos: listado, detalle, búsqueda y filtros
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

export const fetchProducts = createAsyncThunk(
  'catalog/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/products/', { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'catalog/fetchProduct',
  async (slug, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`/api/products/${slug}/`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/categories/');
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchProducts = createAsyncThunk(
  'catalog/search',
  async (query, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/products/search/', { params: { q: query } });
      return { results: res.data, query };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    products:      [],
    currentProduct: null,
    categories:    [],
    searchResults: [],
    searchQuery:   '',
    pagination: {
      count: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    },
    filters: {
      category:  null,
      priceMin:  null,
      priceMax:  null,
      inStock:   false,
      ordering:  '-created_at',
    },
    isLoading:        false,
    isSearching:      false,
    error:            null,
  },
  reducers: {
    setFilter(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters(state) {
      state.filters = {
        category: null, priceMin: null, priceMax: null,
        inStock: false, ordering: '-created_at',
      };
      state.pagination.page = 1;
    },
    setPage(state, action) {
      state.pagination.page = action.payload;
    },
    clearSearch(state) {
      state.searchResults = [];
      state.searchQuery   = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const { results, count, next } = action.payload;
        state.products = results ?? action.payload;
        if (count !== undefined) {
          state.pagination.count = count;
          state.pagination.totalPages = Math.ceil(count / state.pagination.pageSize);
        }
        state.isLoading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchProduct.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });

    builder
      .addCase(searchProducts.pending,   (state) => { state.isSearching = true; })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isSearching  = false;
        state.searchResults = action.payload.results;
        state.searchQuery   = action.payload.query;
      })
      .addCase(searchProducts.rejected, (state) => { state.isSearching = false; });
  },
});

export const { setFilter, clearFilters, setPage, clearSearch } = catalogSlice.actions;
export default catalogSlice.reducer;
