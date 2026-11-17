import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from '@/shared/ui/sonner';
import { AppStore } from './store/AppStore';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={AppStore.getInstance()}>
      {children}
      <Toaster position="top-right" />
    </Provider>
  );
}
