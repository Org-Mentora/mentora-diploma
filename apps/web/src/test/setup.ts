import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
import { changeLanguage } from '@/shared/i18n';

beforeAll(async () => {
  await changeLanguage('en');
});

afterEach(() => {
  cleanup();
});
