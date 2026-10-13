import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type HealthViewModel, useHealthViewModel } from '../viewmodel/useHealthViewModel';
import { HealthPage } from './HealthPage';

vi.mock('../viewmodel/useHealthViewModel', () => ({ useHealthViewModel: vi.fn() }));

function givenViewModel(overrides: Partial<HealthViewModel>): HealthViewModel {
  const viewModel: HealthViewModel = {
    health: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(),
    ...overrides,
  };
  vi.mocked(useHealthViewModel).mockReturnValue(viewModel);
  return viewModel;
}

describe('HealthPage (View)', () => {
  it('renders whatever the ViewModel exposes', () => {
    givenViewModel({
      health: {
        label: 'All systems operational',
        tone: 'success',
        uptime: '5s',
        checkedAt: '10:00:00',
        components: [{ name: 'mongodb', isUp: true, detail: '3 ms' }],
      },
    });

    render(<HealthPage />);

    expect(screen.getByText('All systems operational')).toBeInTheDocument();
    expect(screen.getByText('mongodb')).toBeInTheDocument();
    expect(screen.getByText('3 ms')).toBeInTheDocument();
  });

  it('shows errors from the ViewModel', () => {
    givenViewModel({
      error: { code: 'NETWORK_ERROR', message: 'The server could not be reached' },
    });

    render(<HealthPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('The server could not be reached');
  });

  it('forwards the refresh intent to the ViewModel command', () => {
    const viewModel = givenViewModel({});

    render(<HealthPage />);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(viewModel.refresh).toHaveBeenCalledOnce();
  });
});
