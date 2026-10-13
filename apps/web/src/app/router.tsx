import { createBrowserRouter } from 'react-router';
import { HealthPage } from '@/features/health';
import { RootLayout } from './RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [{ index: true, element: <HealthPage /> }],
  },
]);
