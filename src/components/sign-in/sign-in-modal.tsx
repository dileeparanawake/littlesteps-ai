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

import { signIn } from '@/lib/sign-in';

type SignInModalProps = {
  displaySignInModal: boolean;
  onClose: () => void;
};

export default function SignInModal({
  displaySignInModal,
  onClose,
}: SignInModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const handleSignInClick = async () => {
    setIsAuthenticating(true);

    try {
      await signIn();
    } catch (error) {
      console.error(error);
    }

    // TODO: signIn.social() via BetterAuth in integration step
    // TODO: handle errors
    onClose();
  };

  const handleBackdropClick = () => {
    setError(null);
    setIsAuthenticating(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      hidden={!displaySignInModal} // TODO: update to use !displaySignInModal
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-sm shadow-lg">
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
