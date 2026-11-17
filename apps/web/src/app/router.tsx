import { createBrowserRouter, Navigate } from 'react-router';
import { AgendaPage } from '@/features/appointments';
import { ActivityPage } from '@/features/audit';
import { ForgotPasswordPage, LoginPage, RegisterPage } from '@/features/auth';
import { BookingSettingsPage, PublicBookingPage } from '@/features/booking';
import { NewConsultationPage } from '@/features/clinical-records';
import { HealthPage } from '@/features/health';
import { PatientListPage, PatientProfilePage } from '@/features/patients';
import { PreferencesPage } from '@/features/preferences';
import { PrescriptionPage } from '@/features/prescriptions';
import { EarningsPage, FeesSettingsPage } from '@/features/reports';
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
  { path: '/book/:slug', element: <PublicBookingPage /> },
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
              { path: 'activity', element: <ActivityPage /> },
              { path: 'preferences', element: <PreferencesPage /> },
              {
                element: <RequireSession />,
                children: [
                  { path: 'booking', element: <BookingSettingsPage /> },
                  { path: 'fees', element: <FeesSettingsPage /> },
                ],
              },
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
              { path: '/reports', element: <EarningsPage /> },
              { path: '/status', element: <HealthPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
