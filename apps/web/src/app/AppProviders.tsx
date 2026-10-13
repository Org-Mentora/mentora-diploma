import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { AppStore, type ReduxStore } from './store/AppStore';

interface AppProvidersProps {
  children: ReactNode;
  store?: ReduxStore;
}

export function AppProviders({ children, store = AppStore.getInstance() }: AppProvidersProps) {
  return <Provider store={store}>{children}</Provider>;
}
