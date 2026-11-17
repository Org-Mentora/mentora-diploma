import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createBrowserPlatform, PlatformContext } from '@/model/platform/Platform';
import { Toaster } from '@/shared/ui/sonner';
import { AppStore } from './store/AppStore';

interface AppProvidersProps {
  children: ReactNode;
}

const platform = createBrowserPlatform();

// Composition Root
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={AppStore.getInstance()}>
      <PlatformContext value={platform}>{children}</PlatformContext>
      <Toaster position="top-right" />
    </Provider>
  );
}
