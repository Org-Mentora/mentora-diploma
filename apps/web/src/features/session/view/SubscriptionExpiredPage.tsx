import { Navigate } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useSessionViewModel } from '../viewmodel/useSessionViewModel';

/** CU-01 step 7 alternative: the trial ended, access is restricted until a plan is chosen. */
export function SubscriptionExpiredPage() {
  const { state, session, logout, isLoggingOut } = useSessionViewModel();

  if (state === 'anonymous') {
    return <Navigate to="/login" replace />;
  }
  if (state === 'active') {
    return <Navigate to="/patients" replace />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Your free trial has ended</CardTitle>
          <CardDescription>
            {session ? `${session.professionalName}, your data is safe.` : 'Your data is safe.'}{' '}
            Plan management (CU-18) is not available in this MVP yet; contact the Mentora team to
            extend your access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void logout()} disabled={isLoggingOut}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
