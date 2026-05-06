/**
 * Catalog Slice — PracticaYoruba
 * Gestiona el catálogo de productos: listado, detalle, búsqueda y filtros.
 *
 * Sprint 5: URLs corregidas a /api/v1/catalogue/* (anteriormente /api/products/)
 *           campo base_price (anteriormente price)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

// =============================================================================
// Thunks
// =============================================================================

export const fetchProducts = createAsyncThunk(
  'catalog/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/v1/catalogue/', { params });
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
      const res = await apiService.get(`/api/v1/catalogue/${slug}/`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchProducts = createAsyncThunk(
  'catalog/searchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/v1/catalogue/search/', { params });
      return { ...res.data, query: params.q };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// =============================================================================
// Slice
// =============================================================================

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    products:        [],
    currentProduct:  null,
    searchResults:   [],
    searchQuery:     '',
    activeFilters:   {},
    pagination: {
      count:      0,
      page:       1,
      pageSize:   20,
      totalPages: 0,
      next:       null,
      previous:   null,
    },
    filters: {
      category:  null,
      priceMin:  null,
      priceMax:  null,
      inStock:   false,
      ordering:  '-created_at',
    },
    isLoading:   false,
    isSearching: false,
    error:       null,
    searchError: null,
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
      state.searchError   = null;
      state.activeFilters = {};
    },
    clearCurrentProduct(state) {
      state.currentProduct = null;
    },
  },

  extraReducers: (builder) => {
    // fetchProducts
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const { results, count, next, previous } = action.payload;
        state.products              = results ?? action.payload;
        state.pagination.count      = count ?? 0;
        state.pagination.next       = next ?? null;
        state.pagination.previous   = previous ?? null;
        state.pagination.totalPages = count
          ? Math.ceil(count / state.pagination.pageSize)
          : 0;
        state.isLoading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // fetchProduct
    builder
      .addCase(fetchProduct.pending, (state) => {
        state.isLoading      = true;
        state.currentProduct = null;
        state.error          = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
        state.isLoading      = false;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // searchProducts
    builder
      .addCase(searchProducts.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        const { results, count, active_filters, query } = action.payload;
        state.isSearching   = false;
        state.searchResults = results ?? [];
        state.searchQuery   = query ?? '';
        state.activeFilters = active_filters ?? {};
        state.pagination.count      = count ?? 0;
        state.pagination.totalPages = count
          ? Math.ceil(count / state.pagination.pageSize)
          : 0;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload;
      });
  },
});

export const {
  setFilter, clearFilters, setPage,
  clearSearch, clearCurrentProduct,
} = catalogSlice.actions;

export default catalogSlice.reducer;
