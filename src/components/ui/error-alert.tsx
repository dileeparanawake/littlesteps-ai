'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ErrorAlert({ error }: { error: string | null }) {
  return (
    <div className="mb-2">
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  );
}
