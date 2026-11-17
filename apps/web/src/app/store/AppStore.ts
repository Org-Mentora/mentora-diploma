import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/model/api/baseApi';

function createStore() {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  setupListeners(store.dispatch);
  return store;
}

export type ReduxStore = ReturnType<typeof createStore>;

// Singleton
export class AppStore {
  static #instance: ReduxStore | undefined;

  private constructor() {}

  static getInstance(): ReduxStore {
    AppStore.#instance ??= createStore();
    return AppStore.#instance;
  }

  static create(): ReduxStore {
    return createStore();
  }
}
