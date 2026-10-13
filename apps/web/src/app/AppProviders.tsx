import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from '@/shared/ui/sonner';
import { AppStore, type ReduxStore } from './store/AppStore';

interface AppProvidersProps {
  children: ReactNode;
  store?: ReduxStore;
}

export function AppProviders({ children, store = AppStore.getInstance() }: AppProvidersProps) {
  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" />
    </Provider>
  );
}
