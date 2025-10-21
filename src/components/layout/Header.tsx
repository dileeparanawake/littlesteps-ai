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
      console.log(`session: ${session?.user}`);
      console.log(`isPending: ${isPending}`);
      console.log(`sessionError: ${sessionError}`);
    }
  }, [isPending, sessionError, session?.user]);

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
    <header className="sticky top-0 z-50 flex justify-between items-center p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-">
      <h1 className="text-lg font-semibold leading-none">
        <Link
          href="/"
          className="no-underline text-foreground hover:underline hover:text-primary transition-colors"
        >
          LittleSteps AI
        </Link>
      </h1>
      <Button
        variant="link"
        className="text-muted-foreground p-0 h-auto leading-none"
        onClick={handleClick}
        disabled={disabled}
        aria-busy={disabled}
      >
        {label}
      </Button>
    </header>
  );
}
