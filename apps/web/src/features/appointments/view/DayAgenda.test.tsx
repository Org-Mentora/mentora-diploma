import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DayAgenda } from './DayAgenda';

describe('DayAgenda (View, CU-10 step 5)', () => {
  it('lists the appointments and opens one on click', () => {
    const onOpen = vi.fn();
    render(
      <DayAgenda
        title="Thursday 10 January"
        onCreate={vi.fn()}
        onOpen={onOpen}
        items={[
          {
            id: 'a-1',
            timeRange: '09:30 – 10:15',
            patientName: 'Tomás Silva',
            typeLabel: 'First visit',
            modalityLabel: 'Virtual',
            isCancelled: false,
            notes: 'Bring lab results',
          },
          {
            id: 'a-2',
            timeRange: '11:00 – 11:45',
            patientName: 'Clara Ruiz',
            typeLabel: 'Control',
            modalityLabel: 'In person',
            isCancelled: true,
            notes: null,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByText('Tomás Silva'));

    expect(onOpen).toHaveBeenCalledWith('a-1');
    expect(screen.getByText('Bring lab results')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('shows the empty agenda and the create action (CU-10 step 5 alternative)', () => {
    const onCreate = vi.fn();
    render(<DayAgenda title="Today" items={[]} onOpen={vi.fn()} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole('button', { name: /new appointment/i }));

    expect(screen.getByText('No appointments this day')).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledOnce();
  });
});
