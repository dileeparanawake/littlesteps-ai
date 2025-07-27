'use client';
import { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { signIn } from '@/lib/sign-in';
import { authClient } from '@/lib/auth-client';

type SignInModalProps = {
  display: boolean;
  setDisplay: (value: boolean) => void;
};

export default function SignInModal({ display, setDisplay }: SignInModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const handleSignInClick = async () => {
    console.log('sign in hit');
    setIsAuthenticating(true);

    signIn();
    const { data: session, error } = await authClient.getSession();
    if (session?.user) {
      console.log(`User ${session.user.email} is signed in`);
      setIsAuthenticating(false);
      setDisplay(false);
    }

    // TODO: handle errors
  };

  const handleBackdropClick = () => {
    setError(null);
    setIsAuthenticating(false);
    setDisplay(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      hidden={!display} // TODO: update to use !displaySignInModal
      onClick={handleBackdropClick}
    >
      <Card
        className="w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            disabled={isAuthenticating}
            onClick={handleSignInClick}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
