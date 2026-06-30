/**
 * Catalog Slice — PracticaYoruba
 * Gestiona el catálogo de productos: listado, detalle, búsqueda y filtros.
 *
 * Sprint 5: URLs corregidas a /api/v2/products/* (anteriormente /api/products/)
 *           campo base_price (anteriormente price)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// =============================================================================
// Thunks
// =============================================================================

export const fetchProducts = createAsyncThunk(
  'catalog/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/v2/products/', { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'catalog/fetchProduct',
  async (slug, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`/api/v2/products/${slug}/`);
      return res.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

export const searchProducts = createAsyncThunk(
  'catalog/searchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/v2/catalogue/search/', { params });
      return { ...res.data, query: params.q };
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'catalog/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/v2/products/', {
        params: { is_featured: true, page_size: 8 },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/v2/categories/', { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
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
    featured:        [],
    categories:      [],
    pagination: {
      count:      0,
      page:       1,
      pageSize:   20,
      totalPages: 0,
      next:       null,
      previous:   null,
    },
    filters: {
      category:  [],          // multi-categoria (T-11 follow-up): arreglo de slugs
      priceMin:  null,
      priceMax:  null,
      inStock:   false,
      ordering:  '-created_at',
    },
    isLoading:      false,
    isSearching:    false,
    error:          null,
    categoriesError: null,
    searchError:    null,
  },

  reducers: {
    setFilter(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters(state) {
      state.filters = {
        category: [], priceMin: null, priceMax: null,
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
        state.error     = null;
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

    // fetchFeaturedProducts
    builder
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        const { results } = action.payload;
        state.featured  = results ?? action.payload;
        state.isLoading = false;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // fetchCategories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories     = Array.isArray(action.payload) ? action.payload : (action.payload.results ?? []);
        state.isLoading      = false;
        state.categoriesError = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading      = false;
        state.categoriesError = action.payload;
        // state.error is intentionally NOT set here — categories failure
        // must not trigger the product loading error banner.
      });
  },
});

export const {
  setFilter, clearFilters, setPage,
  clearSearch, clearCurrentProduct,
} = catalogSlice.actions;

export default catalogSlice.reducer;
