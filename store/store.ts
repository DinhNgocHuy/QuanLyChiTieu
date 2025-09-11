// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Thêm các reducer khác ở đây nếu cần: user, cart, settings...
  },
});

// Infer các kiểu `RootState` và `AppDispatch` từ store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;