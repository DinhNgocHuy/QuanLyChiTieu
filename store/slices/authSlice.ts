// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: string | null;
    email: string | null;
    token: string | null;
  };
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: {
    id: null,
    email: null,
    token: null,
  },
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ id: string; email: string; token: string }>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = {
        id: null,
        email: null,
        token: null,
      };
      state.isAuthenticated = false;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;