'use client';

import { ChatThread } from '@/components/chat/chat-thread';
import SignInModal from '@/components/sign-in/sign-in-modal';
import { useState } from 'react';

export default function ChatPage() {
  // const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); NOTE: not needed auth will handle this.

  return (
    <div>
      <SignInModal />
      <ChatThread />
    </div>
  );
}
