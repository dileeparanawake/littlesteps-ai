'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { authClient } from '@/lib/auth-client';
import { useModal } from '../providers/ModalProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  // hooks
  const {
    data: session,
    isPending,
    error: sessionError,
  } = authClient.useSession();
  const { setShowSignIn } = useModal();

  // states
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const router = useRouter();
  // effects
  useEffect(() => {
    // If the modal is open, and we finished loading, and there's no session — show error
    if (!isPending && sessionError) {
      setShowSignIn(true);
    }
  }, [isPending, sessionError, session?.user, setShowSignIn]);

  // handlers
  const handleClick = async () => {
    if (session?.user) {
      setIsSigningOut(true);
      try {
        await authClient.signOut();
      } finally {
        setIsSigningOut(false);
        router.push('/chat');
      }
    } else {
      setShowSignIn(true);
    }
  };

  const label = session?.user ? 'Log out' : 'Log in';
  const disabled = isPending || isSigningOut;

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-gray-100/80 backdrop-blur-md supports-[backdrop-filter]:bg-gray-100/80 border-b border-border/50">
      <h1 className="text-xl font-bold leading-none tracking-tight">
        <Link
          href="/"
          className="no-underline text-foreground hover:text-primary transition-colors duration-200"
        >
          LittleSteps AI
        </Link>
      </h1>
      <Button
        aria-label={session?.user ? 'Log out' : 'Log in'}
        variant="ghost"
        size="sm"
        className="text-muted-foreground  hover:text-primary transition-colors duration-200"
        onClick={handleClick}
        disabled={disabled}
        aria-busy={disabled}
      >
        {label}
      </Button>
    </header>
  );
}
