'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { useState } from 'react';

export default function SignInModal() {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const handleSignInClick = () => {
    setIsAuthenticating(true);
    // TODO: signIn.social() via BetterAuth in integration step
    // TODO: handle errors
  };

  const handleBackdropClick = () => {
    setError(null);
    setIsAuthenticating(false);
    // TODO: hide modal with onClose()
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Sign in with Google</Button>
        </CardContent>
      </Card>
    </div>
  );
}
