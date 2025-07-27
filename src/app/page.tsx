'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { ChatThread } from '@/components/chat/chat-thread';
import SignInModal from '@/components/sign-in/sign-in-modal';

import { authClient } from '@/lib/auth-client';

export default function ChatPage() {
  // hooks
  const {
    data: session,
    isPending,
    error: sessionError,
    refetch,
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
  }, [isPending, sessionError]);

  // handlers
  const handleSignOut = async (): Promise<void> => {
    await authClient.signOut();
    console.log('signed out');
  };

  return (
    <div>
      <Button onClick={handleSignOut}>Sign Out</Button>
      <p>text</p>
      <SignInModal
        display={displaySignInModal}
        setDisplay={setDisplaySignInModal}
      />
      <ChatThread setDisplaySignInModal={setDisplaySignInModal} />
    </div>
  );
}
