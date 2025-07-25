'use client';

import { ChatThread } from '@/components/chat/chat-thread';
import SignInModal from '@/components/sign-in/sign-in-modal';
import { useState } from 'react';

export default function ChatPage() {
  const [displaySignInModal, setDisplaySignInModal] = useState<boolean>(true);

  const handleClose = () => {
    setDisplaySignInModal(false);
  };

  return (
    <div>
      <SignInModal
        displaySignInModal={displaySignInModal}
        onClose={handleClose}
      />
      <ChatThread />
    </div>
  );
}
