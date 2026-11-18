import { useCallback } from 'react';
import { useUserFeedback } from '@/model/platform/Platform';
import { ApiErrorAdapter } from './ApiErrorAdapter';

export interface ActionMessages<TResult> {
  success?: string | ((result: TResult) => string);
  failure: string;
}

export type RunAction = <TResult>(
  action: () => Promise<TResult>,
  messages: ActionMessages<TResult>,
) => Promise<TResult | undefined>;

export function useAction(): RunAction {
  const feedback = useUserFeedback();
  return useCallback<RunAction>(
    async (action, { success, failure }) => {
      try {
        const result = await action();
        if (success) {
          feedback.success(typeof success === 'function' ? success(result) : success);
        }
        return result;
      } catch (caught) {
        feedback.error(ApiErrorAdapter.messageOf(caught, failure));
        return undefined;
      }
    },
    [feedback],
  );
}
