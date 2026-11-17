# ADR-0047: Web internationalization with i18next

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** frontend, tooling
- **Supersedes:** —

## Context and problem statement

The web only had English texts, and users asked for a setting to change the language. The
product targets Argentina, so Spanish must be the default, with English kept. Texts live in
Views, ViewModels (toasts), Model adapters (labels and formatting) and zod form messages, and
some come from the API.

## Decision drivers

- Plurals, interpolation and number and date formats per language.
- Works in every MVVM layer without breaking the layer rules (ADR-0011).
- Missing keys must never break the UI.
- The API stays English (ADR-0016), so server messages need a client-side translation.

## Considered options

1. A hand-made dictionary and hook.
2. i18next + react-i18next.
3. FormatJS (react-intl).

## Decision outcome

Chosen option: **2** (`i18next` 27.1.3, `react-i18next` 18.0.2, exact versions). It has mature
plural rules and a React binding. It can also be used from plain TS adapters, which react-intl
makes awkward.

- **Adapter.** `src/shared/i18n` is the only place that imports i18next. It exports:
  - `useTranslation`, `useLanguage`, `translate`, `changeLanguage`;
  - `dateLocale()` (date-fns) and `intlLocale()` (`es-AR` / `en-GB`);
  - `localizeServerMessage()`;
  - `LanguageBoundary`.
- **Resources.**
  - `locales/en.ts` defines the keys.
  - `locales/es.ts` is typed `Messages = typeof en`, so a missing Spanish key fails the
    typecheck.
  - Plurals use the `_one` and `_other` suffixes. `nsSeparator` is off, so free text can pass
    through `t()`.
- **Language choice.**
  - The language comes from `localStorage` (`mentora.language`), then the browser, then `es`.
  - `changeLanguage` persists it and sets `<html lang>`.
  - `LanguageBoundary` remounts the routed tree on change, so `useMemo`d adapter output is
    rebuilt.
  - The choice is made in `/settings/preferences`, with a quick switcher in the header and on
    the public and auth pages.
- **Layers.**
  - Views and ViewModels call `useTranslation()`.
  - Model adapters call `translate` and `Formats`.
  - zod schemas use keys as messages, and `FormField` translates `error` and `hint`.
  - `ApiErrorAdapter` passes server messages through `localizeServerMessage`. Unknown messages
    are shown as they are.
- Tests pin the language to English in `src/test/setup.ts`.

### Consequences

- 👍 Spanish by default, and a new language is one file plus one entry in `LANGUAGES`.
- 👍 Formatting (money, dates, weekdays) follows the selected language.
- 👎 Server messages are mapped by exact text. A changed API message falls back to English
  until the map is updated.
- 👎 The preference is per browser, not per account.

## Enforcement

- Biome forbids importing `i18next` and `react-i18next` outside `src/shared/i18n`, through
  `noRestrictedImports` in the features, model and app overrides.
- TypeScript enforces key parity between `en` and `es`.
- `src/shared/i18n/i18n.test.ts` covers switching, plurals and server messages.

## References

- `apps/web/src/shared/i18n/`, `apps/web/src/features/preferences/`
- ADR-0007, ADR-0011, ADR-0016
