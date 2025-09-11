'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { ChatThread } from '@/components/chat/ChatThread';
import SignInModal from '@/components/sign-in/sign-in-modal';

import { authClient } from '@/lib/auth-client';

export default function ChatPage() {
  // hooks
  const {
    data: session,
    isPending,
    error: sessionError,
  } = authClient.useSession();

  // states
  const [displaySignInModal, setDisplaySignInModal] = useState<boolean>(false);

  // effects

  useEffect(() => {
    // If the modal is open, and we finished loading, and there's no session — show error
    if (!isPending && sessionError) {
      setDisplaySignInModal(true);
      console.log(`session: ${session?.user}`);
      console.log(`isPending: ${isPending}`);
      console.log(`sessionError: ${sessionError}`);
    }
  }, [isPending, sessionError, session?.user]);

  // handlers
  const handleSignOut = async (): Promise<void> => {
    await authClient.signOut();
    console.log('signed out');
  };

  return (
    <div>
      <header className="sticky top-0 z-40 flex  justify-between p-4">
        <h1 className="text-lg font-semibold leading-none">LittleSteps AI</h1>
        {session?.user && (
          <Button
            variant="link"
            className="text-muted-foreground p-0 h-auto leading-none"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        )}
      </header>
      <main className="flex flex-col items-center justify-center h-screen">
        <SignInModal
          display={displaySignInModal}
          setDisplay={setDisplaySignInModal}
        />
        <ChatThread setDisplaySignInModal={setDisplaySignInModal} />
      </main>
    </div>
  );
}
