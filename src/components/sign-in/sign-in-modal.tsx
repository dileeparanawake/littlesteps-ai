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
import { ErrorAlert } from '@/components/ui/error-alert';

import { signIn } from '@/lib/sign-in';
import { authClient } from '@/lib/auth-client';

type SignInModalProps = {
  display: boolean;
  setDisplay: (value: boolean) => void;
};

export default function SignInModal({ display, setDisplay }: SignInModalProps) {
  // hooks
  const {
    data: session, //session object
    isPending, //loading state
    error: sessionError, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  // states
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // effects
  useEffect(() => {
    // If the modal is open, and we finished loading, and there's no session — show error
    if (!isPending && sessionError) {
      setError('Sign-in failed. Please try again.');
      console.log('Sign in error:', sessionError);
    }
  }, [isPending, sessionError]);

  // handlers

  const handleSignInClick = async () => {
    console.log('sign in clicked');
    setIsAuthenticating(true);
    setError(null);
    setDisplay(true);
    await signIn();
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
          {sessionError && (
            <ErrorAlert error={'Sign In Error please try again'} />
          )}
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
