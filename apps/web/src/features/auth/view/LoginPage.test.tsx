import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { type LoginViewModel, useLoginViewModel } from '../viewmodel/useLoginViewModel';
import { LoginPage } from './LoginPage';

vi.mock('../viewmodel/useLoginViewModel', () => ({ useLoginViewModel: vi.fn() }));

function givenViewModel(overrides: Partial<LoginViewModel> = {}) {
  const submit = vi.fn();
  vi.mocked(useLoginViewModel).mockImplementation(() => ({
    form: useForm({ defaultValues: { email: '', password: '' } }) as LoginViewModel['form'],
    error: null,
    isSubmitting: false,
    submit,
    ...overrides,
  }));
  return { submit };
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

describe('LoginPage (View, CU-01)', () => {
  it('submits through the ViewModel command', async () => {
    const { submit } = givenViewModel();

    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@x.dev' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  });

  it('shows the invalid credentials message from the ViewModel', () => {
    givenViewModel({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
