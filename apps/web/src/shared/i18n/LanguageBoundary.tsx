import { Fragment, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from './i18n';
import { useTranslation } from './index';

function Remount({ children }: { children: ReactNode }) {
  const { language } = useTranslation();
  return <Fragment key={language}>{children}</Fragment>;
}

export function LanguageBoundary({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <Remount>{children}</Remount>
    </I18nextProvider>
  );
}
