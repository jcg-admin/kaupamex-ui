/**
 * Wishlist Slice — PracticaYoruba
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/wishlist/');
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleWishlistItem = createAsyncThunk(
  'wishlist/toggle',
  async (productId, { getState, rejectWithValue }) => {
    const { items } = getState().wishlist;
    const isInList  = items.some((i) => i.product_id === productId);
    try {
      if (isInList) {
        await apiService.delete(`/api/wishlist/${productId}/`);
        return { productId, action: 'removed' };
      } else {
        const res = await apiService.post('/api/wishlist/', { product_id: productId });
        return { productId, item: res.data, action: 'added' };
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items:     [],
    isLoading: false,
    error:     null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder.addCase(toggleWishlistItem.fulfilled, (state, action) => {
      const { productId, item, action: act } = action.payload;
      if (act === 'removed') {
        state.items = state.items.filter((i) => i.product_id !== productId);
      } else {
        state.items.push(item);
      }
    });
  },
});

export default wishlistSlice.reducer;
