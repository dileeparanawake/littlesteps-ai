'use client';

import { ChatThread } from '@/components/chat/chat-thread';
import SignInModal from '@/components/sign-in/sign-in-modal';
import { useState } from 'react';

export default function ChatPage() {
  const [displaySignInModal, setDisplaySignInModal] = useState<boolean>(false);

  return (
    <div>
      <SignInModal />
      <ChatThread />
    </div>
  );
}
