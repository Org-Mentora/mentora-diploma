import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useChangePatientStatusMutation,
  useGetPatientQuery,
} from '@/model/api/generated/mentoraApi';
import { usePatientProfileViewModel } from './usePatientProfileViewModel';

vi.mock('@/model/api/generated/mentoraApi', () => ({
  useGetPatientQuery: vi.fn(),
  useChangePatientStatusMutation: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const changeStatus = vi.fn();

function patient(status: 'active' | 'discharged' | 'inactive') {
  return {
    id: 'p-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    fullName: 'Juan Pérez',
    dni: '30123456',
    birthDate: null,
    age: null,
    gender: null,
    phone: null,
    email: null,
    address: null,
    healthInsurance: null,
    memberNumber: null,
    familyContact: null,
    debt: 0,
    allergies: [],
    observations: null,
    status,
    statusChangedAt: '2030-01-01T00:00:00.000Z',
    statusOrigin: status === 'inactive' ? 'automatic' : 'manual',
    registeredAt: '2030-01-01T00:00:00.000Z',
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/patients/p-1']}>
      <Routes>
        <Route path="/patients/:patientId" element={children} />
      </Routes>
    </MemoryRouter>
  );
}

function render(status: 'active' | 'discharged' | 'inactive') {
  vi.mocked(useGetPatientQuery).mockReturnValue({
    data: patient(status),
    isLoading: false,
    error: undefined,
  } as unknown as ReturnType<typeof useGetPatientQuery>);
  return renderHook(() => usePatientProfileViewModel(), { wrapper });
}

describe('usePatientProfileViewModel (CU-07)', () => {
  beforeEach(() => {
    changeStatus.mockReset().mockReturnValue({
      unwrap: () => Promise.resolve(patient('discharged')),
    });
    vi.mocked(useChangePatientStatusMutation).mockReturnValue([
      changeStatus,
      { isLoading: false },
    ] as unknown as ReturnType<typeof useChangePatientStatusMutation>);
  });

  it.each([
    ['active', 'discharged', 'Discharge'],
    ['discharged', 'active', 'Reactivate'],
    ['inactive', 'active', 'Reactivate'],
  ] as const)('a %s patient can be moved to %s', (status, target, label) => {
    const { result } = render(status);
    expect(result.current.statusAction).toMatchObject({ status: target, label });
  });

  it('asks for confirmation before changing the status', async () => {
    const { result } = render('active');

    act(() => result.current.requestStatusChange());
    expect(result.current.pendingStatus?.confirmation).toContain('Discharge Juan Pérez?');
    expect(changeStatus).not.toHaveBeenCalled();

    await act(() => result.current.confirmStatusChange());
    expect(changeStatus).toHaveBeenCalledWith({
      id: 'p-1',
      changePatientStatusRequestDto: { status: 'discharged' },
    });
    expect(result.current.pendingStatus).toBeNull();
  });
});
