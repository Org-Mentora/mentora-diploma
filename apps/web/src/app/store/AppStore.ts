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
export type RootState = ReturnType<ReduxStore['getState']>;
export type AppDispatch = ReduxStore['dispatch'];

/** Singleton (ADR-0006): the single Redux store of the SPA. Tests use `AppStore.create()`. */
export class AppStore {
  static #instance: ReduxStore | undefined;

  private constructor() {}

  static getInstance(): ReduxStore {
    AppStore.#instance ??= createStore();
    return AppStore.#instance;
  }

  /** Fresh, isolated store (tests, storybook). */
  static create(): ReduxStore {
    return createStore();
  }
}
