import { afterEach, describe, expect, it } from 'vitest';
import {
  changeLanguage,
  currentLanguage,
  intlLocale,
  localizeServerMessage,
  translate,
} from './index';

describe('i18n (language preference)', () => {
  afterEach(async () => {
    await changeLanguage('en');
  });

  it('switches the dictionary, the number locale and remembers the choice', async () => {
    await changeLanguage('es');

    expect(currentLanguage()).toBe('es');
    expect(translate('nav.patients')).toBe('Pacientes');
    expect(translate('reports.appointments', { count: 2 })).toBe('2 turnos');
    expect(intlLocale()).toBe('es-AR');
    expect(localStorage.getItem('mentora.language')).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('localizes known server messages and keeps unknown ones', async () => {
    await changeLanguage('es');

    expect(localizeServerMessage('Invalid email or password')).toBe(
      'Email o contraseña incorrectos',
    );
    expect(localizeServerMessage('This request was already accepted')).toBe(
      'Esta solicitud ya fue aceptada',
    );
    expect(localizeServerMessage('Something new: 42')).toBe('Something new: 42');
    expect(translate('Something new: 42')).toBe('Something new: 42');
  });
});
