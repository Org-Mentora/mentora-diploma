import { createContext, useContext } from 'react';
import type { BrowserActions } from './BrowserActions';
import { SonnerUserFeedback } from './SonnerUserFeedback';
import type { UserFeedback } from './UserFeedback';
import { WindowBrowserActions } from './WindowBrowserActions';

export interface Platform {
  feedback: UserFeedback;
  browser: BrowserActions;
}

export function createBrowserPlatform(): Platform {
  return { feedback: new SonnerUserFeedback(), browser: new WindowBrowserActions() };
}

export const PlatformContext = createContext<Platform>(createBrowserPlatform());

export function useUserFeedback(): UserFeedback {
  return useContext(PlatformContext).feedback;
}

export function useBrowserActions(): BrowserActions {
  return useContext(PlatformContext).browser;
}
