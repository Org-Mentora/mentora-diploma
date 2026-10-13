import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
}

export function AuthLayout({ title, description, children, footer, wide }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-sm'}>
        <p className="mb-6 text-center font-semibold text-xl tracking-tight">Mentora</p>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">{children}</CardContent>
        </Card>
        <p className="mt-4 text-center text-muted-foreground text-sm">{footer}</p>
      </div>
    </div>
  );
}
