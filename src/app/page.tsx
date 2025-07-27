'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatThread } from '@/components/chat/chat-thread';
import SignInModal from '@/components/sign-in/sign-in-modal';
import { authClient } from '@/lib/auth-client';

export default function ChatPage() {
  const [displaySignInModal, setDisplaySignInModal] = useState<boolean>(false);

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
