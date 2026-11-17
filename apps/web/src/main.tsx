import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { router } from '@/app/router';
import { LanguageBoundary } from '@/shared/i18n/LanguageBoundary';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <LanguageBoundary>
        <RouterProvider router={router} />
      </LanguageBoundary>
    </AppProviders>
  </StrictMode>,
);
