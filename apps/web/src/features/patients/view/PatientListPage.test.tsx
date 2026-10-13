import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  type PatientListViewModel,
  usePatientListViewModel,
} from '../viewmodel/usePatientListViewModel';
import { PatientListPage } from './PatientListPage';

vi.mock('../viewmodel/usePatientListViewModel', () => ({ usePatientListViewModel: vi.fn() }));
vi.mock('./PatientFormDialog', () => ({ PatientFormDialog: () => null }));

function givenViewModel(overrides: Partial<PatientListViewModel> = {}): PatientListViewModel {
  const vm: PatientListViewModel = {
    query: '',
    setQuery: vi.fn(),
    patients: [],
    isLoading: false,
    isSearching: false,
    error: null,
    emptyMessage: 'No patients registered yet. Add the first one.',
    isCreateOpen: false,
    setCreateOpen: vi.fn(),
    openPatient: vi.fn(),
    ...overrides,
  };
  vi.mocked(usePatientListViewModel).mockReturnValue(vm);
  return vm;
}

describe('PatientListPage (View)', () => {
  it('renders the patients exposed by the ViewModel', () => {
    const vm = givenViewModel({
      patients: [
        {
          id: 'p-1',
          fullName: 'Lucía Fernández',
          dni: '28.111.222',
          age: '41',
          phone: '—',
          healthInsurance: 'OSDE',
          statusLabel: 'Active',
          statusTone: 'success',
        },
      ],
    });

    render(<PatientListPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Lucía Fernández' }));

    expect(screen.getByText('28.111.222')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(vm.openPatient).toHaveBeenCalledWith('p-1');
  });

  it('shows the empty message and forwards search and create intents', () => {
    const vm = givenViewModel();

    render(<PatientListPage />);
    fireEvent.change(screen.getByLabelText('Search patients'), { target: { value: 'gomez' } });
    fireEvent.click(screen.getByRole('button', { name: /new patient/i }));

    expect(screen.getByText(vm.emptyMessage)).toBeInTheDocument();
    expect(vm.setQuery).toHaveBeenCalledWith('gomez');
    expect(vm.setCreateOpen).toHaveBeenCalledWith(true);
  });
});
