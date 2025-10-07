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

import { useModal } from '@/components/providers/ModalProvider';

export default function SignInModal() {
  // hooks
  const {
    isPending, //loading state
    error: sessionError, //error object
  } = authClient.useSession();
  const { showSignIn, setShowSignIn } = useModal();
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

  useEffect(() => {
    if (!showSignIn) {
      setError(null);
      setIsAuthenticating(false);
    }
  }, [showSignIn]);

  // handlers

  const handleSignInClick = async () => {
    console.log('sign in clicked');
    setIsAuthenticating(true);
    setError(null);
    setShowSignIn(true);
    await signIn();
  };

  const handleBackdropClick = () => {
    setError(null);
    setIsAuthenticating(false);
    setShowSignIn(false);
  };

  const hide = !showSignIn;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      hidden={hide} // TODO: update to use !displaySignInModal
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
          {sessionError && <ErrorAlert error={error} />}
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
