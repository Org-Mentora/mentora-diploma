import { createBrowserRouter, Navigate } from 'react-router';
import { AgendaPage } from '@/features/appointments';
import { ForgotPasswordPage, LoginPage, RegisterPage } from '@/features/auth';
import { NewConsultationPage } from '@/features/clinical-records';
import { HealthPage } from '@/features/health';
import { PatientListPage, PatientProfilePage } from '@/features/patients';
import { PrescriptionPage } from '@/features/prescriptions';
import { AppShell, PublicOnly, RequireLogin, RequireSession } from '@/features/session';
import {
  ChangePasswordPage,
  PlanSettingsPage,
  ProfileSettingsPage,
  SettingsLayout,
} from '@/features/settings';

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  { path: '/plan-expired', element: <Navigate to="/settings/plan" replace /> },
  {
    element: <RequireLogin />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="/settings/profile" replace /> },
              { path: 'profile', element: <ProfileSettingsPage /> },
              { path: 'password', element: <ChangePasswordPage /> },
              { path: 'plan', element: <PlanSettingsPage /> },
            ],
          },
          {
            element: <RequireSession />,
            children: [
              { index: true, element: <Navigate to="/patients" replace /> },
              { path: '/patients', element: <PatientListPage /> },
              { path: '/patients/:patientId', element: <PatientProfilePage /> },
              { path: '/patients/:patientId/consultations/new', element: <NewConsultationPage /> },
              { path: '/patients/:patientId/prescriptions/new', element: <PrescriptionPage /> },
              { path: '/agenda', element: <AgendaPage /> },
              { path: '/status', element: <HealthPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
