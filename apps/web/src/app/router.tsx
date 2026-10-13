import { createBrowserRouter, Navigate } from 'react-router';
import { AgendaPage } from '@/features/appointments';
import { LoginPage, RegisterPage } from '@/features/auth';
import { NewConsultationPage } from '@/features/clinical-records';
import { HealthPage } from '@/features/health';
import { PatientListPage, PatientProfilePage } from '@/features/patients';
import { AppShell, PublicOnly, RequireSession, SubscriptionExpiredPage } from '@/features/session';

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  { path: '/plan-expired', element: <SubscriptionExpiredPage /> },
  {
    element: <RequireSession />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/patients" replace /> },
          { path: '/patients', element: <PatientListPage /> },
          { path: '/patients/:patientId', element: <PatientProfilePage /> },
          { path: '/patients/:patientId/consultations/new', element: <NewConsultationPage /> },
          { path: '/agenda', element: <AgendaPage /> },
          { path: '/status', element: <HealthPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
